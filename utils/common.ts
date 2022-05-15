document = unsafeWindow.document
let toRunOnLoaded: Function[] = [], summaryContainer: HTMLDivElement
let slideOptionsContainer: HTMLDivElement, additionalOptionsContainer: HTMLDivElement
let options: Options, tools: Options

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

function toggleBodyClass(className, isOn) {
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


function toggleSummary(visible?: boolean) {
    if (!summaryContainer) return
    if (typeof visible === 'undefined') visible = summaryContainer.className.includes('custom-script-hidden')
    if (visible) {
        summaryContainer.classList.remove('custom-script-hidden')
        const activeLink = summaryContainer.querySelector('.active') as HTMLElement
        if (activeLink) {
            activeLink.scrollIntoView()
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

function onAttributeChange(element: Node, attributeName: string, callback: () => any) {
    const obs = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.attributeName === attributeName) callback()
            // console.log({mutation})
        }
    });
    obs.observe(element, {
        attributes: true
    });
    return obs
}