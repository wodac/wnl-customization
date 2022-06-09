///<reference path="../interfaces.d.ts" />
///<reference path="CustomEventEmmiter.ts" />
///<reference path="PresentationMetadata.ts" />
///<reference path="TabOpener.ts" />

document = unsafeWindow.document

const WNL_LESSON_LINK = 'https://lek.wiecejnizlek.pl/app/courses/1/lessons'
const inSVG = (s: TemplateStringsArray) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">${s[0]}</svg>`
const SVGIcons = {
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
    removeCircle: inSVG`<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>`,
    plusCircle: inSVG`<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>`,
    tags: inSVG`<path d="M3 2v4.586l7 7L14.586 9l-7-7H3zM2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2z"/>
    <path d="M5.5 5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM1 7.086a1 1 0 0 0 .293.707L8.75 15.25l-.043.043a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 0 7.586V3a1 1 0 0 1 1-1v5.086z"/>`,
    tagsFill: inSVG`<path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2zm3.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
    <path d="M1.293 7.793A1 1 0 0 1 1 7.086V2a1 1 0 0 0-1 1v4.586a1 1 0 0 0 .293.707l7 7a1 1 0 0 0 1.414 0l.043-.043-7.457-7.457z"/>`,
    addTag: inSVG`<path d="m2.7323 2.684v4.586l7 7 4.586-4.586-7-7zm-1 0a1 1 0 0 1 1-1h4.586a1 1 0 0 1 0.707 0.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7a1 1 0 0 1-0.293-0.707z"/>
    <path d="m8.0118 6.3688c0.27243 0 0.49328 0.22085 0.49328 0.49328v0.56847h0.68583c0.65771 0 0.65771 0.98657 0 0.98657h-0.68583v0.67116c0 0.65771-0.98657 0.65771-0.98657 0v-0.67116h-0.64182c-0.65771 0-0.65771-0.98657 0-0.98657h0.64182v-0.56847c0-0.27243 0.22085-0.49328 0.49328-0.49328z" stroke-width=".99963"/>
    <ellipse cx="8" cy="8" rx="2.25" ry="2.25" fill="none" opacity="1" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"/>`,
    pallete: inSVG`<path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
    <path d="M16 8c0 3.15-1.866 2.585-3.567 2.07C11.42 9.763 10.465 9.473 10 10c-.603.683-.475 1.819-.351 2.92C9.826 14.495 9.996 16 8 16a8 8 0 1 1 8-8zm-8 7c.611 0 .654-.171.655-.176.078-.146.124-.464.07-1.119-.014-.168-.037-.37-.061-.591-.052-.464-.112-1.005-.118-1.462-.01-.707.083-1.61.704-2.314.369-.417.845-.578 1.272-.618.404-.038.812.026 1.16.104.343.077.702.186 1.025.284l.028.008c.346.105.658.199.953.266.653.148.904.083.991.024C14.717 9.38 15 9.161 15 8a7 7 0 1 0-7 7z"/>`,

}

const zoomSliderHTML = `
    <div class='${CLASS_NAMES.zoomSliderContainer}'>
        <label class="metadata">POWIĘKSZENIE</label>
        <div style="text-align: right;">
            <input class="${CLASS_NAMES.fontSizeInput}" 
                type="range" size="3" maxlength="3" min="70" max="200" 
                step="5">
            <a class="${CLASS_NAMES.fontSizeInput}-decrease">${SVGIcons.zoomOut}</a>
            <span class="${CLASS_NAMES.fontSizeLabel}">120%</span>
            <a class="${CLASS_NAMES.fontSizeInput}-increase">${SVGIcons.zoomIn}</a>
        </div>
    </div>`

function toggleBodyClass(className: string, isOn: boolean) {
    let body = document.body
    if (isOn) body.classList.add(className)
    else body.classList.remove(className)
}

function getForegroundColor(hex: string) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);

    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
        ? '#000000'
        : '#FFFFFF';
}

function getRandomElement<T>(a: T[]) {
    if (!a || !a.length) return
    const i = Math.random() * a.length
    return a[Math.floor(i)]
}

const getUniformFontSize = fontSize => (fontSize - 100) * 0.01 + 0.93
const root = unsafeWindow.document.querySelector(":root") as HTMLElement
const updateFontSize = (fontSize: number) => {
    root.style.setProperty("--uniform-font-size", `${getUniformFontSize(fontSize)}em`)
    root.style.setProperty("--scaled-font-size", `${fontSize}%`)
}

class ClassToggler {
    private _unresolved = false

    constructor(
        public className: string,
        private _elementOrSelector: Element | string = document.body,
        public onchange?: (toggler: ClassToggler) => any
    ) {
        if (this.element) this._getClassState()
        else this._unresolved = true
    }
    private _state: boolean

    private _getClassState() {
        this._state = this.element.classList.contains(this.className)
    }

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
        if (this._unresolved) this._getClassState()
        this.state = !this.state
    }
}

namespace Toggles {
    export const summaryHidden = new ClassToggler('custom-script-hidden', '.custom-script-summary', t => {
        if (!t.state) {
            const summaryContainer = document.querySelector('custom-script-summary')
            if (!summaryContainer) return
            summaryContainer.classList.remove('custom-script-hidden')
            const activeLink = summaryContainer.querySelector('.active') as HTMLElement
            if (activeLink) {
                activeLink.scrollIntoView({ behavior: "smooth" })
            }
        }
    })

    export const searchHidden = new ClassToggler('custom-script-hidden', '.custom-script-search', t => {
        if (!t.state) setTimeout(() => {
            (document.querySelector('.custom-script-search input.custom-search-result') as HTMLInputElement).focus()
        }, 100)
    })

    const optionsHidden = new ClassToggler('custom-script-hidden', '.custom-script-additional-options')
    export const optionsActive = new ClassToggler('active', 'a.custom-options-btn', t => {
        optionsHidden.state = !t.state
    })
}

function downloadFile(mimetype: string, name: string, data: string | Buffer) {
    let dataText: string
    if (typeof data === 'string') dataText = data
    else {
        dataText = data.toString()
    }
    const dataStr = `data:${mimetype};charset=utf-8,${encodeURIComponent(dataText)}`
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

function toggleFullscreen() {
    setTimeout(
        () => document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'f', altKey: false, bubbles: true,
            cancelable: true, charCode: 0, code: "KeyF",
            composed: true, ctrlKey: false, detail: 0,
            isComposing: false, keyCode: 70, location: 0,
            metaKey: false, repeat: false, shiftKey: false
        })),
        10
    )
}

function getIndexedDB(name: string, version: number, setupCb: (ev: IDBVersionChangeEvent, db: IDBDatabase) => IDBObjectStore) {
    return new Promise<IDBDatabase>((resolve, reject) => {
        var request = indexedDB.open(name, version);
        request.addEventListener('error', ev => {
            reject('Unable to open database')
        })
        request.addEventListener('upgradeneeded', function (ev) {
            const db = this.result
            const store = setupCb(ev, db)
            store.transaction.addEventListener('complete', function () {
                resolve(db)
            })
        })
        request.addEventListener('success', function () {
            const db = this.result
            db.onerror = event => {
                console.error("Database error: " + (event.target as any).errorCode);
            }
            resolve(db)
        })
    })
}

function updateTabTitle() {
    if (GM_getValue('option_changeTitle') && presentationMetadata) {
        let mainTitle: string
        mainTitle = presentationMetadata.presentationName 
        mainTitle = mainTitle && mainTitle.match(/\w/) ? `${mainTitle} - ` : ''

        let slideTitle = presentationMetadata.slideTitle 
        slideTitle = slideTitle && slideTitle.match(/\w/) ? `${slideTitle} - ` : ''

        const originalTitle = 'LEK - Kurs - Więcej niż LEK'
        document.title = slideTitle + mainTitle + originalTitle
    }
}