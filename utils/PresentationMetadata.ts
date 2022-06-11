///<reference path="enums.ts" />
///<reference path="common.ts" />
///<reference path="ChapterMetadata.ts" />

interface PresentationEvents {
    slideChange: number
    screenidChange: number
    lessonidChange: number
}

class PresentationMetadata extends CustomEventEmmiter<PresentationEvents> {
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
        return document.querySelector(SELECTORS.appDiv)
    }

    private observer: MutationObserver   
    private getAttrVal(name: string) {
        const el = document.querySelector(`[${name}]`)
        const attr = el && el.attributes.getNamedItem(name) 
        return attr ? attr.value : null
    }

    get slideNumber(): number {      
        const n = this.getAttrVal('slide')
        return parseInt(n) 
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
        return parseInt(this.getAttrVal('screenid'))
    }

    public get presentationName(): string {
        const mainHeaderElem = document.querySelector('.o-lesson__title__left__header') as HTMLElement
        return mainHeaderElem && 
                mainHeaderElem.textContent && 
                mainHeaderElem.textContent.trim()
    }

    public get slideTitle(): string {
        const currentTitleHeader = document.querySelector('.present .sl-block-content h2')
        return currentTitleHeader && 
                currentTitleHeader.textContent && 
                currentTitleHeader.textContent.trim() 
    }
    
    get lessonID(): number {
        return parseInt(this.getAttrVal('lesson-id'))
    }

    private createObserver() {
        this.observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                const value = this.getAttrFromMutation(mutation)
                switch (mutation.attributeName) {
                    case 'screenid':
                        this.trigger('screenidChange', parseInt(value))
                        break

                    case 'slide':
                        this.trigger('slideChange', parseInt(value))
                        break
                }
            }
        });
    }

    private getAttrFromMutation(mutation: MutationRecord) {
        const attr = (mutation.target as Element).attributes.getNamedItem(mutation.attributeName)
        return attr ? attr.value : null
    }

    stopObserving() {
        this.observer.disconnect()
    }
}

// const presentationMetadata = new PresentationMetadata()