// ==UserScript==
// @name         WnL customization (beta)
// @namespace    http://tampermonkey.net/
// @version      1.10.1b
// @description  NIEOFICJALNY asystent WnL
// @author       wodac
// @updateURL    https://wodac.github.io/wnl-customization/beta/wnl-customization.user.js
// @match        https://lek.wiecejnizlek.pl/*
// @connect      https://lek.wiecejnizlek.pl/*
// @icon         https://www.google.com/s2/favicons?domain=wiecejnizlek.pl
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addValueChangeListener
// @grant        GM_getTabs
// @grant        GM_saveTab
// @grant        GM_openInTab
// @run-at document-body
// ==/UserScript==
///<reference path="../interfaces.d.ts" />
document = unsafeWindow.document;
let thisTabIndex;
let toRunOnLoaded = [], summaryContainer;
let slideOptionsContainer, additionalOptionsContainer;
let options, tools, chapterMetadata;
const presentationMetadata = {};
let notesCollection, currentSlideNotes;
let slideNumberObserver, slideObserver;
const WNL_LESSON_LINK = 'https://lek.wiecejnizlek.pl/app/courses/1/lessons';
const inSVG = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">${s[0]}</svg>`;
const SVGIcons = {
    chevronUp: inSVG `<path fill-rule="evenodd" d="M7.776 5.553a.5.5 0 0 1 .448 0l6 3a.5.5 0 1 1-.448.894L8 6.56 2.224 9.447a.5.5 0 1 1-.448-.894l6-3z"/>`,
    dots: inSVG `<path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>`,
    search: inSVG `<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>`,
    zoomIn: inSVG `<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
    <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
    <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/>`,
    zoomOut: inSVG `<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
    <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
    <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>`,
    stickies: inSVG `<path d="M1.5 0A1.5 1.5 0 0 0 0 1.5V13a1 1 0 0 0 1 1V1.5a.5.5 0 0 1 .5-.5H14a1 1 0 0 0-1-1H1.5z"/>
    <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v11A1.5 1.5 0 0 0 3.5 16h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 16 9.586V3.5A1.5 1.5 0 0 0 14.5 2h-11zM3 3.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V9h-4.5A1.5 1.5 0 0 0 9 10.5V15H3.5a.5.5 0 0 1-.5-.5v-11zm7 11.293V10.5a.5.5 0 0 1 .5-.5h4.293L10 14.793z"/>`,
    stickiesFill: inSVG `<path d="M0 1.5V13a1 1 0 0 0 1 1V1.5a.5.5 0 0 1 .5-.5H14a1 1 0 0 0-1-1H1.5A1.5 1.5 0 0 0 0 1.5z"/>
    <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v11A1.5 1.5 0 0 0 3.5 16h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 16 9.586V3.5A1.5 1.5 0 0 0 14.5 2h-11zm6 8.5a1 1 0 0 1 1-1h4.396a.25.25 0 0 1 .177.427l-5.146 5.146a.25.25 0 0 1-.427-.177V10.5z"/>`,
    plusSquare: inSVG `<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>`,
    trash: inSVG `<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>`,
    move: inSVG `<path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10zM.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708l-2-2zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8z"/>`,
    eraserFill: inSVG `<path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z"/>`,
    viewList: inSVG `<path d="M3 4.5h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H3zM1 2a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 2zm0 12a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 14z"/>`,
    layoutChaotic: inSVG `<path d="M5 1v8H1V1h4zM1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm13 2v5H9V2h5zM9 1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9zM5 13v2H3v-2h2zm-2-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3zm12-1v2H9v-2h6zm-6-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H9z"/>`,
    viewStack: inSVG `<path d="M3 0h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3zm0 8h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H3z"/>`,
    removeCircle: inSVG `<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>`,
    plusCircle: inSVG `<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>`,
    tags: inSVG `<path d="M3 2v4.586l7 7L14.586 9l-7-7H3zM2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2z"/>
    <path d="M5.5 5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM1 7.086a1 1 0 0 0 .293.707L8.75 15.25l-.043.043a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 0 7.586V3a1 1 0 0 1 1-1v5.086z"/>`,
    tagsFill: inSVG `<path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2zm3.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
    <path d="M1.293 7.793A1 1 0 0 1 1 7.086V2a1 1 0 0 0-1 1v4.586a1 1 0 0 0 .293.707l7 7a1 1 0 0 0 1.414 0l.043-.043-7.457-7.457z"/>`,
    addTag: inSVG `<path d="m2.7323 2.684v4.586l7 7 4.586-4.586-7-7zm-1 0a1 1 0 0 1 1-1h4.586a1 1 0 0 1 0.707 0.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7a1 1 0 0 1-0.293-0.707z"/>
    <path d="m8.0118 6.3688c0.27243 0 0.49328 0.22085 0.49328 0.49328v0.56847h0.68583c0.65771 0 0.65771 0.98657 0 0.98657h-0.68583v0.67116c0 0.65771-0.98657 0.65771-0.98657 0v-0.67116h-0.64182c-0.65771 0-0.65771-0.98657 0-0.98657h0.64182v-0.56847c0-0.27243 0.22085-0.49328 0.49328-0.49328z" stroke-width=".99963"/>
    <ellipse cx="8" cy="8" rx="2.25" ry="2.25" fill="none" opacity="1" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"/>`,
    pallete: inSVG `<path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
    <path d="M16 8c0 3.15-1.866 2.585-3.567 2.07C11.42 9.763 10.465 9.473 10 10c-.603.683-.475 1.819-.351 2.92C9.826 14.495 9.996 16 8 16a8 8 0 1 1 8-8zm-8 7c.611 0 .654-.171.655-.176.078-.146.124-.464.07-1.119-.014-.168-.037-.37-.061-.591-.052-.464-.112-1.005-.118-1.462-.01-.707.083-1.61.704-2.314.369-.417.845-.578 1.272-.618.404-.038.812.026 1.16.104.343.077.702.186 1.025.284l.028.008c.346.105.658.199.953.266.653.148.904.083.991.024C14.717 9.38 15 9.161 15 8a7 7 0 1 0-7 7z"/>`,
};
const zoomSliderHTML = `
    <div class='${"custom-script-zoom-slider-container" /* zoomSliderContainer */}'>
        <label class="metadata">POWIĘKSZENIE</label>
        <div style="text-align: right;">
            <input class="${"custom-script-font-size-input" /* fontSizeInput */}" 
                type="range" size="3" maxlength="3" min="70" max="200" 
                step="5">
            <a class="${"custom-script-font-size-input" /* fontSizeInput */}-decrease">${SVGIcons.zoomOut}</a>
            <span class="${"custom-script-font-size-label" /* fontSizeLabel */}">120%</span>
            <a class="${"custom-script-font-size-input" /* fontSizeInput */}-increase">${SVGIcons.zoomIn}</a>
        </div>
    </div>`;
function toggleBodyClass(className, isOn) {
    let body = document.body;
    if (isOn)
        body.classList.add(className);
    else
        body.classList.remove(className);
}
function getForegroundColor(hex) {
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
    var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
        ? '#000000'
        : '#FFFFFF';
}
function getRandomElement(a) {
    if (!a || !a.length)
        return;
    const i = Math.random() * a.length;
    return a[Math.floor(i)];
}
const getUniformFontSize = fontSize => (fontSize - 100) * 0.01 + 0.93;
const root = unsafeWindow.document.querySelector(":root");
const updateFontSize = (fontSize) => {
    root.style.setProperty("--uniform-font-size", `${getUniformFontSize(fontSize)}em`);
    root.style.setProperty("--scaled-font-size", `${fontSize}%`);
};
class ClassToggler {
    constructor(className, _elementOrSelector = document.body, onchange) {
        this.className = className;
        this._elementOrSelector = _elementOrSelector;
        this.onchange = onchange;
        this._unresolved = false;
        if (this.element)
            this._getClassState();
        else
            this._unresolved = true;
    }
    _getClassState() {
        this._state = this.element.classList.contains(this.className);
    }
    get element() {
        if (typeof this._elementOrSelector === 'string') {
            return document.querySelector(this._elementOrSelector);
        }
        return this._elementOrSelector;
    }
    get state() {
        return this._state;
    }
    set state(val) {
        if (this._state === val)
            return;
        this._state = val;
        if (this.onchange)
            this.onchange(this);
        if (val) {
            this.element && this.element.classList.add(this.className);
        }
        else {
            this.element && this.element.classList.remove(this.className);
        }
    }
    toggle() {
        if (this._unresolved)
            this._getClassState();
        this.state = !this.state;
    }
}
var Toggles;
(function (Toggles) {
    Toggles.summaryHidden = new ClassToggler('custom-script-hidden', '.custom-script-summary', t => {
        if (!t.state) {
            summaryContainer.classList.remove('custom-script-hidden');
            const activeLink = summaryContainer.querySelector('.active');
            if (activeLink) {
                activeLink.scrollIntoView({ behavior: "smooth" });
            }
        }
    });
    const optionsHidden = new ClassToggler('custom-script-hidden', '.custom-script-additional-options');
    Toggles.optionsActive = new ClassToggler('active', 'a.custom-options-btn', t => {
        optionsHidden.state = !t.state;
    });
})(Toggles || (Toggles = {}));
function goToSlideN(n) {
    const nInput = document.querySelector('.wnl-slideshow-controls input[type=number]');
    if (nInput) {
        nInput.value = n.toString();
        nInput.dispatchEvent(new InputEvent('input'));
        return true;
    }
    return false;
}
function onAttributeChange(element, attributeName, callback) {
    const obs = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.attributeName === attributeName) {
                const attr = mutation.target.attributes.getNamedItem(attributeName);
                callback(attr ? attr.value : null);
            }
            // console.log({mutation})
        }
    });
    obs.observe(element, {
        attributes: true
    });
    return obs;
}
function downloadFile(mimetype, name, data) {
    let dataText;
    if (typeof data === 'string')
        dataText = data;
    else {
        dataText = data.toString();
    }
    const dataStr = `data:${mimetype};charset=utf-8,${encodeURIComponent(dataText)}`;
    let dlAnchorElem = document.getElementById('downloadAnchorElem');
    if (!dlAnchorElem) {
        dlAnchorElem = document.createElement('a');
        dlAnchorElem.id = 'downloadAnchorElem';
        dlAnchorElem.style.display = 'none';
        document.body.append(dlAnchorElem);
    }
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", name);
    dlAnchorElem.click();
}
function toggleFullscreen() {
    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'f', altKey: false, bubbles: true,
        cancelable: true, charCode: 0, code: "KeyF",
        composed: true, ctrlKey: false, detail: 0,
        isComposing: false, keyCode: 70, location: 0,
        metaKey: false, repeat: false, shiftKey: false
    })), 10);
}
function getIndexedDB(name, version, setupCb) {
    return new Promise((resolve, reject) => {
        var request = indexedDB.open(name, version);
        request.addEventListener('error', ev => {
            reject('Unable to open database');
        });
        request.addEventListener('upgradeneeded', function (ev) {
            const db = this.result;
            const store = setupCb(ev, db);
            store.transaction.addEventListener('complete', function () {
                resolve(db);
            });
        });
        request.addEventListener('success', function () {
            const db = this.result;
            db.onerror = event => {
                console.error("Database error: " + event.target.errorCode);
            };
            resolve(db);
        });
    });
}
function observeSlideNumber(cb) {
    //console.log('observe slide number')
    const appDiv = document.querySelector(".wnl-app-layout.wnl-course-layout" /* appDiv */);
    slideNumberObserver = onAttributeChange(appDiv, 'slide', value => cb(parseInt(value)));
}
function getCurrentLessonID() {
    const element = document.querySelector('[lesson-id]');
    if (!element)
        return NaN;
    const attr = element.attributes.getNamedItem('lesson-id');
    if (!attr)
        return NaN;
    return parseInt(attr.value);
}
function updateTabTitle() {
    let currentTitleHeader = document.querySelector('.present .sl-block-content h2');
    if (currentTitleHeader !== null)
        presentationMetadata.currentSlideTitle = currentTitleHeader.textContent;
    if (GM_getValue('option_changeTitle')) {
        let mainTitle;
        mainTitle = presentationMetadata.name && presentationMetadata.name.match(/\w/) ? `${presentationMetadata.name} - ` : '';
        const slideTitle = presentationMetadata.currentSlideTitle && presentationMetadata.currentSlideTitle.match(/\w/) ? `${presentationMetadata.currentSlideTitle} - ` : '';
        const originalTitle = options ? options.state.changeTitle.originalTitle : 'LEK - Kurs - Więcej niż LEK';
        document.title = slideTitle + mainTitle + originalTitle;
    }
}
class CustomEventEmmiter {
    constructor() {
        this.listeners = {};
    }
    addEventListener(eventName, listener, once) {
        if (!this.listeners[eventName])
            this.listeners[eventName] = [];
        if (once) {
            listener = event => {
                listener.bind(this)(event);
                this.removeEventListener(eventName, listener);
            };
        }
        this.listeners[eventName].push(listener.bind(this));
    }
    removeEventListener(eventName, listener) {
        const i = this.listeners[eventName] && this.listeners[eventName].findIndex(cb => cb.toString() === listener.toString());
        if (i && i >= 0)
            return this.listeners[eventName].splice(i, 1);
    }
    removeAllListeners() {
        this.listeners = {};
    }
    trigger(eventName, event = {}) {
        console.log(`triggering ${eventName} with data`, event, 'on', this);
        this.listeners[eventName] && this.listeners[eventName].forEach(listener => listener(event));
    }
}
function focusTab() {
    if (document.hidden) {
        const w = GM_openInTab('about:blank', { active: true, setParent: true });
        setTimeout(() => w.close(), 0);
    }
}
function openSlideInTab(toOpen) {
    if (toOpen) {
        console.log({ toOpen });
        if (toOpen.currentTab === -1)
            return;
        if (toOpen.lessonID === presentationMetadata.lessonID &&
            toOpen.screenID === presentationMetadata.screenID &&
            toOpen.slide) {
            focusTab();
            goToSlideN(toOpen.slide);
            GM_setValue('openInTab', {
                lessonID: presentationMetadata.lessonID,
                screenID: presentationMetadata.screenID,
                slide: presentationMetadata.currentSlideNumber,
                currentTab: -1
            });
        }
        else if (toOpen.currentTab === -2 || toOpen.currentTab === thisTabIndex) {
            GM_getTabs(tabsObject => {
                console.log({ tabsObject });
                const tabs = Object.values(tabsObject);
                let nextIndex = 1000;
                tabs.forEach(tab => {
                    if (tab && tab.index > toOpen.currentTab && tab.index < nextIndex)
                        nextIndex = tab.index;
                });
                if (nextIndex === 1000) {
                    nextIndex = -1;
                    openWindow();
                }
                toOpen.currentTab = nextIndex;
                console.log('setting', { toOpen });
                GM_setValue('openInTab', toOpen);
            });
        }
    }
    function openWindow() {
        const path = [WNL_LESSON_LINK, toOpen.lessonID, toOpen.screenID, toOpen.slide];
        console.log('opening', path);
        return GM_openInTab(path.join('/'), { active: true, setParent: true });
    }
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Search;
(function (Search) {
    const getSearchURL = (q) => `https://lek.wiecejnizlek.pl/papi/v2/slides/.search?q=${encodeURIComponent(q)}&include=context,sections,slideshows.screens.lesson`;
    const WNL_DYNAMIC_SLIDES = 'https://lek.wiecejnizlek.pl/app/dynamic/slides/';
    let searchContainer, searchResultsContainer;
    function addSearchContainer() {
        searchContainer = document.createElement('div');
        searchContainer.className = 'custom-script-search custom-script-hidden';
        searchContainer.innerHTML = `
        <input class="custom-search-result" style="width: 80%;display: inline-block;">
        <a class='custom-search-submit' style="font-size: 1.2rem;padding:0.1rem;">${SVGIcons.search}</a>
        `;
        const closeBtn = document.createElement('div');
        closeBtn.className = 'custom-script-summary-close';
        closeBtn.innerHTML = SVGIcons.chevronUp;
        searchContainer.prepend(closeBtn);
        closeBtn.addEventListener('click', () => Search.hiddenToggle.state = true);
        searchResultsContainer = document.createElement('div');
        searchContainer.append(searchResultsContainer);
        document.querySelector('.order-number-container').after(searchContainer);
        const searchInput = searchContainer.querySelector('input.custom-search-result');
        searchInput.addEventListener('change', () => performSearch());
        searchInput.addEventListener('keyup', ev => {
            if (ev.key === 'Escape') {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                Search.hiddenToggle.state = true;
            }
        });
        searchContainer.querySelector('a.custom-search-submit').addEventListener('click', () => performSearch());
    }
    Search.addSearchContainer = addSearchContainer;
    function performSearch() {
        if (!searchContainer)
            return;
        const q = searchContainer.querySelector('input.custom-search-result').value;
        const interpretation = interpretQuery(q);
        searchResultsContainer.innerHTML = `<p style='padding: 0.5rem;text-align: center'>Ładowanie...</p>`;
        getSearchResponseHTML(interpretation).then(resp => {
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = '';
                searchResultsContainer.append(...resp);
            }
            Search.hiddenToggle.state = false;
        });
    }
    function interpretQuery(rawQuery) {
        let query = rawQuery.replace(/"/g, '');
        rawQuery = rawQuery.toLowerCase();
        const quotesRegExp = /"([^"]+)"/g;
        const hasntRegExp = /-\w+/g;
        let mustContain = rawQuery.match(quotesRegExp);
        let musntContain = rawQuery.match(hasntRegExp);
        if (musntContain)
            musntContain.forEach(toReplace => {
                query.replace(`-${toReplace}`, '');
            });
        query = query.trim();
        if (mustContain)
            mustContain = mustContain.map(s => s.slice(1, -1));
        if (musntContain)
            musntContain = musntContain.map(s => s.slice(1));
        return { query, rawQuery, mustContain, musntContain };
    }
    function getSearchResponseHTML(q) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield searchRequest(q);
            if (response.length) {
                return response.map(el => {
                    const link = document.createElement('a');
                    link.innerHTML = `
                <h5>${el.highlight['snippet.header'] || el.details.header}</h5>
                <h6>${el.highlight['snippet.subheader'] || el.details.subheader}</h6>
                <p>${el.highlight['snippet.content'] || el.details.content}</p>`;
                    link.href = getHref(el);
                    link.target = '_blank';
                    link.className = 'custom-search-result';
                    link.addEventListener('click', ev => {
                        ev.preventDefault();
                        openSlideInTab({
                            currentTab: -2,
                            lessonID: el.context.lesson.id,
                            screenID: el.context.screen.id,
                            slide: el.context.slideshow.order_number
                        });
                    });
                    return link;
                });
            }
            const notFoundInfo = document.createElement('p');
            notFoundInfo.innerHTML = `Nie znaleziono frazy <em>${q.rawQuery}</em> :(`;
            notFoundInfo.style.padding = '0.5rem';
            return [notFoundInfo];
            function getHref(el) {
                const fragm = {
                    f1: el.context.lesson,
                    f2: el.context.screen,
                    f3: el.context.slideshow
                };
                if (Object.values(fragm).every(val => val)) {
                    const path = [fragm.f1.id, fragm.f2.id, fragm.f3.order_number];
                    if (path.every(val => val)) {
                        return [WNL_LESSON_LINK, ...path].join('/');
                    }
                }
                if (el.id)
                    return WNL_DYNAMIC_SLIDES + el.id;
                return '#';
            }
        });
    }
    Search.hiddenToggle = new ClassToggler('custom-script-hidden', '.custom-script-search', t => {
        if (!t.state)
            setTimeout(() => {
                searchContainer.querySelector('input.custom-search-result').focus();
            }, 100);
    });
    function searchRequest(q) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                url: getSearchURL(q.query),
                method: 'GET',
                responseType: "json",
                onload: ({ response }) => {
                    const entries = Object.entries(response);
                    const results = entries.filter(el => el[0].match(/^[0-9]+$/)).map(el => el[1]);
                    const parsed = results.map(el => {
                        return {
                            highlight: el.scout_metadata.highlight,
                            details: el.snippet,
                            context: el.context,
                            id: el.id
                        };
                    });
                    resolve(filterSearch(parsed, q));
                },
                onerror: reject
            });
        });
    }
    function filterSearch(parsed, q) {
        return __awaiter(this, void 0, void 0, function* () {
            let filtered = parsed;
            if (q.mustContain) {
                filtered = parsed.filter(result => {
                    return hasSomePhrases(result, q.mustContain).every(includes => includes);
                });
            }
            if (q.musntContain) {
                filtered = filtered.filter(result => {
                    return !hasSomePhrases(result, q.musntContain).some(includes => includes);
                });
            }
            filtered.sort(sortUpSome(res => res.context.screen.id === presentationMetadata.screenID));
            function sortUpSome(predicate) {
                return (val1, val2) => predicate(val1) && !predicate(val2) ? -1 : 1;
            }
            return (yield getTagsAsResults(q)).concat(filtered);
            function hasSomePhrases(result, phrases) {
                return phrases.map(toSearch => {
                    return Object.values(result.highlight).some(highlighted => {
                        return highlighted.some(s => stripHTMLTags(s).includes(toSearch));
                    });
                });
            }
        });
    }
    function getTagsAsResults(q) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!notesCollection)
                return [];
            const tags = yield notesCollection.getAllTagsWithName(q.query);
            return tags.map(tag => {
                return {
                    highlight: {
                        "snippet.content": [`<div title='${tag.content}' class='custom-tag'>${tag.content}</div>`]
                    },
                    details: {
                        header: tag.presentationTitle,
                        subheader: tag.slideTitle,
                    },
                    context: {
                        screen: { id: tag.screenid },
                        lesson: { id: tag.lessonID, name: tag.presentationTitle },
                        slideshow: {
                            order_number: tag.slide
                        }
                    }
                };
            });
        });
    }
    function stripHTMLTags(s) {
        const tagStripper = /<[^>]+>/g;
        return s.toLowerCase().replace(tagStripper, '');
    }
})(Search || (Search = {}));
var Toggles;
(function (Toggles) {
    Toggles.searchHidden = Search.hiddenToggle;
})(Toggles || (Toggles = {}));
///<reference path="common.ts" />
///<reference path="search.ts" />
var Keyboard;
(function (Keyboard) {
    let keyboardShortcuts = [
        {
            keys: ['ArrowUp'],
            callback: showImage
        },
        {
            keys: ['ArrowDown', 'q', '0', 'Escape'],
            callback: hideImage
        },
        {
            keys: ['q', '0', 'Escape'],
            callback: hideModal
        },
        {
            keys: ['q', '0', 'Escape'],
            callback: () => {
                Toggles.optionsActive.state = false;
                Toggles.searchHidden.state = true;
                Toggles.summaryHidden.state = true;
            }
        },
        {
            keys: ['m'],
            callback: () => toggleMouseVisibility()
        },
        {
            keys: ['o', 's'],
            callback: () => Toggles.optionsActive.toggle()
        },
        {
            keys: ['?', '/'],
            callback: () => Toggles.searchHidden.toggle()
        },
        {
            keys: ['l'],
            callback: () => Toggles.summaryHidden.toggle()
        },
        {
            keys: ['Enter'],
            callback: () => {
                const quizVerifyBtn = document.querySelector('.o-quizQuestionReferenceModal__verify span');
                if (quizVerifyBtn)
                    quizVerifyBtn.click();
            }
        }
    ];
    function registerShortcut(shortcut) {
        keyboardShortcuts.push(shortcut);
    }
    Keyboard.registerShortcut = registerShortcut;
    function shortcutListener(event) {
        const tagName = event.target.nodeName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }
        keyboardShortcuts.forEach(shortcut => {
            if (shortcut.keys.includes(event.key))
                shortcut.callback(event);
        });
        const charCode = event.keyCode;
        if ((charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105))
            numericKeyPressed(event.key);
    }
    document.addEventListener('fullscreenchange', ev => {
        if (!document.fullscreenElement) {
            if (document.querySelector('.o-referenceModal')) {
                hideModal();
                toggleFullscreen();
            }
            else if (!Toggles.searchHidden.state) {
                Toggles.searchHidden.state = true;
                toggleFullscreen();
            }
            else if (!Toggles.summaryHidden.state) {
                Toggles.summaryHidden.state = true;
                toggleFullscreen();
            }
        }
    });
    function setupControl() {
        const slides = document.querySelectorAll('.slides .stack');
        if (!slides.length)
            return;
        slides.forEach(slide => {
            let counter = 1;
            const icons = slide.querySelectorAll('.a-icon');
            icons.forEach(icon => addSubToRef(icon, counter++));
        });
        observeSlides(addSubsToRefs);
        // document.body.addEventListener('click', updateTabTitle)
        // document.body.addEventListener('keyup', updateTabTitle)
        document.body.addEventListener('keydown', event => {
            if (event.key === ' ' || event.key === 'l') {
                // event.preventDefault()
                event.stopImmediatePropagation();
            }
            if (event.key === 'ArrowUp') {
                scrollView(-60);
                return false;
            }
            if (event.key === 'ArrowDown' || event.key === ' ') {
                scrollView(60);
                return false;
            }
        });
        document.body.addEventListener('keyup', shortcutListener);
    }
    Keyboard.setupControl = setupControl;
    function disableControl() {
        document.body.removeEventListener('keyup', shortcutListener);
    }
    Keyboard.disableControl = disableControl;
    function observeSlides(cb) {
        //console.log('observeSlides')
        slideObserver = new MutationObserver(cb);
        slideObserver.observe(document.querySelector('div.slides'), {
            childList: true,
            subtree: true
        });
    }
    function addSubsToRefs(mutations) {
        //console.log('mutation observed')
        let counter = 1;
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes && mutation.addedNodes.length > 0) {
                //console.log('node added')
                let ref = mutation.addedNodes[0];
                if (ref.className && ref.className.includes('m-referenceTrigger')) {
                    addSubToRef(ref, counter);
                    counter++;
                }
            }
        });
    }
    function addSubToRef(ref, counter) {
        const sub = document.createElement('sub');
        sub.innerText = counter.toString();
        sub.className = `small`;
        ref.classList.add(`sub-id-${counter}`);
        ref.appendChild(sub);
    }
    function scrollView(y) {
        const behavior = GM_getValue(`option_smoothScroll`) ? 'smooth' : 'auto';
        const options = { top: y, left: 0, behavior };
        const views = [
            document.querySelector(".present .present" /* currentSlideContainer */),
            document.querySelector('.m-modal__content'),
            document.querySelector('.wnl-comments')
        ];
        views.forEach(view => {
            if (view)
                view.scrollBy(options);
        });
    }
    function showImage() {
        if (document.body.querySelector('.fullscreen-mode .wnl-comments'))
            return;
        let fullscreenBtn = document.body.querySelector('.present .iv-image-fullscreen');
        if (fullscreenBtn)
            fullscreenBtn.click();
    }
    function hideImage() {
        if (document.body.querySelector('.fullscreen-mode .wnl-comments'))
            return;
        let exitBtn = document.body.querySelector('.wnl-screen .iv-container-fullscreen .iv-close');
        if (exitBtn)
            exitBtn.click();
        exitBtn = document.body.querySelector('.wnl-screen .image-gallery-wrapper .iv-close');
        if (exitBtn)
            exitBtn.click();
    }
    function hideModal() {
        let exitBtn = document.body.querySelector(`.a-icon.m-modal__header__close`);
        if (exitBtn)
            exitBtn.click();
    }
    function numericKeyPressed(key) {
        let annotationImages = document.querySelectorAll('.m-imageFullscreenWrapper');
        const quiz = document.querySelector('.o-referenceModal .quizQuestion');
        if (quiz) {
            const index = parseInt(key) - 1;
            const answers = quiz.querySelectorAll('.quizAnswer');
            if (index >= answers.length)
                return;
            answers[index].click();
            return;
        }
        if (annotationImages.length > 0) {
            const selector = `.m-imageFullscreenWrapper .a-icon.sub-id-${key}`;
            const icon = document.querySelector(selector);
            //console.log({ selector, icon })
            if (icon)
                icon.click();
        }
        else {
            const selector = `.present .a-icon.sub-id-${key}`;
            const icon = document.querySelector(selector);
            //console.log({ selector, icon })
            if (icon)
                icon.click();
            setTimeout(() => {
                annotationImages = document.querySelectorAll('.m-imageFullscreenWrapper');
                let counter = 1;
                annotationImages.forEach(image => {
                    const btn = image.querySelector('.a-icon');
                    btn.classList.add(`sub-id-${counter}`);
                    const index = document.createElement('span');
                    index.innerText = counter.toString();
                    index.className = 'image-fullscreen-index';
                    btn.appendChild(index);
                    counter++;
                });
            }, 300);
        }
    }
    let mouseVisible = true;
    function toggleMouseVisibility(visible) {
        mouseVisible = typeof visible === 'undefined' ? !mouseVisible : visible;
        //console.log({ mouseVisible, visible })
        toggleBodyClass("custom-script-hide-cursor" /* hideCursor */, !mouseVisible);
        if (!mouseVisible)
            document.body.addEventListener('mousemove', () => toggleMouseVisibility(true), { once: true });
    }
})(Keyboard || (Keyboard = {}));
///<reference path="common.ts" />
///<reference path="keyboard.ts" />
class Options {
    constructor(options, settingsContainerSelector) {
        const document = unsafeWindow.document;
        this.state = Object.fromEntries(options.map(option => [option.name, Object.assign(Object.assign({}, option), { value: option.defaultValue, handle: null })]));
        this.settingsContainerSelector = settingsContainerSelector;
        this.restoreState();
        this.init();
        this.update();
        this.storeState();
        this.rerender();
    }
    get settingsContainer() {
        return document.querySelector(this.settingsContainerSelector);
    }
    _rerenderSettings() {
        //console.log('trying to render sidebar', this.settingsContainer)
        if (this.settingsContainer) {
            //console.log('rendering sidebar', this.settingsContainer)
            const optionDivs = this.settingsContainer.querySelectorAll(`div.${"custom-script-option-container" /* optionContainer */}`);
            optionDivs.forEach(el => el.remove());
            Object.values(this.state).forEach(option => this.settingsContainer.appendChild(this._getSettingsOption(option)));
        }
    }
    _getSettingsOption(option) {
        const optionContainer = document.createElement('div');
        optionContainer.classList.add("custom-script-option-container" /* optionContainer */);
        const getOption = (desc) => `<a class="custom-script-option" href="#">${desc}</a>`;
        const desc = typeof option.desc === 'function' ? option.desc.apply(this, [option, this.state]) : option.desc;
        optionContainer.innerHTML = getOption(desc);
        const optionLink = optionContainer.querySelector('a');
        optionLink.addEventListener('click', event => {
            event.preventDefault();
            this._runCallback(option);
        });
        return optionContainer;
    }
    rerender() {
        let rerender = (name) => {
            const state = this.state[name];
            GM_unregisterMenuCommand(state.handle);
            const desc = typeof state.desc === 'function' ? state.desc(state) : state.desc;
            this.state[name].handle = GM_registerMenuCommand(desc, () => this._runCallback(state), state.key);
        };
        rerender = rerender.bind(this);
        Object.keys(this.state).forEach(rerender);
        this._rerenderSettings();
    }
    _runCallback(option) {
        const result = option.callback.apply(this, [option, this.state]);
        if (typeof result === 'object')
            this.setOptionState(Object.assign({ name: option.name }, result));
    }
    setOptionState(state, name) {
        if (!name)
            name = state.name;
        if (typeof state === 'function') {
            const result = state.apply(this, [this.state[name]]);
            this._setOptionState(Object.assign(Object.assign({}, this.state[name]), result));
        }
        else
            this._setOptionState(Object.assign(Object.assign({}, state), { name }));
    }
    _setOptionState(state) {
        const name = state.name;
        this.state[name] = Object.assign(Object.assign({}, this.state[state.name]), state);
        this.storeState(name);
        const updateCb = this.state[name].update;
        if (updateCb)
            updateCb.apply(this, [state, this.state]);
        this.rerender();
    }
    storeState(optionName) {
        const saveOptionState = name => GM_setValue(`option_${name}`, this.state[name].value);
        if (typeof optionName === 'string') {
            saveOptionState(optionName);
            return;
        }
        Object.keys(this.state).forEach(saveOptionState);
    }
    restoreState(optionName) {
        const restoreOptionState = (name) => {
            this.state[name].value = GM_getValue(`option_${name}`, this.state[name].value);
        };
        if (typeof optionName === 'string') {
            restoreOptionState(optionName);
            return;
        }
        Object.keys(this.state).forEach(restoreOptionState);
    }
    _runOnAllOptions(functionName) {
        Object.keys(this.state).forEach(optionName => {
            const option = this.state[optionName];
            const callback = option[functionName];
            if (typeof callback === 'function')
                callback.apply(this, [option, this.state]);
        });
    }
    update() { this._runOnAllOptions('update'); }
    init() {
        this._runOnAllOptions('init');
        this._rerenderSettings();
    }
}
const getCheckboxEmoji = isOn => isOn ? "☑️ " : "🔲 ";
options = new Options([
    {
        name: "increaseFontSize",
        desc: state => getCheckboxEmoji(state.value) + "🔎 Zwiększ wielkość czcionki",
        callback: function (state) {
            if (!state.value) {
                this.setOptionState({
                    name: "uniformFontSize",
                    value: false
                });
            }
            return { value: !state.value };
        },
        update: state => toggleBodyClass("custom-script-increase-font-size" /* increaseFontSize */, state.value),
        defaultValue: true,
        key: 'f'
    },
    {
        name: "increaseAnnotations",
        desc: state => getCheckboxEmoji(state.value) + "📄 Zwiększ wielkość czcionki w przypisach",
        callback: function (state) {
            return { value: !state.value };
        },
        update: state => toggleBodyClass("custom-script-increase-annotations" /* increaseAnnotations */, state.value),
        defaultValue: false,
        key: 'a'
    },
    {
        name: "hideChat",
        desc: state => getCheckboxEmoji(state.value) + "💬 Ukryj czat",
        callback: function (state) {
            return { value: !state.value };
        },
        update: state => toggleBodyClass("custom-script-hide-chat" /* hideChat */, state.value),
        defaultValue: false,
        key: 'c'
    },
    {
        name: "smoothScroll",
        desc: state => getCheckboxEmoji(state.value) + "↕️ Płynne przewijanie strzałkami",
        callback: function (state) {
            return { value: !state.value };
        },
        update: () => null,
        defaultValue: false,
        key: 's'
    },
    {
        name: "keyboardControl",
        desc: state => getCheckboxEmoji(state.value) + "⌨️ Sterowanie klawiaturą",
        callback: function (state) {
            return { value: !state.value };
        },
        update: state => {
            if (state.value) {
                Keyboard.setupControl();
            }
            else {
                document.querySelectorAll('sub.small').forEach(sub => sub.remove());
                Keyboard.disableControl();
                if (slideObserver)
                    slideObserver.disconnect();
            }
        },
        defaultValue: true,
        key: 'k'
    },
    {
        name: "changeTitle",
        desc: state => getCheckboxEmoji(state.value) + "🆎 Zmień tytuł karty",
        callback: function (state) {
            return Object.assign(Object.assign({}, state), { value: !state.value });
        },
        update: state => {
            //console.log('changeTitle update', { state })
            if (!state.value) {
                if (state.originalTitle)
                    unsafeWindow.document.title = state.originalTitle;
                // unsafeWindow.removeEventListener('popstate', updateTabTitle)
            }
            updateTabTitle();
        },
        init: state => {
            state.originalTitle = unsafeWindow.document.title;
            // unsafeWindow.addEventListener('popstate', updateTabTitle);
        },
        defaultValue: false,
        key: 't'
    },
    {
        name: "uniformFontSize",
        desc: state => getCheckboxEmoji(state.value) + "🔤 Ujednolicona wielkość czcionki",
        callback: function (state) {
            if (!state.value) {
                this.setOptionState({
                    name: "increaseFontSize",
                    value: false
                });
            }
            return { value: !state.value };
        },
        update: state => toggleBodyClass("custom-script-uniform-font-size" /* uniformFontSize */, state.value),
        defaultValue: false,
        key: 'u'
    },
    {
        name: "invertImages",
        desc: state => getCheckboxEmoji(state.value) + "🔃 Odwróć kolory obrazów",
        callback: function (state) {
            return { value: !state.value };
        },
        defaultValue: false,
        update: state => toggleBodyClass("custom-script-invert-images" /* invertImages */, state.value),
        key: 'i'
    },
    {
        name: "percentIncrease",
        type: "button",
        desc: state => `➕ Zmień powiększenie (${state.value}%)`,
        callback: (state) => {
            const input = prompt(`Określ powiększenie czcionki (w %, obecnie ${state.value}%):`, state.value);
            if (typeof input === "string") {
                let nextValue = parseInt(input, 10);
                if (nextValue !== NaN && nextValue > 10 && nextValue < 300) {
                    return { value: nextValue };
                }
            }
        },
        defaultValue: 110,
        update: state => {
            updateFontSize(state.value);
            const rangeInput = document.querySelector(`input.${"custom-script-font-size-input" /* fontSizeInput */}`);
            const rangeLabel = document.querySelector(`.${"custom-script-font-size-label" /* fontSizeLabel */}`);
            if (rangeInput) {
                rangeInput.value = state.value;
                rangeInput.title = state.value;
            }
            if (rangeLabel)
                rangeLabel.innerText = `${state.value}%`;
        },
        init: function (state) {
            function _toRun() {
                const rangeInput = document.querySelector(`input.${"custom-script-font-size-input" /* fontSizeInput */}`);
                const rangeLabel = document.querySelector(`.${"custom-script-font-size-label" /* fontSizeLabel */}`);
                if (rangeInput) {
                    rangeInput.value = state.value;
                    rangeLabel.innerText = `${state.value}%`;
                    rangeInput.addEventListener('change', event => {
                        const value = parseInt(rangeInput.value);
                        this.setOptionState({ name: "percentIncrease", value });
                    });
                    rangeInput.addEventListener('input', event => {
                        const value = rangeInput.value;
                        updateFontSize(parseInt(value));
                    });
                }
                state.increaseBy = (n) => {
                    const current = this.state.percentIncrease.value;
                    this.setOptionState({ value: current + n }, 'percentIncrease');
                };
                Keyboard.registerShortcut({
                    keys: ['-'],
                    callback: () => state.increaseBy(-5)
                });
                Keyboard.registerShortcut({
                    keys: ['+', '='],
                    callback: () => state.increaseBy(5)
                });
            }
            const toRun = _toRun.bind(this);
            toRunOnLoaded.push(toRun);
        },
        key: 'p'
    }
], `.${"custom-script-settings-container" /* settingsContainer */}>div`);
///<reference path="common.ts" />
var Notes;
(function (Notes) {
    class Note extends CustomEventEmmiter {
        constructor(metadata, _content, parent) {
            super();
            this.metadata = metadata;
            this._content = _content;
            this.parent = parent;
            this._edited = false;
            this._editing = false;
            this._deleted = false;
        }
        get content() {
            return this._content;
        }
        get element() {
            return this._element;
        }
        remove(removeFromParent = true) {
            if (this._deleted)
                return;
            this._deleted = true;
            //console.log('deleting', { note: this, removeFromParent }, 'from Note')
            this.trigger('remove');
            if (this._element)
                this._element.remove();
            if (removeFromParent)
                this.parent.removeNoteById(this.metadata.id);
            this._element = null;
            this.removeAllListeners();
        }
        set content(value) {
            if (this._deleted)
                throw new NoteDeletedError();
            this._content = value;
            if (this.contentElement)
                this.contentElement.innerHTML = value.replace(/\n/g, '<br />');
            this.trigger('change', { newContent: value });
            this.parent.saveNote(this);
        }
        setupEditing(noteContentInput) {
            noteContentInput.value = this.content;
            noteContentInput.addEventListener('blur', ev => {
                this.endEditing();
            });
            noteContentInput.addEventListener('keyup', (ev) => {
                if (ev.key === 'Enter' && !ev.shiftKey && !ev.altKey) {
                    ev.stopImmediatePropagation();
                    ev.preventDefault();
                    this.endEditing();
                }
            });
            noteContentInput.addEventListener('input', ev => {
                ev.stopPropagation();
                const content = noteContentInput.value;
                //console.log('note content changed', { content })
                this.content = content;
            });
            const form = this._element.querySelector('form');
            form && form.addEventListener('submit', ev => {
                ev.preventDefault();
                this.endEditing();
            });
            this._element.addEventListener('click', ev => this.startEditing(noteContentInput));
            // this._element.addEventListener('focus', ev => this.startEditing(noteContentInput))
        }
        startEditing(noteContentInput) {
            this._editing = true;
            this._lastValue = this._content;
            this._element.classList.add('editing');
            noteContentInput.focus();
        }
        endEditing() {
            if (this._editing) {
                this._editing = false;
                this._element.classList.remove('editing');
                this.trigger('edited', { newContent: this.content });
                if (!this._content.trim().length) {
                    if (this._edited)
                        this.remove();
                    else
                        this._edited = true;
                    return;
                }
            }
        }
    }
    Notes.Note = Note;
    class TagNote extends Note {
        constructor() {
            super(...arguments);
            this._edited = true;
        }
        static from(note) {
            return new TagNote(note.metadata, note.content, note.parent);
        }
        get contentElement() {
            return this._element && this._element.querySelector('.custom-tag-content');
        }
        render(parent) {
            this._element = document.createElement('div');
            this._element.innerHTML = TagNote.HTML;
            this._element.classList.add('custom-tag');
            this._element.title = this.content;
            this._element.tabIndex = 0;
            const removeBtn = this._element.querySelector('.custom-remove');
            const colorBtn = this._element.querySelector('.custom-change-color');
            this.colorInput = this._element.querySelector('input[type=color]');
            this.setColor(this.metadata.color);
            this.contentElement.innerText = this.content;
            this.setupEditing(this._element.querySelector('input'));
            colorBtn.addEventListener('click', (ev) => {
                ev.stopImmediatePropagation();
                this.colorInput.click();
            });
            this.colorInput.addEventListener('change', () => {
                this.metadata.color = this.colorInput.value;
                this.trigger('colorChange', { newColor: this.metadata.color });
                this.parent.saveNote(this);
                this.setColor(this.metadata.color);
            });
            removeBtn.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                this.remove();
            });
            this._element.title = this.content;
            this.addEventListener('edited', ({ newContent }) => {
                this._element.title = newContent;
                this.setColorFromTagName();
            });
            if (parent)
                parent.prepend(this._element);
            this.trigger('rendered');
            return this._element;
        }
        setColorFromTagName() {
            const tagColors = this.parent.parent.tags;
            console.log({ tagColors });
            let color = this.metadata.color;
            if (tagColors.length && this.content) {
                const tagRecord = tagColors.find(tag => tag.name === this.content);
                if (tagRecord)
                    color = tagRecord.color;
            }
            this.metadata.color = color;
            this.setColor(color);
        }
        setColor(color) {
            this._element.style.background = color;
            this._element.style.color = getForegroundColor(color);
            this.colorInput.value = color;
        }
    }
    TagNote.HTML = `
    <span class='custom-tag-content'></span>
    <form>
        <input type='text' list='custom-tags-list' />
        <input type='color' />
    </form>
    <a class='custom-change-color' title='Zmień kolor'>${SVGIcons.pallete}</a>
    <a class='custom-remove' title='Usuń'>${SVGIcons.removeCircle}</a>
    `;
    Notes.TagNote = TagNote;
    class RegularNote extends Note {
        static from(note) {
            return new RegularNote(note.metadata, note.content, note.parent);
        }
        static normalizeFractionalPosition(pos) {
            if (pos.x < 0)
                pos.x = 0;
            if (pos.y < 0)
                pos.y = 0;
            if (pos.x > 1)
                pos.x = 1;
            if (pos.y > 1)
                pos.y = 1;
            return pos;
        }
        setNotePosition(pos) {
            if (!pos)
                pos = { x: 0, y: 0 };
            pos = RegularNote.normalizeFractionalPosition(pos);
            this._element.style.top = `${Math.round(pos.y * 100)}%`;
            this._element.style.left = `${Math.round(pos.x * 100)}%`;
        }
        render(parent) {
            this.parentElement = parent;
            this._element = document.createElement('div');
            this.setNotePosition(this.metadata.position);
            this._element.dataset.id = this.metadata.id;
            this._element.classList.add('custom-note');
            this._element.innerHTML = RegularNote.HTML;
            const input = this._element.querySelector('textarea');
            const noteContentElem = this.contentElement;
            const noteRemoveIcon = this._element.querySelector('.custom-note-remove');
            noteContentElem.innerHTML = this.content.replace(/\n/g, '<br />');
            this.setupEditing(input);
            this.setupMoving();
            noteRemoveIcon.addEventListener('click', ev => {
                ev.stopPropagation();
                this.remove();
            });
            parent && parent.appendChild(this._element);
            return this._element;
        }
        get contentElement() {
            return this._element && this._element.querySelector('div.custom-note-content');
        }
        setupMoving() {
            const noteMoveIcon = this._element.querySelector('.custom-note-move');
            noteMoveIcon.addEventListener('mousedown', (ev) => {
                ev.stopPropagation();
                const offset = {
                    x: -noteMoveIcon.offsetLeft,
                    y: -noteMoveIcon.offsetTop,
                };
                this.startFollowingMouse(offset);
                this._endFollowingCb = () => this.endFollowingMouse();
                document.addEventListener('mouseup', this._endFollowingCb);
            });
        }
        endFollowingMouse() {
            document.removeEventListener('mousemove', this._followingCb);
            document.removeEventListener('mouseup', this._endFollowingCb);
            this.isMoving = false;
            this.parent.saveNote(this);
        }
        startFollowingMouse(followingOffset = { x: 0, y: 0 }) {
            this.followingOffset = followingOffset;
            if (!this.parentElement)
                return;
            this.isMoving = true;
            // this.lastMousePosition = { x: position.x - 10, y: position.y - 10 }  //offset      
            this.parentRect = this.parentElement.getBoundingClientRect();
            this._followingCb = (ev) => this.followMouse(ev);
            document.addEventListener('mousemove', this._followingCb);
        }
        followMouse(ev) {
            ev.preventDefault();
            const position = {
                x: (ev.x + this.followingOffset.x - this.parentRect.x) / this.parentRect.width,
                y: (ev.y + this.followingOffset.y - this.parentRect.y) / this.parentRect.height
            };
            this.metadata.position = position;
            this.setNotePosition(position);
        }
    }
    RegularNote.HTML = `
        <div class="custom-note-content"></div>
        <form> 
            <textarea></textarea> 
        </form>
        <a class="custom-note-remove">${SVGIcons.trash}</a>
        <a class="custom-note-move">${SVGIcons.move}</a>`;
    Notes.RegularNote = RegularNote;
    class NoteDeletedError extends Error {
        constructor() {
            super('Cannot modify deleted note!');
        }
    }
    class SlideMetadata {
        constructor(slide, screenid, slideTitle, presentationTitle, lessonID) {
            this.slide = slide;
            this.screenid = screenid;
            this.slideTitle = slideTitle;
            this.presentationTitle = presentationTitle;
            this.lessonID = lessonID;
        }
    }
    class NoteMetadata extends SlideMetadata {
        constructor(id, type, slideMetadata, position, textContext, color = '#95b9f9') {
            super(slideMetadata.slide, slideMetadata.screenid, slideMetadata.slideTitle, slideMetadata.presentationTitle, slideMetadata.lessonID);
            this.id = id;
            this.type = type;
            this.position = position;
            this.textContext = textContext;
            this.color = color;
        }
    }
    let Collections;
    (function (Collections) {
        class Slide extends CustomEventEmmiter {
            constructor(metadata, _notesRaw, parent) {
                super();
                this.metadata = metadata;
                this._notesRaw = _notesRaw;
                this.parent = parent;
                this._notes = [];
                _notesRaw.forEach(record => {
                    let note;
                    if (record.type !== 'tag') {
                        note = new RegularNote(new NoteMetadata(record.id, record.type, this.metadata, record.position, record.textContext), record.content, this);
                    }
                    else {
                        const tagColors = this.parent.tags;
                        const tagRecord = tagColors.find(tag => tag.name === record.content);
                        const color = tagRecord && tagRecord.color || record.color;
                        note = new TagNote(new NoteMetadata(record.id, record.type, this.metadata, undefined, undefined, color), record.content, this);
                        note.addEventListener('edited', ({ newContent }) => {
                            const tags = this.tags.map(tag => tag.content);
                            if (tags.filter(tag => tag === newContent).length > 1)
                                note.remove();
                        });
                    }
                    this._notes.push(note);
                });
                this._changedNotes = [];
                this._deletedNotes = [];
            }
            get notes() {
                return this._notes.filter(note => note instanceof RegularNote);
            }
            get tags() {
                return this._notes.filter(note => note instanceof TagNote);
            }
            get isSaved() {
                return (this._changedNotes.length + this._deletedNotes.length) === 0;
            }
            getNoteByPosition(position) {
                return this._notes.find(note => note.metadata.position === position);
            }
            getNoteById(id) {
                return this._notes.find(note => note.metadata.id === id);
            }
            addAnyNote({ position, content, textContext, presentationTitle, slideTitle, type, color, lessonID, screenid, slide }, constructor) {
                if (presentationTitle)
                    this.metadata.presentationTitle = presentationTitle;
                if (slideTitle)
                    this.metadata.slideTitle = slideTitle;
                const id = generateId();
                const note = new constructor(new NoteMetadata(id, type, this.metadata, position, textContext, color), content, this);
                this._notes.push(note);
                this._changedNotes.push(note);
                this.trigger('change', { added: [note] });
                return note;
            }
            addNote(options) {
                options.type = 'regular';
                return this.addAnyNote(options, RegularNote);
            }
            addTag(options) {
                options.type = 'tag';
                return this.addAnyNote(options, TagNote);
            }
            removeNoteByQuery(query) {
                let deleted;
                const indexInNotes = this._notes.findIndex(query);
                const indexInChangedNotes = this._changedNotes.findIndex(query);
                if (indexInNotes >= 0) {
                    deleted = this._notes.splice(indexInNotes, 1)[0];
                    this._deletedNotes.push(deleted);
                }
                if (indexInChangedNotes >= 0)
                    deleted = this._changedNotes.splice(indexInChangedNotes, 1)[0];
                deleted.remove(false);
                this.trigger('change', { deleted: [deleted] });
                //console.log('deleting', { deleted }, 'from SlideNotesCollection')
                return deleted;
            }
            removeAllNotes() {
                const toDelete = this._notes.concat(this._changedNotes);
                this._changedNotes = this._notes = [];
                this.trigger('change', { deleted: toDelete });
                this._deletedNotes.push(...toDelete);
                toDelete.forEach(note => {
                    note.remove(false);
                });
                return toDelete;
            }
            removeNoteById(id) {
                return this.removeNoteByQuery(note => note.metadata.id === id);
            }
            saveNote(note) {
                if (!this._changedNotes.includes(note))
                    this._changedNotes.push(note);
                this.trigger('change', { changed: [note] });
            }
            commitChanges() {
                return __awaiter(this, void 0, void 0, function* () {
                    this.trigger('commit', {});
                    yield this.parent.removeNotes(this._deletedNotes);
                    this._deletedNotes = [];
                    yield this.parent.saveNotes(this._changedNotes);
                    this._changedNotes = [];
                });
            }
        }
        Collections.Slide = Slide;
    })(Collections = Notes.Collections || (Notes.Collections = {}));
    function generateId() {
        return unsafeWindow.crypto.randomUUID();
    }
    (function (Collections) {
        class Presentation extends CustomEventEmmiter {
            constructor(db, _screenid, _lessonID) {
                super();
                this.db = db;
                this._screenid = _screenid;
                this._lessonID = _lessonID;
                this.cache = {};
                this._tags = [];
            }
            static setupDB(event, db) {
                let notesStore, tagsStore;
                if (event.oldVersion !== event.newVersion) {
                    notesStore = db.createObjectStore(Presentation.NOTES_STORE, { keyPath: 'id' });
                    tagsStore = db.createObjectStore(Presentation.TAGS_STORE, { keyPath: 'name' });
                }
                else {
                    const transaction = event.target.transaction;
                    notesStore = transaction.objectStore(Presentation.NOTES_STORE);
                    tagsStore = transaction.objectStore(Presentation.TAGS_STORE);
                }
                Presentation.generateIndexes(notesStore, Presentation.NOTES_INDEXES);
                Presentation.generateIndexes(tagsStore, Presentation.TAGS_INDEXES);
                // notesStore.createIndex('id', 'id', { unique: true })
                return notesStore;
            }
            static generateIndexes(store, indexes) {
                const notesIndexes = Object.values(indexes);
                notesIndexes.forEach(index => {
                    try {
                        store.createIndex(index.name, index.columns, index.options);
                    }
                    catch (err) {
                        console.error(err);
                    }
                });
            }
            static createAsync(screenid, lessonID) {
                return __awaiter(this, void 0, void 0, function* () {
                    const db = yield getIndexedDB("NotesDatabase", 5, Presentation.setupDB);
                    const notesCollection = new Presentation(db, screenid, lessonID);
                    return notesCollection;
                });
            }
            wipeCache() {
                this.cache = {};
            }
            getNotesBySlide(slide) {
                return __awaiter(this, void 0, void 0, function* () {
                    // if (this.cache[slide]) return this.cache[slide]
                    const transaction = this.db.transaction(Presentation.NOTES_STORE, 'readonly');
                    const notesStore = transaction.objectStore(Presentation.NOTES_STORE);
                    const screenidIndex = notesStore.index(Presentation.NOTES_INDEXES.byScreenIDAndSlide.name);
                    const notesRequest = screenidIndex.getAll([this._screenid, slide]);
                    return new Promise((resolve, reject) => {
                        notesRequest.addEventListener('success', ev => {
                            const notes = notesRequest.result;
                            const slideTitle = notes[0] && notes[0].slideTitle || '';
                            const presentationTitle = notes[0] && notes[0].presentationTitle || '';
                            const slideCollection = new Collections.Slide(new SlideMetadata(slide, this._screenid, slideTitle, presentationTitle, this._lessonID), notes, this);
                            this.cache[slide] = slideCollection;
                            resolve(slideCollection);
                        });
                        notesRequest.addEventListener('error', err => reject(err));
                    });
                });
            }
            get tags() {
                return this._tags;
            }
            getAllTagNames() {
                const transaction = this.db.transaction(Presentation.TAGS_STORE, 'readonly');
                const notesStore = transaction.objectStore(Presentation.TAGS_STORE);
                const screenidIndex = notesStore.index(Presentation.TAGS_INDEXES.byName.name);
                const allTags = screenidIndex.getAll();
                return new Promise((resolve, reject) => {
                    allTags.addEventListener('success', ev => {
                        const tagsResult = allTags.result;
                        if (this._tags.length !== tagsResult.length) {
                            this._tags = tagsResult;
                            this.trigger('changedTags', {
                                changed: tagsResult.map((tag, i) => {
                                    return Object.assign(Object.assign({}, tag), { index: i });
                                })
                            });
                        }
                        resolve(tagsResult);
                    });
                    allTags.addEventListener('error', err => reject(err));
                });
            }
            getAllTagsWithName(name) {
                const transaction = this.db.transaction(Presentation.NOTES_STORE, 'readonly');
                const notesStore = transaction.objectStore(Presentation.NOTES_STORE);
                const tagIndex = notesStore.index(Presentation.NOTES_INDEXES.byContentAndType.name);
                const notesRequest = tagIndex.getAll([name, 'tag']);
                return new Promise((resolve, reject) => {
                    notesRequest.addEventListener('success', ev => {
                        const notes = notesRequest.result;
                        resolve(notes);
                    });
                    notesRequest.addEventListener('error', err => reject(err));
                });
            }
            static mapNoteToRecord(note) {
                return {
                    content: note.content,
                    id: note.metadata.id,
                    screenid: note.metadata.screenid,
                    slide: note.metadata.slide,
                    position: note.metadata.position,
                    presentationTitle: note.metadata.presentationTitle,
                    slideTitle: note.metadata.slideTitle,
                    textContext: note.metadata.textContext,
                    type: note.metadata.type,
                    color: note.metadata.color,
                    lessonID: note.metadata.lessonID
                };
            }
            saveNotes(notes) {
                const records = notes.map(Presentation.mapNoteToRecord);
                return this.importNotes(records);
            }
            importNotes(notes) {
                //console.log('to import:', { notes })
                const transaction = this.db.transaction([Presentation.NOTES_STORE, Presentation.TAGS_STORE], 'readwrite');
                const notesStore = transaction.objectStore(Presentation.NOTES_STORE);
                const tagStore = transaction.objectStore(Presentation.TAGS_STORE);
                const changedTags = [];
                const addedTags = [];
                notes.forEach(record => {
                    notesStore.put(record);
                    if (record.type === 'tag') {
                        const name = record.content;
                        const color = record.color;
                        const toSave = { name, color };
                        tagStore.put(toSave);
                        const i = this._tags.findIndex(t => t.name === name);
                        if (i >= 0) {
                            if (this._tags[i].color !== color) {
                                this._tags[i].color = color;
                                changedTags.push(Object.assign(Object.assign({}, this._tags[i]), { index: i }));
                            }
                        }
                        else {
                            this._tags.push(toSave);
                            addedTags.push(toSave);
                        }
                    }
                });
                transaction.commit();
                if (changedTags.length || addedTags.length)
                    this.trigger('changedTags', {
                        changed: changedTags, added: addedTags
                    });
                return new Promise((resolve, reject) => {
                    transaction.addEventListener('complete', ev => {
                        resolve();
                    });
                    transaction.addEventListener('error', err => reject(err));
                });
            }
            removeNotes(notes) {
                const transaction = this.db.transaction(Presentation.NOTES_STORE, 'readwrite');
                const notesStore = transaction.objectStore(Presentation.NOTES_STORE);
                notes.forEach(note => {
                    //console.log('deleting', { note }, 'from PresentationNotesCollection')
                    notesStore.delete(note.metadata.id);
                });
                transaction.commit();
                return new Promise((resolve, reject) => {
                    transaction.addEventListener('complete', ev => {
                        resolve();
                    });
                    transaction.addEventListener('error', err => reject(err));
                });
            }
            exportNotes() {
                const transaction = this.db.transaction(Presentation.NOTES_STORE, 'readonly');
                const notesStore = transaction.objectStore(Presentation.NOTES_STORE);
                const screenidIndex = notesStore.index(Presentation.NOTES_INDEXES.byScreenID.name);
                const notesRequest = screenidIndex.getAll(this._screenid);
                return new Promise((resolve, reject) => {
                    notesRequest.addEventListener('success', ev => {
                        const notes = notesRequest.result;
                        resolve(notes);
                    });
                    notesRequest.addEventListener('error', err => reject(err));
                });
            }
        }
        Presentation.NOTES_STORE = 'Notes';
        Presentation.TAGS_STORE = 'Tags';
        Presentation.NOTES_INDEXES = {
            byScreenIDAndSlide: {
                name: 'byScreenIDAndSlide',
                columns: ['screenid', 'slide'],
                options: { unique: false }
            },
            byScreenID: {
                name: 'byScreenID',
                columns: 'screenid',
                options: { unique: false }
            },
            byContentAndType: {
                name: 'contentAndType',
                columns: ['content', 'type'],
                options: { unique: false }
            },
            byType: {
                name: 'byType',
                columns: 'type',
                options: { unique: false }
            },
            byContent: {
                name: 'byContent',
                columns: 'content',
                options: { unique: false }
            }
        };
        Presentation.TAGS_INDEXES = {
            byName: {
                columns: "name",
                name: 'byName',
                options: { unique: true }
            }
        };
        Collections.Presentation = Presentation;
    })(Collections = Notes.Collections || (Notes.Collections = {}));
})(Notes || (Notes = {}));
// PresentationNotesCollection.createAsync(892).then(collection => console.log(collection))
///<reference path="common.ts" />
///<reference path="options.ts" />
///<reference path="notes.ts" />
var BreakTimer;
(function (BreakTimer) {
    function start() {
        clearTimeout(BreakTimer.timer);
        //console.log('starting suggestBreak timer...')
        BreakTimer.timer = setTimeout(() => {
            alert('Pora na przerwę 🔔');
        }, 1000 * 60 * 7);
    }
    BreakTimer.start = start;
    toRunOnLoaded.push(() => {
        BreakTimer.observer = onAttributeChange(document.querySelector(".wnl-app-layout.wnl-course-layout" /* appDiv */), 'slide', () => {
            start();
        });
        tools && !tools.state.suggestBreak.value && BreakTimer.observer.disconnect();
    });
})(BreakTimer || (BreakTimer = {}));
let noteTarget;
const notesBtnsAndTags = ` 
    <div class='custom-tags-and-btns-container'>
        <div class='custom-tags-container'> 
            <a class='custom-new-tag custom-tag'>${SVGIcons.plusCircle}</a>  
        </div>
        <div class='custom-notes-btns-container'>
            <a class="custom-notes-view-btn custom-script-slideshow-btn wnl-rounded-button">
                <div class="a-icon -x-small custom-while-inactive" title="Pokaż notatki">
                    ${SVGIcons.stickies}
                </div>
                <div class="a-icon -x-small custom-while-active" title="Ukryj notatki">
                    ${SVGIcons.stickiesFill}
                </div>
            </a>
            <div class="custom-add-note-btns-container">
                <a class="custom-add-btn custom-script-slideshow-btn wnl-rounded-button">
                    <div class="a-icon -x-small custom-while-inactive" title="Dodaj...">
                        ${SVGIcons.plusSquare}
                    </div>
                    <div class="a-icon -x-small custom-while-active" style='transform: rotateZ(180deg)' title="Ukryj menu">
                        ${SVGIcons.chevronUp}
                    </div>
                </a>
                <div class="custom-add-note-btns">
                    <a class="custom-add-note-btn custom-script-slideshow-btn wnl-rounded-button">
                        <div class="a-icon -x-small" title="Dodaj notatkę">
                        ${SVGIcons.stickies}
                        </div>
                    </a>
                    <a class="custom-add-tag-btn custom-script-slideshow-btn wnl-rounded-button">
                        <div class="a-icon -x-small" title="Dodaj tag">
                        ${SVGIcons.tags}
                        </div>
                    </a>
                </div>
            </div>
            <div class='custom-notes-additional-btns'>
                <a class="custom-clear-notes-btn custom-script-slideshow-btn wnl-rounded-button">
                    <div class="a-icon -x-small" title="Usuń wszystkie notatki">
                        ${SVGIcons.eraserFill}
                    </div>
                </a>
                <a class="custom-notes-view-type-btn custom-script-slideshow-btn wnl-rounded-button">
                    <div class="a-icon -x-small custom-while-inactive" title="Pokaż notatki w kolumnie">
                        ${SVGIcons.layoutChaotic}
                    </div>
                    <div class="a-icon -x-small custom-while-active" title="Pokaż notatki na slajdzie">
                        ${SVGIcons.viewStack}
                    </div>
                </a>
            </div>
            <a class="custom-tags-view-btn custom-script-slideshow-btn wnl-rounded-button">
                <div class="a-icon -x-small custom-while-inactive" title="Pokaż tagi">
                    ${SVGIcons.tags}
                </div>
                <div class="a-icon -x-small custom-while-active" title="Ukryj tagi">
                    ${SVGIcons.tagsFill}
                </div>
            </a>
        </div>
    </div>`;
function loadNotes() {
    return __awaiter(this, void 0, void 0, function* () {
        const appDiv = document.querySelector(".wnl-app-layout.wnl-course-layout" /* appDiv */);
        notesCollection = yield Notes.Collections.Presentation.createAsync(presentationMetadata.screenID, presentationMetadata.lessonID);
        if (tools && tools.state.useNotes.value) {
            setupTagsNamesAndColors();
            const slideNumber = appDiv.attributes.getNamedItem('slide').value;
            return renderNotes(parseInt(slideNumber));
        }
    });
}
const tagColorsStyles = document.createElement('style');
document.head.append(tagColorsStyles);
function setupTagsNamesAndColors() {
    return __awaiter(this, void 0, void 0, function* () {
        const tags = yield notesCollection.getAllTagNames();
        addTagStyle(tags);
        const tagToOption = (tag) => {
            const opt = document.createElement('option');
            opt.value = tag.name;
            opt.style.background = tag.color;
            opt.innerHTML = tag.name;
            return opt;
        };
        const suggestions = tags.map(tagToOption);
        const suggestionsContainer = document.createElement('datalist');
        suggestionsContainer.id = 'custom-tags-list';
        suggestionsContainer.append(...suggestions);
        document.body.append(suggestionsContainer);
        notesCollection.addEventListener('changedTags', desc => {
            if (desc.added && desc.added.length) {
                addTagStyle(desc.added);
                suggestionsContainer.append(...desc.added.map(tagToOption));
            }
            if (desc.changed && desc.changed.length) {
                desc.changed.forEach(setTagColor);
            }
        });
    });
}
function addTagStyle(tags) {
    tags.forEach((tag) => __awaiter(this, void 0, void 0, function* () {
        const rule = yield getRuleFromTag(tag);
        //console.log({ rule })
        tagColorsStyles.sheet.insertRule(rule);
    }));
}
function getRuleFromTag(tag) {
    return __awaiter(this, void 0, void 0, function* () {
        const varName = yield setTagColor(tag);
        return `.custom-tag[title="${tag.name}"] { 
        background: var(${varName}-bg); 
        color: var(${varName}-color) 
    }`;
    });
}
const btnsContainerNoTags = new ClassToggler('custom-no-tags', '.custom-notes-btns-container');
const btnsContainerNoNotes = new ClassToggler('custom-no-notes', '.custom-notes-btns-container');
function getRandomTagColor() {
    const colors = ["#6e8898", "#606c38", "#fabc2a", "#c3423f", "#011936"];
    return getRandomElement(colors);
}
function setTagColor(tag) {
    return __awaiter(this, void 0, void 0, function* () {
        const varName = yield getTagVarName(tag);
        root.style.setProperty(`${varName}-bg`, tag.color);
        root.style.setProperty(`${varName}-color`, getForegroundColor(tag.color));
        return varName;
    });
}
function getTagVarName(tag) {
    return __awaiter(this, void 0, void 0, function* () {
        const subtleCrypto = unsafeWindow.crypto.subtle;
        const encoder = new TextEncoder();
        const toDigest = encoder.encode(tag.name);
        const hashBuffer = yield subtleCrypto.digest('SHA-1', toDigest);
        const hashArray = new Uint8Array(hashBuffer);
        const hash = hashArray.map(v => v.toString(16).padStart(2, '0')).slice(0, 15).join('');
        return `--custom-tag-${hash}`;
    });
}
function renderNotes(slideNumber) {
    if (currentSlideNotes) {
        currentSlideNotes.commitChanges();
        const removedListener = currentSlideNotes.removeEventListener('change', slideNotesChanged);
        //console.log({ removedListener })
    }
    if (tools && tools.state.useNotes.value && notesCollection) {
        if (noteTarget)
            noteTarget.innerHTML = '';
        const currentSlide = document.querySelector(".present .present" /* currentSlideContainer */);
        const notesOverlayElem = currentSlide.querySelector('.custom-notes-overlay');
        return notesCollection.getNotesBySlide(slideNumber).then(notes => {
            currentSlideNotes = notes;
            renderTags();
            btnsContainerNoNotes.state = !notes.notes.length;
            if (!noteTarget && notesOverlayElem)
                return notes.notes.map(n => n.element);
            //console.log({ currentSlideNotes })
            currentSlideNotes.addEventListener('change', slideNotesChanged);
            return addNoteElems(notes.notes);
        });
    }
}
function renderTags() {
    const tagContainer = document.querySelector('.custom-tags-container');
    const toRemove = Array.from(tagContainer.children);
    toRemove.pop();
    toRemove.forEach(el => el.remove());
    const tags = currentSlideNotes.tags;
    if (tags.length) {
        tags.forEach(tag => {
            tag.render(tagContainer);
            tag.addEventListener('colorChange', ({ newColor }) => {
                setTagColor({ color: newColor, name: tag.content });
            });
        });
    }
    btnsContainerNoTags.state = !tags.length;
}
function slideNotesChanged(change) {
    if (change.added) {
        const regular = change.added.filter(note => note instanceof Notes.RegularNote);
        if (regular.length)
            addNoteElems(regular);
        const tags = change.added.filter(note => note instanceof Notes.TagNote);
        btnsContainerNoTags.state && (btnsContainerNoTags.state = !tags.length);
        const tagContainer = document.querySelector('.custom-tags-container');
        tags.forEach(tag => {
            const tagElem = tag.render(tagContainer);
            tagElem.click();
        });
    }
    if (change.deleted && !currentSlideNotes.notes.length) {
        btnsContainerNoNotes.state = true;
    }
}
function addNoteElems(notes) {
    if (!notes.length)
        return;
    btnsContainerNoNotes.state = false;
    let parent;
    const currentSlide = document.querySelector(".present .present" /* currentSlideContainer */);
    if (noteTarget) {
        parent = noteTarget;
    }
    else {
        let notesOverlayElem = currentSlide.querySelector('.custom-notes-overlay');
        if (!notesOverlayElem) {
            notesOverlayElem = document.createElement('div');
            notesOverlayElem.classList.add('custom-notes-overlay');
        }
        currentSlide.prepend(notesOverlayElem);
        parent = notesOverlayElem;
    }
    return notes.map(note => {
        const noteElem = note.render(parent);
        const textContext = note.metadata.textContext;
        if (textContext && textContext.trim().length) {
            const allNodes = currentSlide.querySelectorAll('*');
            const contextElem = Array.from(allNodes).find(node => {
                return node.innerText && node.innerText.trim() === textContext.trim();
            });
            if (contextElem)
                setupContextElem(contextElem, note);
        }
        return noteElem;
    });
}
const addNoteBtnHandler = (event) => {
    if (currentSlideNotes) {
        const slide = document.querySelector(".present .present" /* currentSlideContainer */);
        slide.style.cursor = `copy`;
        const newNote = currentSlideNotes.addNote({
            content: '', position: { x: 0, y: 1 },
            presentationTitle: presentationMetadata.name,
            slideTitle: presentationMetadata.currentSlideTitle,
            type: 'regular'
        });
        newNote.startFollowingMouse({ x: 0, y: 10 });
        slide.addEventListener('click', event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            newNote.endFollowingMouse();
            slide.style.cursor = '';
            const contextElem = event.target;
            setupContextElem(contextElem, newNote);
            const textContext = contextElem.innerText;
            newNote.metadata.textContext = textContext;
            newNote.element.click();
        }, { once: true });
    }
};
function setupContextElem(contextElem, note) {
    const noteElem = note.element;
    contextElem.title = `Notatka: ${note.content}`;
    note.addEventListener('change', ({ newContent }) => contextElem.title = `Notatka: ${newContent}`);
    note.addEventListener('remove', () => contextElem.title = '');
    noteElem.addEventListener('mouseenter', () => {
        if (note.isMoving)
            return;
        contextElem.style.border = 'solid 1px black';
    });
    noteElem.addEventListener('mouseleave', () => {
        contextElem.style.border = '';
    });
    note.addEventListener('remove', () => {
        contextElem.style.border = '';
    });
}
function addNotesColumn() {
    const notesContainer = document.createElement('div');
    notesContainer.classList.add('custom-script-notes-column', 'custom-script-hidden');
    document.querySelector('.order-number-container').after(notesContainer);
    return notesContainer;
}
const notesOverlayToggle = new ClassToggler('custom-script-notes-visible');
const noteColumnToggle = new ClassToggler('custom-script-hidden', '.custom-script-notes-column');
toRunOnLoaded.push(() => {
    if (tools && tools.state.useNotes.value) {
        addNotesColumn();
        setupNotesBtns();
    }
});
tools = new Options([
    {
        name: "suggestBreak",
        desc: state => `${getCheckboxEmoji(state.value)}🔔 Sugeruj przerwę przy dłuższym braku aktywności`,
        defaultValue: false,
        callback: function (state) {
            return { value: !state.value };
        },
        update: state => {
            //console.log('update suggestBreak', { state, obs: BreakTimer.observer })
            if (!BreakTimer.observer)
                return;
            if (state.value) {
                BreakTimer.observer.observe(document.querySelector(".wnl-app-layout.wnl-course-layout" /* appDiv */), { attributes: true });
                BreakTimer.start();
            }
            else {
                BreakTimer.observer.disconnect();
                if (BreakTimer.timer)
                    clearTimeout(BreakTimer.timer);
            }
        }
    },
    {
        name: "useNotes",
        desc: state => `${getCheckboxEmoji(state.value)}📝 Używaj notatek i tagów`,
        defaultValue: false,
        callback: function (state) {
            return { value: !state.value };
        },
        update: state => {
            toggleBodyClass('custom-script-use-notes', state.value);
            if (presentationMetadata.screenID && state.value && !notesCollection) {
                addNotesColumn();
                setupNotesBtns();
                loadNotes();
            }
        },
        init: state => {
        },
    },
    {
        name: "exportNotes",
        desc: "📤 Eksportuj notatki",
        type: 'button',
        callback: () => {
            notesCollection.exportNotes().then(notes => {
                //console.log({ notes })
                downloadFile('application/json', `${presentationMetadata.name}-notes.json`, JSON.stringify(notes));
            });
        }
    },
    {
        name: "importNotes",
        desc: "📥 Importuj notatki",
        type: 'button',
        callback: (state) => {
            const uploadInput = state.uploadInput;
            uploadInput.addEventListener('change', (ev) => {
                //console.log({ ev })
                if (uploadInput.files.length) {
                    const file = uploadInput.files.item(0);
                    file.text().then(imported => notesCollection.importNotes(JSON.parse(imported))).then(() => unsafeWindow.location.reload());
                }
            }, { once: true });
            uploadInput.click();
        },
        init: (state) => {
            const uploadInput = document.createElement('input');
            uploadInput.type = 'file';
            uploadInput.name = 'importNotes';
            uploadInput.accept = 'application/json';
            uploadInput.style.display = 'none';
            document.body.appendChild(uploadInput);
            state.uploadInput = uploadInput;
        }
    }
], `.${"custom-script-tools-container" /* toolsContainer */}`);
function setupNotesBtns() {
    const addBtn = document.querySelector('.custom-add-btn');
    const addBtnContToggle = new ClassToggler('active', '.custom-add-note-btns');
    const addBtnToggle = new ClassToggler('active', addBtn, t => {
        addBtnContToggle.state = t.state;
    });
    addBtn.addEventListener('click', () => addBtnToggle.toggle());
    const viewTagsBtn = document.querySelector('.custom-tags-view-btn');
    const viewTagsToggle = new ClassToggler('custom-script-tags-visible');
    const viewTagsBtnToggle = new ClassToggler('active', viewTagsBtn, t => viewTagsToggle.state = t.state);
    viewTagsBtn.addEventListener('click', () => viewTagsBtnToggle.toggle());
    const addTagBtns = document.querySelectorAll('.custom-new-tag, .custom-add-tag-btn');
    const onAddTag = () => {
        addBtnToggle.state = false;
        viewTagsBtnToggle.state = true;
        addTag();
    };
    addTagBtns.forEach(btn => btn.addEventListener('click', onAddTag));
    Keyboard.registerShortcut({ keys: ['t'], callback: onAddTag });
    const clearNotesBtn = document.querySelector('.custom-clear-notes-btn');
    clearNotesBtn.addEventListener('click', () => {
        if (currentSlideNotes && confirm(`Czy na pewno usunąć WSZYSTKIE (${currentSlideNotes.notes.length}) notatki ze slajdu ${currentSlideNotes.metadata.slide}?`))
            currentSlideNotes.removeAllNotes();
    });
    let viewNotesBtnToggle;
    const viewNotesBtn = document.querySelector('.custom-notes-view-btn');
    const hiddenBtnsToggle = new ClassToggler('inactive', '.custom-notes-additional-btns');
    const viewTypeBtn = document.querySelector('.custom-notes-view-type-btn');
    const viewTypeBtnToggle = new ClassToggler('active', viewTypeBtn, t => {
        if (!viewNotesBtnToggle || !viewNotesBtnToggle.state)
            return;
        noteColumnToggle.state = !t.state;
        notesOverlayToggle.state = !t.state;
        if (t.state) {
            noteTarget = noteColumnToggle.element;
            noteTarget.innerHTML = '';
        }
        else {
            noteTarget = null;
            document.querySelectorAll('.custom-notes-overlay').forEach(el => el.remove());
        }
        currentSlideNotes.commitChanges().then(() => {
            renderNotes(presentationMetadata.currentSlideNumber);
        });
    });
    viewNotesBtnToggle = new ClassToggler('active', viewNotesBtn, t => {
        hiddenBtnsToggle.state = !t.state;
        notesOverlayToggle.state = !viewTypeBtnToggle.state && t.state;
        noteColumnToggle.state = !(viewTypeBtnToggle.state && t.state);
    });
    const addNoteBtn = document.querySelector('.custom-add-note-btn');
    addNoteBtn.addEventListener('click', (ev) => {
        addBtnToggle.state = false;
        viewNotesBtnToggle.state = true;
        addNoteBtnHandler(ev);
    });
    viewNotesBtnToggle.state = tools && tools.state.useNotes.value;
    viewNotesBtn.addEventListener('click', () => viewNotesBtnToggle.toggle());
    Keyboard.registerShortcut({
        keys: ['n'], callback: () => viewNotesBtnToggle.toggle()
    });
    viewTypeBtn.addEventListener('click', () => viewTypeBtnToggle.toggle());
    Keyboard.registerShortcut({
        keys: ['v'], callback: () => viewTypeBtnToggle.toggle()
    });
}
function addTag() {
    currentSlideNotes.addTag({
        content: '', color: getRandomTagColor(),
        presentationTitle: presentationMetadata.name,
        slideTitle: presentationMetadata.currentSlideTitle
    });
}
const slideshowOptionsBtn = `
    <a class="custom-options-btn custom-script-slideshow-btn wnl-rounded-button">
        <div class="a-icon -x-small" title="Opcje">
            ${SVGIcons.chevronUp}
        </div>
    </a>`;
const slideshowOptions = `
    <a class="custom-search-btn custom-script-slideshow-btn wnl-rounded-button">
        <div class="a-icon -x-small" title="Szukaj" style="margin: 0;padding: 0;">
            ${SVGIcons.search}
        </div>
        <span class="custom-btn-caption">SZUKAJ</span>
    </a>
    <a class="custom-zoom-up-btn custom-script-slideshow-btn wnl-rounded-button">
        <div class="a-icon -x-small" title="Powiększ">
            ${SVGIcons.zoomIn}
        </div>
    </a>
    <a class="custom-zoom-down-btn custom-script-slideshow-btn wnl-rounded-button">
        <div class="a-icon -x-small" title="Powiększ">
            ${SVGIcons.zoomOut}
        </div>
    </a>`;
function addSlideOptions() {
    const bookmarkBtn = document.querySelector('.wnl-rounded-button.bookmark');
    if (!bookmarkBtn)
        return;
    Search.addSearchContainer();
    slideOptionsContainer = document.createElement('div');
    slideOptionsContainer.innerHTML = notesBtnsAndTags + slideshowOptionsBtn;
    additionalOptionsContainer = document.createElement('div');
    additionalOptionsContainer.className = 'custom-script-hidden custom-script-additional-options';
    additionalOptionsContainer.innerHTML = slideshowOptions;
    slideOptionsContainer.append(additionalOptionsContainer);
    bookmarkBtn.after(slideOptionsContainer);
    additionalOptionsContainer.prepend(bookmarkBtn);
    slideOptionsContainer.querySelector('.custom-options-btn').addEventListener('click', () => Toggles.optionsActive.toggle());
    slideOptionsContainer.querySelector('.custom-search-btn').addEventListener('click', () => {
        Toggles.optionsActive.state = false;
        Toggles.searchHidden.toggle();
    });
    slideOptionsContainer.querySelector('.custom-zoom-up-btn').addEventListener('click', () => {
        if (options) {
            options.state.percentIncrease.increaseBy(5);
        }
    });
    slideOptionsContainer.querySelector('.custom-zoom-down-btn').addEventListener('click', () => {
        if (options) {
            options.state.percentIncrease.increaseBy(-5);
        }
    });
}
function addSummary(metadata) {
    const linksHTML = metadata.map((e, i) => `<a class='custom-script-summary-link' href='${e.href}'
           data-start-page=${e.startPage} data-index=${i}>
               <span>${e.name} </span>
               <span class='small'>(${e.chapterLength})</span>
       </a>`).join('');
    summaryContainer = document.createElement('div');
    summaryContainer.className = 'custom-script-summary custom-script-hidden';
    summaryContainer.innerHTML = linksHTML;
    const closeBtn = document.createElement('div');
    closeBtn.className = 'custom-script-summary-close';
    closeBtn.innerHTML = SVGIcons.chevronUp;
    summaryContainer.prepend(closeBtn);
    closeBtn.addEventListener('click', () => Toggles.summaryHidden.state = true);
    document.querySelector('.order-number-container').after(summaryContainer);
    const links = summaryContainer.querySelectorAll('a.custom-script-summary-link');
    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const { startPage } = link.dataset;
            goToSlideN(parseInt(startPage));
            return false;
        });
    });
}
function addChapterInfo() {
    getMetadata(metadata => {
        //console.log({ metadata });
        if (!metadata)
            return;
        addPageNumberContainer();
        addSummary(metadata);
        observeSlideNumber(page => onSlideChanged(page, metadata));
        const slideNumberSpan = document.querySelector('.order-number-container');
        onSlideChanged(parseInt(slideNumberSpan.innerText), metadata);
    });
}
function onSlideChanged(current, metadata) {
    if (current === NaN)
        return;
    presentationMetadata.currentSlideNumber = current;
    const pageNumberContainer = document.querySelector(`.${"custom-script-page-number-container" /* pageNumberContainer */}`);
    const getChapterIndex = page => {
        const i = metadata.findIndex(m => m.startPage > page) - 1;
        return i >= 0 ? i : metadata.length - 1;
    };
    const chapterIndex = getChapterIndex(current);
    const chapterMetadata = metadata[chapterIndex];
    const relativeCurrent = current - chapterMetadata.startPage + 1;
    const chapterLength = chapterMetadata.chapterLength;
    const relativeCurrentContainer = pageNumberContainer.querySelector(`.${"current-number" /* currentChapterPage */}`);
    relativeCurrentContainer.innerText = relativeCurrent.toString();
    const chapterLengthContainer = pageNumberContainer.querySelector(`.${"n-of-pages" /* chapterLength */}`);
    chapterLengthContainer.innerText = chapterLength.toString();
    if (summaryContainer) {
        summaryContainer.querySelectorAll('a').forEach(a => a.classList.remove('is-active'));
        const active = summaryContainer.querySelector(`[data-index="${chapterIndex}"]`);
        active.classList.add('is-active');
        if (!summaryContainer.className.includes('custom-script-hidden')) {
            active.scrollIntoView({ behavior: "smooth" });
        }
    }
    updateTabTitle();
    renderNotes(current);
}
function addPageNumberContainer() {
    const classNames = ["custom-script-page-number-container" /* pageNumberContainer */, "current-number" /* currentChapterPage */, '', "n-of-pages" /* chapterLength */];
    const spans = classNames.map(name => {
        const span = document.createElement('span');
        span.className = name;
        return span;
    });
    spans[2].innerText = '/';
    for (let i = 1; i <= 3; i++) {
        spans[0].appendChild(spans[i]);
    }
    document.querySelector('.order-number-container').after(spans[0]);
    spans[0].addEventListener('click', () => Toggles.summaryHidden.toggle());
    return spans[0];
}
function openMenu() {
    const menuBtn = document.querySelector(".topNavContainer__beforeLogo.topNavContainer__megaMenuMobileEntryPoint" /* menuBtn */);
    if (menuBtn) {
        menuBtn.click();
        return true;
    }
}
function getMetadata(cb, menuOpened) {
    const menu = document.querySelector('aside.sidenav-aside');
    if (!menu) {
        if (menuOpened) {
            cb(false);
            return;
        }
        openMenu();
        setTimeout(() => getMetadata(cb, true), 100);
        return;
    }
    const active = menu.querySelector('.item-wrapper.is-active');
    if (!active) {
        cb(false);
        return;
    }
    const listParent = active.parentElement;
    if (!listParent) {
        cb(false);
        return;
    }
    const list = Array.from(listParent.children);
    if (menuOpened)
        closeMenu();
    if (list.length === 0) {
        cb(false);
        return;
    }
    const wrappers = list.filter(el => el.nodeName === 'DIV');
    if (wrappers.length === 0) {
        cb(false);
        return;
    }
    const linksMetadata = getMetadataFromLinks(wrappers);
    chapterMetadata = linksMetadata;
    cb(linksMetadata);
}
function closeMenu() {
    document.querySelector('.topNavContainer__close').click();
}
function getMetadataFromLinks(wrappers) {
    const links = wrappers.map(div => div.querySelector('a'));
    const getLength = (t) => parseInt(t.slice(1, -1));
    return links.map((a, i) => {
        if (!a.href)
            return {};
        const chapterLength = getLength(a.querySelector('span span.sidenav-item-meta').innerText);
        if (chapterLength > 75) {
            const subwrappers = wrappers[i].querySelectorAll('div');
            if (subwrappers.length) {
                return getMetadataFromLinks(Array.from(subwrappers));
            }
        }
        return {
            href: a.href,
            name: a.querySelector('span span').innerText,
            chapterLength,
            startPage: parseInt(a.href.split('/').pop())
        };
    }).flat(1);
}
///<reference path="utils/enums.ts" />
const styles = `
:root {
    --uniform-font-size: 0.93em;
    --scaled-font-size: 110%;
}

html {
    scroll-behavior: smooth;
}

.questionsList__paginationContainer {
    /* position: absolute!important; */
    top: 0;
    left: 0;
    z-index: 1000;
    background: white;
}

.${"custom-script-increase-font-size" /* increaseFontSize */} .sl-block-content span[style*='21px'] {
    font-size: 0.75em!important;
}

.${"custom-script-option-container" /* optionContainer */} {
    padding: 5px 15px;
}

.${"custom-script-option-container" /* optionContainer */}:hover {
    background-color: #f6f6f6
}

a.custom-script-option {
    color: #0c1726
}

.${"custom-script-increase-annotations" /* increaseAnnotations */} article.content.-styleguide p {
    font-size: var(--scaled-font-size);
    line-height: 150%;
}

.${"custom-script-increase-font-size" /* increaseFontSize */} .sl-block-content p {
    font-size: var(--scaled-font-size)!important;
}

.${"custom-script-uniform-font-size" /* uniformFontSize */} .sl-block-content :not(h1,h2,h3,h1 *,h2 *,h3 *) {
    font-size: var(--uniform-font-size)!important;
}

@media screen and (orientation:landscape) {
   section.stack.present section {
       overflow-y: auto;
       overflow-x: hidden;
       padding-bottom: 1em;
   }
}


.${"custom-script-increase-font-size" /* increaseFontSize */} .wnl-reference {
    margin-left: 0.5em
}

.${"custom-script-increase-font-size" /* increaseFontSize */} .wnl-reference svg,
.${"custom-script-uniform-font-size" /* uniformFontSize */} .wnl-reference svg {
    transform: scale(1.6)!important;
}

sub.small {
    margin-left: 0.5rem!important;
    font-size: 1.5rem!important;
}

.m-imageFullscreenWrapper {
    max-height: 80vh;
    text-align: center;
}

.m-imageFullscreenWrapper img {
    max-height: 80vh;
    margin: auto!important;
}

.image-fullscreen-index {
    margin: 0 0.3rem;
    color: #8b8b8b;
    padding: 0;
    font-size: 0.8rem;
}

.${"custom-script-page-number-container" /* pageNumberContainer */} {
    position: absolute;
    top: 30px;
    left: 0;
    z-index: 10;
    font-size: 0.8rem;
    color: #7a7a7a;
    padding-left: 10px;
    padding-bottom: 1rem;
    padding-right: 1.5rem;
    cursor: pointer;
}

body.${"custom-script-hide-cursor" /* hideCursor */} {
    cursor: none;
}

.custom-script-hidden {
    visibility: hidden;
    top: -70vh!important;
}

.custom-script-summary-close {
    text-align: center;
    cursor: pointer;
    background: #ffffff8c;
    margin: 0.2rem;
    border-radius: 5px;
    height: 16px;
}

.custom-script-summary{
    left: 10px;
}
.custom-script-search {
    right: 10px;
}
.custom-script-summary, .custom-script-search, 
.custom-script-notes-column {
    position: absolute;
    top: 50px;
    left: 10px;
    z-index: 10;
    font-size: 0.8rem;
    width: 11rem;
    max-height: 70%;
    overflow-y: auto;
    background-color: rgb(247 247 247 / 90%);
    border-radius: 5px;
    box-shadow: 0px 1px 2px 2px #00000014;
    transition: top 1s, visibility 1s;
    resize: horizontal;
    min-width: 11rem;
}

.custom-search-result {
    margin: 0.2rem;
    background: white;
    border-radius: 5px;
    padding: 5px;
    display: block;
    color: #222;
    overflow: hidden;
    word-break: break-word;
}

.custom-search-result em {
    font-weight: 900;
    padding-right: 0.2rem;
}

a.custom-script-summary-link {
    display: block;
    padding: 0.1rem 0.2rem;
}

.custom-script-additional-options {
    position: absolute;
    top: 55px;
    right: 5px;
    max-height: 30%;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    width: 100px;
    align-items: flex-end;
    transition: all 1s;
}

a.custom-script-slideshow-btn.wnl-rounded-button {
    align-items: center;
    flex-direction: column;
    z-index: 5;
    display: flex;
    background-color: #fafafabf;
    border-radius: 5%;
    height: 40px;
    justify-content: center;
    width: 40px;
    margin: 5px;
    overflow: hidden;
    transition: width 0.5s, margin 0.5s;
}

span.custom-btn-caption {
    font-size: 0.675rem;
    line-height: 1.2rem;
}

a.wnl-rounded-button.bookmark {
    position: unset;
    margin: 5px;
}

a.custom-options-btn {
    top: 5px;
    position: absolute;
    right: 5px;
}

a.custom-options-btn svg {
    transform: rotateX(180deg);
    transition: transform 1s;
}

a.custom-options-btn.active svg {transform: none;}

.${"custom-script-font-size-label" /* fontSizeLabel */} {
    margin: 0 0.5rem;
    height: 16px;
    font-size: 24px; 
    vertical-align: top;
    width: 4.3rem;
    display: inline-block;
    text-align: center;
}

.${"custom-script-font-size-input" /* fontSizeInput */}-increase, .${"custom-script-font-size-input" /* fontSizeInput */}-decrease {
    vertical-align: sub;
}

.${"custom-script-font-size-input" /* fontSizeInput */} {
    -webkit-appearance: none;
    appearance: none;
    margin-right: 0.9em;
    outline: none;
    height: 0.6rem;
    background: #96dbdf;
    border-radius: 5px;
    vertical-align: middle;
}

.${"custom-script-font-size-input" /* fontSizeInput */}::-webkit-slider-thumb {
    -webkit-appearance: none; 
    appearance: none;
    cursor: pointer;
    width: 0.8rem;
    height: 0.8rem;
    background: var(--color-primary-text);
    border-radius: 0.4rem;
}

.${"custom-script-font-size-input" /* fontSizeInput */}::-moz-range-thumb {
    cursor: pointer;
    width: 0.8rem;
    height: 0.8rem;
    background: var(--color-primary-text);
    border-radius: 0.4rem;
}

.${"custom-script-zoom-slider-container" /* zoomSliderContainer */}, .${"custom-script-settings-container" /* settingsContainer */}, 
.${"custom-script-tools-container" /* toolsContainer */} {
    margin-top: 1rem; 
    border: 1px solid rgb(239, 240, 243); 
    padding: 15px; 
}

.custom-notes-btns-container {
    flex-direction: row;
    align-items: flex-end;
    flex-wrap: wrap-reverse;
    display: none!important;
}

.custom-notes-additional-btns {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
}

.custom-add-note-btns.active {
    height: 90px;
}

.custom-add-note-btns {
    height: 0;
    overflow: hidden;
    transition: height 0.5s;
}

.custom-add-note-btns-container {
    display: flex;
    flex-direction: column-reverse;
}

.custom-script-use-notes .fullscreen-mode .wnl-comments, 
.custom-script-use-notes .wnl-lesson-previous-next-nav {
    z-index: 12!important;
}

.custom-notes-btns-container .wnl-rounded-button {
    color: black!important;
}

.slideshow-container.fullscreen .custom-notes-btns-container {
    margin-left: 70px;
}

.custom-script-notes-column:empty {
    display: none;
}

.custom-script-notes-column .custom-note {
    display: flex;
    align-content: space-between;
    flex-direction: row;
    padding: 5px;
    margin: 5px;
    border-radius: 5px;
    background: white;
}

.custom-script-notes-column .custom-note .custom-note-move {display: none;}

.custom-script-notes-column .custom-note .custom-note-remove {
    color: black;
    margin-right: 0;
    margin-left: auto;
}

.custom-notes-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
}

.custom-notes-overlay .custom-note {
    font-size: 1.6rem!important;
    background: #feffcc;
    position: absolute;
    border: solid 2px #b1b18e;
    padding: 0.5rem 35px 0.5rem 0.5rem!important;
    border-radius: 0.5rem 0.5rem 1.5rem 0.5rem;
    box-shadow: 2px 1px 2px 2px #72725c57;
    min-width: 7rem;
    max-width: 25%;
    max-height: 30%;
    z-index: 11;
    min-height: 70px;
    overflow-y: auto;
}

.custom-note form,
.custom-tag form {display: none;}

.custom-note.editing form, 
.custom-tag.editing form {display: block;}

.custom-note.editing .custom-note-content, 
.custom-tag.editing .custom-tag-content {display: none;}

.custom-note textarea,
.custom-tag input {
    appearance: none;
    border: none;
    width: 100%!important;
    height: 100%!important;
    background: none;
}

.custom-tag input[type=color] {
    display: none;
}

.custom-notes-overlay a.custom-note-remove {    
    top: 0;
}

a.custom-note-move {    
    bottom: 12px;
    cursor: move;
}

.custom-note-content {    
    text-align: left;
}

.custom-notes-overlay a.custom-note-remove, a.custom-note-move {
    position: absolute!important;
    right: 4px;
    color: black!important;
    width: 25px;
    height: 25px;
    transition: color 0.5s;
}

.custom-notes-overlay a.custom-note-remove svg, a.custom-note-move svg {
    width: 25px;
    height: 25px;
}

a.custom-note-remove:hover {color: red!important;}

div.custom-tags-container:hover {    
    opacity: 1;
}

.custom-tags-and-btns-container {    
    left: 5px;
    position: absolute;
    bottom: 5px;
    z-index: 11;
    display: flex;
    flex-direction: column;
    max-width: 25%;
}

div.custom-tags-container {    
    z-index: 11;
    flex-wrap: wrap-reverse;
    opacity: 0.5;
    transition: opacity 0.4s;
    display: none;
    gap: 3px 5px;
}

.custom-tag.custom-new-tag {
    color: #95b9f9;
    background: none;
    align-items: center;
}

.custom-tag {
    border-radius: 5px;
    padding: 2px 5px;
    display: flex;
    font-size: 12px;
    max-width: 70px;
    height: 25px;
    overflow: hidden;
    align-content: space-between;
    justify-content: space-between;
    flex-wrap: nowrap;
    flex-direction: row;
}

.custom-tag-content {
    overflow: hidden;
    display: inline-block;
    text-overflow: ellipsis; 
}

div.custom-tag .custom-remove,
div.custom-tag .custom-change-color {
    display: inline-block;
    text-align: right;
    cursor: pointer;
    width: 0;
    overflow: hidden;
    transition: width 0.5s, color 0.5s;
    color: inherit;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-shrink: 0;
}

div.custom-tag .custom-remove:hover {
    color: #870000;
}

div.custom-tag .custom-remove svg,
div.custom-tag .custom-change-color svg {
    width: 13px;
    height: 13px;
}

div.custom-tag:not(.editing):hover .custom-remove,
div.custom-tag:not(.editing):hover .custom-change-color {
    width: 16px;
}

.custom-notes-btns-container.custom-no-notes .custom-clear-notes-btn, 
.custom-notes-btns-container.custom-no-notes .custom-notes-view-type-btn,
.inactive.custom-notes-additional-btns > .wnl-rounded-button {
    width: 0;
    margin: 5px 0;
}

.custom-new-tag.custom-tag:only-child {
    display: none;
}

.custom-while-active {display: none!important;}

.active .custom-while-active.a-icon {display: inline-flex!important;}

.active .custom-while-inactive {display: none!important;}

.custom-script-use-notes.custom-script-notes-visible .custom-notes-overlay {display: block!important;}

.custom-script-use-notes .custom-notes-btns-container, 
.custom-script-use-notes.custom-script-tags-visible div.custom-tags-container {
    display: flex!important;
}

.${"custom-script-hide-chat" /* hideChat */} .wnl-chat-toggle {
    display: none!important;
}

.${"custom-script-invert-images" /* invertImages */} img.iv-large-image, .logo-mobile {
    filter: invert(1) hue-rotate(180deg) saturate(1.4);
}`;
const head = unsafeWindow.document.querySelector('head');
const stylesheet = document.createElement('style');
stylesheet.innerHTML = styles;
head.appendChild(stylesheet);
///<reference path="packageMetadata.ts" />
///<reference path="globals.d.ts" />
///<reference path="utils/enums.ts" />
///<reference path="utils/common.ts" />
///<reference path="utils/tools.ts" />
///<reference path="utils/keyboard.ts" />
///<reference path="utils/slideshowOptions.ts" />
///<reference path="style.ts" />
(function () {
    'use strict';
    //@ts-ignore
    __SENTRY__.hub.getClient().getOptions().enabled = false;
    function onLoaded() {
        if (!appDiv) {
            appDiv = document.querySelector(".wnl-app-layout.wnl-course-layout" /* appDiv */);
            if (appDiv) {
                onAttributeChange(appDiv, 'screenid', checkUnloaded);
                presentationMetadata.screenID = parseInt(appDiv.attributes.getNamedItem('screenid').value);
                presentationMetadata.lessonID = getCurrentLessonID();
                //console.log({ screenid: presentationMetadata.screenID })
                if (tools && tools.state.useNotes.value) {
                    loadNotes();
                }
            }
        }
        let background = document.querySelector(".image-custom-background" /* background */);
        if (background !== null) {
            background.classList.remove("image-custom-background");
            background.classList.add("white-custom-background");
        }
        const lessonView = document.querySelector(".wnl-lesson-view" /* lessonView */);
        if (lessonView !== null) {
            const mainHeaderElem = document.querySelector('.o-lesson__title__left__header');
            if (mainHeaderElem !== null)
                presentationMetadata.name = mainHeaderElem.innerText;
            addSliderContainer();
            addSettingsContainer();
            addToolsContainer();
        }
        if (GM_getValue(`option_keyboardControl`))
            Keyboard.setupControl();
        addChapterInfo();
        addSlideOptions();
        toRunOnLoaded.forEach(cb => cb());
        GM_getTabs(tabsObject => {
            console.log({ tabsObject });
            const tabs = Object.values(tabsObject);
            let maxIndex = 0;
            if (tabs) {
                tabs.forEach(tab => {
                    if (tab && tab.index > maxIndex)
                        maxIndex = tab.index;
                });
                maxIndex++;
            }
            thisTabIndex = maxIndex;
            console.log({ thisTabIndex });
            GM_saveTab({ index: maxIndex });
        });
        GM_setValue('openInTab', {
            lessonID: presentationMetadata.lessonID,
            screenID: presentationMetadata.screenID,
            slide: presentationMetadata.currentSlideNumber,
            currentTab: -1
        });
        GM_addValueChangeListener('openInTab', (name, oldVal, toOpen, remote) => {
            console.log('GM_ValueChangeListener', name, oldVal, toOpen, remote);
            openSlideInTab(toOpen);
        });
        unsafeWindow.addEventListener('beforeunload', ev => {
            onUnload();
        });
    }
    function addSliderContainer() {
        const test = document.querySelector(`input.${"custom-script-font-size-input" /* fontSizeInput */}`);
        if (test)
            return;
        const lessonView = document.querySelector(".wnl-lesson-view" /* lessonView */);
        const sliderContainer = document.createElement('div');
        sliderContainer.innerHTML = zoomSliderHTML;
        lessonView.appendChild(sliderContainer);
        sliderContainer.querySelector(`input.${"custom-script-font-size-input" /* fontSizeInput */}`)
            .addEventListener('input', e => document.querySelector(`.${"custom-script-font-size-label" /* fontSizeLabel */}`).innerText = `${e.target.value}%`);
        sliderContainer.querySelector(`.${"custom-script-font-size-input" /* fontSizeInput */}-increase`)
            .addEventListener('click', () => {
            options.setOptionState(state => { return { value: state.value + 5 }; }, 'percentIncrease');
        });
        sliderContainer.querySelector(`.${"custom-script-font-size-input" /* fontSizeInput */}-decrease`)
            .addEventListener('click', () => {
            options.setOptionState(state => { return { value: state.value - 5 }; }, 'percentIncrease');
        });
    }
    function addToolsContainer() {
        const test = document.querySelector(`.${"custom-script-tools-container" /* toolsContainer */}`);
        if (test)
            return;
        const lessonView = document.querySelector(".wnl-lesson-view" /* lessonView */);
        const toolsContainer = document.createElement('div');
        toolsContainer.classList.add("custom-script-tools-container" /* toolsContainer */);
        toolsContainer.innerHTML = `
            <span class="metadata" style="display: block;margin-bottom: 15px;">narzędzia</span>
            <div></div>`;
        lessonView.appendChild(toolsContainer);
        tools.rerender();
    }
    function addSettingsContainer() {
        const test = document.querySelector(`.${"custom-script-settings-container" /* settingsContainer */}`);
        if (test)
            return;
        const lessonView = document.querySelector(".wnl-lesson-view" /* lessonView */);
        const sidebarSettingsContainer = document.createElement('div');
        sidebarSettingsContainer.classList.add("custom-script-settings-container" /* settingsContainer */);
        sidebarSettingsContainer.innerHTML = `
            <span class="metadata" style="display: block;margin-bottom: 15px;">ustawienia</span>
            <div></div>`;
        lessonView.appendChild(sidebarSettingsContainer);
        options.rerender();
    }
    let isAwaiting = false;
    awaitLoad();
    let appDiv = document.querySelector(".wnl-app-layout.wnl-course-layout" /* appDiv */);
    if (appDiv)
        onAttributeChange(appDiv, 'screenid', checkUnloaded);
    function awaitLoad() {
        let checkLoadedInterval;
        isAwaiting = true;
        checkLoadedInterval = setInterval(() => {
            const testExtensionLoaded = document.querySelector(`.${"custom-script-page-number-container" /* pageNumberContainer */}`);
            if (testExtensionLoaded) {
                isAwaiting = false;
                clearInterval(checkLoadedInterval);
                return;
            }
            const testSlideshowLoaded = document.querySelector('.order-number-container');
            if (testSlideshowLoaded) {
                isAwaiting = false;
                clearInterval(checkLoadedInterval);
                onLoaded();
            }
        }, 300);
    }
    function checkUnloaded() {
        //console.log('unloaded??')
        const testExtensionLoaded = document.querySelector(`.${"custom-script-page-number-container" /* pageNumberContainer */}`);
        if (!isAwaiting && !testExtensionLoaded) {
            //console.log('unloaded!!!')
            onUnload();
            awaitLoad();
        }
    }
    function onUnload() {
        for (const key in presentationMetadata) {
            presentationMetadata[key] = undefined;
        }
        if (options && options.state.changeTitle.value) {
            const { originalTitle } = options.state.changeTitle;
            document.title = originalTitle;
        }
        if (currentSlideNotes) {
            currentSlideNotes.commitChanges().then(() => {
                notesCollection = undefined;
                currentSlideNotes = undefined;
            });
        }
        if (slideNumberObserver)
            slideNumberObserver.disconnect();
        if (slideObserver)
            slideObserver.disconnect();
        if (BreakTimer.timer)
            clearTimeout(BreakTimer.timer);
    }
})();
