///<reference path="ExternalFragment.ts" />
///<reference path="../globals.d.ts" />
class CourseSidebar extends ExternalFragment<{
    urlChange: {
        url: string
        lessonID: number
        screenID: number
        slide: number
    }
}> {
    container: HTMLElement
    collapseToggler: ClassToggler
    changeURLInterval
    lastURLUpdate: number

    constructor() {
        super('https://lek.wiecejnizlek.pl/app/courses/1/', '.course-sidenav>div')
        this.prepareContainer()
        this.addEventListener(
            'loaded',
            el => {
                if (!el) return
                this.container.append(el)
            }
        )
        this.setupOpenLinks()
    }

    static CONTAINER_HTML = `
    <a>
        ${SVGIcons.chevronUp}
        <span>CAŁY KURS</span>
    </a>`

    private setupOpenLinks() {
        this.lastURLUpdate = Date.now()
        const urlRegExp = /lek.wiecejnizlek.pl\/app\/courses\/1\/lessons\/([0-9]+)\/([0-9]+)\/([0-9]+)/
        this.addEventListener('iframeURLChange', newURL => {
            const now = Date.now()
            console.log({now})
            if (now - this.lastURLUpdate < 500) return
            const matching = urlRegExp.exec(newURL)
            if (!matching) return
            this.trigger('urlChange', {
                url: newURL,
                lessonID: parseInt(matching[1]),
                screenID: parseInt(matching[2]),
                slide: parseInt(matching[3]),
            })
            this.load()
        })
    }

    private prepareContainer() {        
        this.container = document.createElement('div')
        this.container.innerHTML = CourseSidebar.CONTAINER_HTML
        this.container.classList.add('custom-main-nav-container')
        this.collapseToggler = new ClassToggler('active', this.container)
        this.container.querySelector('a').addEventListener(
            'click', () => this.collapseToggler.toggle()
        )
        // sidenav.prepend(this.container)
    }

    attach(parent: Element) {        
        parent.prepend(this.container)
    }

    show() {
        this.container && (this.container.style.display = '')
    }

    hide() {
        this.container && (this.container.style.display = 'none')
    }

    destroy(): void {
        this.container.remove()
        super.destroy()
    }
}