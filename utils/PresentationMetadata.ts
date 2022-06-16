import App from "../App"
import SlideshowChapters from "./ChapterMetadata"
import CustomEventEmmiter from "./CustomEventEmmiter"
import { SELECTORS } from './enums'

interface PresentationEvents {
    slideChange: number
    screenidChange: number
    lessonidChange: number
}

export default class PresentationMetadata extends CustomEventEmmiter<PresentationEvents> {
    slideshowChapters: SlideshowChapters

    constructor(public app: App) {
        super()
        this.createObserver()
        this.slideshowChapters = new SlideshowChapters(app)
    }    

    observe() {
        this.observer.observe(this.appDiv, { attributes: true })
        this.addEventListener('slideChange', slide => this.slideshowChapters.setCurrentPage(slide))
    }

    get appDiv() {
        return document.querySelector(SELECTORS.appDiv) as HTMLDivElement
    }

    private observer: MutationObserver   
    private getAttrVal(name: string) {
        const el = document.querySelector(`[${name}]`)
        const attr = el && el.attributes.getNamedItem(name) 
        return attr ? attr.value : null
    }

    get slideNumber(): number {      
        const n = this.getAttrVal('slide')
        return n ? parseInt(n) : NaN
    }

    set slideNumber(n: number) {
        const nInput = document.querySelector('.wnl-slideshow-controls input[type=number]') as HTMLInputElement
        if (nInput) {
            nInput.value = n.toString()
            nInput.dispatchEvent(new InputEvent('input'))
        } else {
            throw Error('Unable to set slide number!')
        }
    }

    get screenID(): number {
        const screenid = this.getAttrVal('screenid')
        return screenid ? parseInt(screenid) : NaN
    }

    public get presentationName(): string | null {
        const mainHeaderElem = document.querySelector('.o-lesson__title__left__header') as HTMLElement
        return mainHeaderElem && 
                mainHeaderElem.textContent && 
                mainHeaderElem.textContent.trim()
    }

    public get slideTitle(): string | null {
        const currentTitleHeader = document.querySelector('.present .sl-block-content h2')
        return currentTitleHeader && 
                currentTitleHeader.textContent && 
                currentTitleHeader.textContent.trim() 
    }
    
    get lessonID(): number {
        const lessonID = this.getAttrVal('lesson-id')
        return lessonID ? parseInt(lessonID) : NaN
    }

    private createObserver() {
        this.observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                const value = this.getAttrFromMutation(mutation)
                switch (mutation.attributeName) {
                    case 'screenid':
                        this.trigger('screenidChange', value ? parseInt(value) : NaN)
                        break

                    case 'slide':
                        this.trigger('slideChange', value ? parseInt(value) : NaN)
                        break
                }
            }
        });
    }

    private getAttrFromMutation(mutation: MutationRecord) {
        const attr = (mutation.target as Element).attributes.getNamedItem(mutation.attributeName as string)
        return attr ? attr.value : null
    }

    stopObserving() {
        this.observer.disconnect()
    }
}

// const presentationMetadata = new PresentationMetadata()