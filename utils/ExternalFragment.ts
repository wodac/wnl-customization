import CustomEventEmmiter, { EventsInterface } from "./CustomEventEmmiter"

export namespace ExternalFragment {
    export type BaseEvents = {
        loaded: Element | null
        iframeURLChange: string
    }
    export type Events<Evts> = Evts extends BaseEvents ? Evts : BaseEvents & Omit<Evts, keyof BaseEvents>
}
export class ExternalFragment<Events extends Omit<EventsInterface, "loaded" | "iframeURLChange">>
    extends CustomEventEmmiter<ExternalFragment.Events<Events>> {
    element: HTMLElement | null
    iframe: HTMLIFrameElement | null
    childWindow: Window | null
    triesLeft: number
    url: string
    interval: NodeJS.Timer

    constructor(private initialURL: string, private selector: string) {
        super()
        this.iframe = document.createElement('iframe')
        this.iframe.width = '1300'
        this.iframe.height = '800'
        this.iframe.style.position = 'absolute'
        this.iframe.style.bottom = '100vh'
        document.body.append(this.iframe)
        this.load()
    }

    load() {
        if (!this.iframe) return
        if (this.interval) clearInterval(this.interval)
        if (this.element) this.element.remove()
        this.iframe.src = this.initialURL
        this.triesLeft = 20
        this.iframe.addEventListener('load', async (ev) => {
            this.element = await this.getElement()
            this.setupURLChangeDetection()
            this.trigger('loaded', this.element)
        }, { once: true })
        this.childWindow = this.iframe.contentWindow
    }

    getElement() {   
        if (!this.iframe) return null
        this.iframe.hidden = false
        return new Promise<HTMLElement | null>(
            resolve => {
                if (!this.iframe) return resolve(null)
                const doc = this.iframe.contentDocument
                if (!doc) return resolve(null)
                const interval = setInterval(() => {
                    const element = doc.querySelector(this.selector) as HTMLElement
                    if (!element && this.triesLeft--) return
                    clearInterval(interval)
                    this.iframe && (this.iframe.hidden = true)
                    resolve(element)
                }, 100)
            }
        )
    }

    setupURLChangeDetection() {
        if (!this.childWindow) return
        this.url = this.childWindow.location.href
        this.interval = setInterval(() => {
            if (!this.childWindow) return
            if (this.url === this.childWindow.location.href) return
            this.url = this.childWindow.location.href
            console.log({ changedURL: this.url })
            this.trigger('iframeURLChange', this.url)
        }, 100)
    }

    destroy() {
        clearInterval(this.interval)
        this.iframe && this.iframe.remove()
        if (this.element) this.element.remove()
        this.element = this.iframe = this.childWindow = null
        this.url = ''
    }
}