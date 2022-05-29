document = unsafeWindow.document
let toRunOnLoaded: Function[] = [], summaryContainer: HTMLDivElement
let slideOptionsContainer: HTMLDivElement, additionalOptionsContainer: HTMLDivElement
let options: Options, tools: Options, chapterMetadata: SlideshowChapterMetadata[]
let currentSlideNumber: number, presentationScreenID: number, presentationName: string, currentSlideTitle: string
let notesCollection: PresentationNotesCollection, currentSlideNotes: SlideNotesCollection

let slideNumberObserver: MutationObserver, slideObserver: MutationObserver

const inSVG = (s: TemplateStringsArray) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">${s[0]}</svg>`
const svgIcons = {
    chevronUp: inSVG`<path fill-rule="evenodd" d="M7.776 5.553a.5.5 0 0 1 .448 0l6 3a.5.5 0 1 1-.448.894L8 6.56 2.224 9.447a.5.5 0 1 1-.448-.894l6-3z"/>`,
    dots: inSVG`<path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>`,
    search: inSVG`<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>`,
    zoomIn: inSVG`<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
                <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
                <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/>`,
    zoomOut: inSVG`<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
                <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
                <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>`,
    stickies: inSVG`<path d="M1.5 0A1.5 1.5 0 0 0 0 1.5V13a1 1 0 0 0 1 1V1.5a.5.5 0 0 1 .5-.5H14a1 1 0 0 0-1-1H1.5z"/>
                <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v11A1.5 1.5 0 0 0 3.5 16h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 16 9.586V3.5A1.5 1.5 0 0 0 14.5 2h-11zM3 3.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V9h-4.5A1.5 1.5 0 0 0 9 10.5V15H3.5a.5.5 0 0 1-.5-.5v-11zm7 11.293V10.5a.5.5 0 0 1 .5-.5h4.293L10 14.793z"/>`,
    stickiesFill: inSVG`<path d="M0 1.5V13a1 1 0 0 0 1 1V1.5a.5.5 0 0 1 .5-.5H14a1 1 0 0 0-1-1H1.5A1.5 1.5 0 0 0 0 1.5z"/>
                <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v11A1.5 1.5 0 0 0 3.5 16h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 16 9.586V3.5A1.5 1.5 0 0 0 14.5 2h-11zm6 8.5a1 1 0 0 1 1-1h4.396a.25.25 0 0 1 .177.427l-5.146 5.146a.25.25 0 0 1-.427-.177V10.5z"/>`,
    plusSquare: inSVG`<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>`,
    trash: inSVG`<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>`,
    move: inSVG`<path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10zM.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708l-2-2zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8z"/>`,
    eraserFill: inSVG`<path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z"/>`,
    viewList: inSVG`<path d="M3 4.5h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H3zM1 2a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 2zm0 12a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 14z"/>`,
    layoutChaotic: inSVG`<path d="M5 1v8H1V1h4zM1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm13 2v5H9V2h5zM9 1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9zM5 13v2H3v-2h2zm-2-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3zm12-1v2H9v-2h6zm-6-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H9z"/>`,
    viewStack: inSVG`<path d="M3 0h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3zm0 8h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H3z"/>`,
}

const zoomSliderHTML = `
    <div class='${CLASS_NAMES.zoomSliderContainer}'>
        <label class="metadata">POWIĘKSZENIE</label>
        <div style="text-align: right;">
            <input class="${CLASS_NAMES.fontSizeInput}" 
                type="range" size="3" maxlength="3" min="70" max="200" 
                step="5">
            <a class="${CLASS_NAMES.fontSizeInput}-decrease">${svgIcons.zoomOut}</a>
            <span class="${CLASS_NAMES.fontSizeLabel}">120%</span>
            <a class="${CLASS_NAMES.fontSizeInput}-increase">${svgIcons.zoomIn}</a>
        </div>
    </div>`

function toggleBodyClass(className: string, isOn: boolean) {
    let body = document.body
    if (isOn) body.classList.add(className)
    else body.classList.remove(className)
}

const getUniformFontSize = fontSize => (fontSize - 100) * 0.01 + 0.93
const root = unsafeWindow.document.querySelector(":root") as HTMLElement
const updateFontSize = (fontSize: number) => {
    root.style.setProperty("--uniform-font-size", `${getUniformFontSize(fontSize)}em`)
    root.style.setProperty("--scaled-font-size", `${fontSize}%`)
}

class ClassToggler {

    constructor(
        public className: string,
        private _elementOrSelector: Element | string = document.body,
        public onchange?: (toggler: ClassToggler) => any
    ) {
        this._state = this.element && this.element.classList.contains(className)
    }
    private _state: boolean

    get element() {
        if (typeof this._elementOrSelector === 'string') {
            return document.querySelector(this._elementOrSelector)
        }
        return this._elementOrSelector
    }

    get state() {
        return this._state
    }

    set state(val: boolean) {
        if (this._state === val) return
        this._state = val
        if (this.onchange) this.onchange(this)
        if (val) {
            this.element && this.element.classList.add(this.className)
        } else {
            this.element && this.element.classList.remove(this.className)
        }
    }

    toggle() {
        this.state = !this.state
    }
}

function toggleSummary(visible?: boolean) {
    if (!summaryContainer) return
    if (typeof visible === 'undefined') visible = summaryContainer.className.includes('custom-script-hidden')
    if (visible) {
        summaryContainer.classList.remove('custom-script-hidden')
        const activeLink = summaryContainer.querySelector('.active') as HTMLElement
        if (activeLink) {
            activeLink.scrollIntoView({ behavior: "smooth" })
        }
    }
    else summaryContainer.classList.add('custom-script-hidden')
}

function toggleOptions(visible?: boolean) {
    if (!additionalOptionsContainer) return
    const toggleBtn = document.querySelector('a.custom-options-btn')
    if (typeof visible === 'undefined') visible = additionalOptionsContainer.className.includes('custom-script-hidden')
    if (visible) {
        additionalOptionsContainer.classList.remove('custom-script-hidden')
        toggleBtn.classList.add('active')
    }
    else {
        additionalOptionsContainer.classList.add('custom-script-hidden')
        toggleBtn.classList.remove('active')
    }
}

function goToPage(page: number) {
    const pageNumberInput = document.querySelector('.wnl-slideshow-controls input[type=number]') as HTMLInputElement
    pageNumberInput.value = page.toString()
    pageNumberInput.dispatchEvent(new InputEvent('input'))
}

function onAttributeChange(element: Element, attributeName: string, callback: (attributeValue: string) => any) {
    const obs = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.attributeName === attributeName) {
                const attr = (mutation.target as Element).attributes.getNamedItem(attributeName)
                callback(attr ? attr.value : null)
            }
            // console.log({mutation})
        }
    });
    obs.observe(element, {
        attributes: true
    });
    return obs
}

function downloadFile(mimetype: string, name: string, data: string) {
    const dataStr = `data:${mimetype};charset=utf-8,${encodeURIComponent(data)}`
    let dlAnchorElem = document.getElementById('downloadAnchorElem');
    if (!dlAnchorElem) {
        dlAnchorElem = document.createElement('a')
        dlAnchorElem.id = 'downloadAnchorElem'
        dlAnchorElem.style.display = 'none'
        document.body.append(dlAnchorElem)
    }
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", name);
    dlAnchorElem.click();
}