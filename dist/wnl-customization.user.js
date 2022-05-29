// ==UserScript==
// @name         WnL customization
// @namespace    http://tampermonkey.net/
// @version      1.10.0
// @description  NIEOFICJALNY asystent WnL
// @author       wodac
// @updateURL    https://wodac.github.io/wnl-customization/dist/wnl-customization.user.js
// @match        https://lek.wiecejnizlek.pl/*
// @connect      https://lek.wiecejnizlek.pl/*
// @icon         https://www.google.com/s2/favicons?domain=wiecejnizlek.pl
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @run-at document-body
// ==/UserScript==
const CLASS_NAMES = {
    optionContainer: 'custom-script-option-container',
    pageNumberContainer: 'custom-script-page-number-container',
    currentChapterPage: 'current-number',
    chapterLength: 'n-of-pages',
    fontSizeLabel: 'custom-script-font-size-label',
    fontSizeInput: 'custom-script-font-size-input',
    zoomSliderContainer: 'custom-script-zoom-slider-container',
    settingsContainer: 'custom-script-settings-container',
    toolsContainer: 'custom-script-tools-container'
};
const BODY_CLASS_NAMES = {
    increaseFontSize: 'custom-script-increase-font-size',
    increaseAnnotations: 'custom-script-increase-annotations',
    uniformFontSize: 'custom-script-uniform-font-size',
    hideCursor: 'custom-script-hide-cursor',
    invertImages: 'custom-script-invert-images',
};
const SELECTORS = {
    background: ".image-custom-background",
    lessonView: '.wnl-lesson-view',
    sidebar: 'aside.sidenav-aside.course-sidenav',
    menuBtn: '.topNavContainer__beforeLogo.topNavContainer__megaMenuMobileEntryPoint',
    appDiv: '.wnl-app-layout.wnl-course-layout',
    currentSlideContainer: '.present .present'
};
document = unsafeWindow.document;
let toRunOnLoaded = [], summaryContainer;
let slideOptionsContainer, additionalOptionsContainer;
let options, tools, chapterMetadata;
let currentSlideNumber, presentationScreenID, presentationName, currentSlideTitle;
let notesCollection, currentSlideNotes;
let slideNumberObserver, slideObserver;
const inSVG = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">${s[0]}</svg>`;
const svgIcons = {
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
};
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
    </div>`;
function toggleBodyClass(className, isOn) {
    let body = document.body;
    if (isOn)
        body.classList.add(className);
    else
        body.classList.remove(className);
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
        this._state = this.element && this.element.classList.contains(className);
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
        this.state = !this.state;
    }
}
function toggleSummary(visible) {
    if (!summaryContainer)
        return;
    if (typeof visible === 'undefined')
        visible = summaryContainer.className.includes('custom-script-hidden');
    if (visible) {
        summaryContainer.classList.remove('custom-script-hidden');
        const activeLink = summaryContainer.querySelector('.active');
        if (activeLink) {
            activeLink.scrollIntoView({ behavior: "smooth" });
        }
    }
    else
        summaryContainer.classList.add('custom-script-hidden');
}
function toggleOptions(visible) {
    if (!additionalOptionsContainer)
        return;
    const toggleBtn = document.querySelector('a.custom-options-btn');
    if (typeof visible === 'undefined')
        visible = additionalOptionsContainer.className.includes('custom-script-hidden');
    if (visible) {
        additionalOptionsContainer.classList.remove('custom-script-hidden');
        toggleBtn.classList.add('active');
    }
    else {
        additionalOptionsContainer.classList.add('custom-script-hidden');
        toggleBtn.classList.remove('active');
    }
}
function goToPage(page) {
    const pageNumberInput = document.querySelector('.wnl-slideshow-controls input[type=number]');
    pageNumberInput.value = page.toString();
    pageNumberInput.dispatchEvent(new InputEvent('input'));
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
    const dataStr = `data:${mimetype};charset=utf-8,${encodeURIComponent(data)}`;
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Note {
    constructor(metadata, _content, parent) {
        this.metadata = metadata;
        this._content = _content;
        this.parent = parent;
        this._deleted = false;
    }
    get content() {
        return this._content;
    }
    get element() {
        return this._element;
    }
    remove(removeFromParent = true) {
        console.log('deleting', { note: this, removeFromParent }, 'from Note');
        if (removeFromParent)
            this.parent.removeNoteById(this.metadata.id);
        if (this._element)
            this._element.remove();
        this._element = null;
        this._deleted = true;
    }
    set content(value) {
        if (this._deleted)
            throw new NoteDeletedError();
        this._content = value;
        if (this.element)
            this.contentElement.innerHTML = value.replace(/\n/g, '<br />');
        if (this.onchange)
            this.onchange.apply(this, [value]);
        this.parent.saveNote(this);
    }
    setNotePosition(pos) {
        this._element.style.top = `${Math.round(pos.y * 100)}%`;
        this._element.style.left = `${Math.round(pos.x * 100)}%`;
    }
    render(parent) {
        this.parentElement = parent;
        this._element = document.createElement('div');
        this.setNotePosition(this.metadata.position);
        this._element.dataset.id = this.metadata.id;
        this._element.classList.add('custom-note');
        this._element.innerHTML = Note.HTML;
        const noteContentElem = this.contentElement;
        const noteRemoveIcon = this._element.querySelector('.custom-note-remove');
        noteContentElem.innerHTML = this.content.replace(/\n/g, '<br />');
        this.setupEditing();
        this.setupMoving();
        noteRemoveIcon.addEventListener('click', ev => {
            ev.stopPropagation();
            if (confirm(`Usunąć notatkę o treści "${this.content}" ze slajdu ${this.metadata.slide}?`)) {
                this.remove();
            }
        });
        parent && parent.appendChild(this._element);
        return this._element;
    }
    get contentElement() {
        return this._element && this._element.querySelector('div.custom-note-content');
    }
    setupEditing() {
        const noteContentInput = this._element.querySelector('textarea');
        noteContentInput.value = this.content;
        noteContentInput.addEventListener('blur', ev => {
            this._element.classList.remove('editing');
        });
        noteContentInput.addEventListener('keyup', ev => {
            if (ev.key === 'Enter' && !ev.shiftKey && !ev.altKey) {
                this._element.classList.remove('editing');
            }
        });
        noteContentInput.addEventListener('input', ev => {
            ev.stopPropagation();
            const content = noteContentInput.value;
            console.log('note content changed', { content });
            this.content = content;
        });
        this._element.addEventListener('click', ev => {
            this._element.classList.add('editing');
            noteContentInput.focus();
        });
    }
    setupMoving() {
        const noteMoveIcon = this._element.querySelector('.custom-note-move');
        noteMoveIcon.addEventListener('mousedown', ev => {
            if (!this.parentElement)
                return;
            ev.stopPropagation();
            const parentRect = this.parentElement.getBoundingClientRect();
            let lastMousePosition = { x: ev.clientX, y: ev.clientY };
            const followMouse = (ev) => {
                ev.preventDefault();
                let offset = {
                    x: lastMousePosition.x - ev.clientX,
                    y: lastMousePosition.y - ev.clientY
                };
                lastMousePosition = { x: ev.clientX, y: ev.clientY };
                this._element.style.top = (this._element.offsetTop - offset.y) + 'px';
                this._element.style.left = (this._element.offsetLeft - offset.x) + 'px';
                const position = {
                    x: (ev.x - parentRect.x) / parentRect.width,
                    y: (ev.y - parentRect.y) / parentRect.height
                };
                this.metadata.position = position;
                this.setNotePosition(position);
            };
            const endFollowing = ev => {
                document.removeEventListener('mousemove', followMouse);
                document.removeEventListener('mouseup', endFollowing);
                this.parent.saveNote(this);
            };
            document.addEventListener('mousemove', followMouse);
            document.addEventListener('mouseup', endFollowing);
        });
    }
}
Note.HTML = `
        <div class="custom-note-content"></div>
        <form> 
            <textarea></textarea> 
        </form>
        <a class="custom-note-remove">${svgIcons.trash}</a>
        <a class="custom-note-move">${svgIcons.move}</a>`;
class NoteDeletedError extends Error {
    constructor() {
        super('Cannot modify deleted note!');
    }
}
class SlideMetadata {
    constructor(slide, screenid, slideTitle, presentationTitle) {
        this.slide = slide;
        this.screenid = screenid;
        this.slideTitle = slideTitle;
        this.presentationTitle = presentationTitle;
    }
}
class NoteMetadata extends SlideMetadata {
    constructor(id, slideMetadata, position, textContext) {
        super(slideMetadata.slide, slideMetadata.screenid, slideMetadata.slideTitle, slideMetadata.presentationTitle);
        this.id = id;
        this.position = position;
        this.textContext = textContext;
    }
}
class SlideNotesCollection {
    constructor(metadata, _notesRaw, parent) {
        this.metadata = metadata;
        this._notesRaw = _notesRaw;
        this.parent = parent;
        this._notes = _notesRaw.map(record => {
            return new Note(new NoteMetadata(record.id, this.metadata, record.position, record.textContext), record.content, this);
        });
        this._changedNotes = [];
        this._deletedNotes = [];
    }
    get notes() {
        return this._notes;
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
    addNote({ position, content, textContext, presentationTitle, slideTitle }) {
        if (presentationTitle)
            this.metadata.presentationTitle = presentationTitle;
        if (slideTitle)
            this.metadata.slideTitle = slideTitle;
        const id = generateId();
        const note = new Note(new NoteMetadata(id, this.metadata, position, textContext), content, this);
        this._notes.push(note);
        this._changedNotes.push(note);
        if (this.onchange)
            this.onchange.apply(this, [{ added: [note] }]);
        return note;
    }
    removeNoteByContext(position) {
        return this.removeNoteByQuery(note => note.metadata.position === position);
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
        if (this.onchange)
            this.onchange.apply(this, [{ deleted: [deleted] }]);
        console.log('deleting', { deleted }, 'from SlideNotesCollection');
        return deleted;
    }
    removeAllNotes() {
        const toDelete = this._notes.concat(this._changedNotes);
        this._changedNotes = this._notes = [];
        if (this.onchange)
            this.onchange.apply(this, [{ deleted: toDelete }]);
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
        if (this.onchange)
            this.onchange.apply(this, [{ changed: [note] }]);
    }
    commitChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.oncommit)
                this.oncommit.apply(this);
            yield this.parent.removeNotes(this._deletedNotes);
            this._deletedNotes = [];
            yield this.parent.saveNotes(this._changedNotes);
            this._changedNotes = [];
        });
    }
}
function generateId() {
    const r = Math.random();
    let id = btoa((r * Date.now() + r).toLocaleString());
    return id;
}
function getNotesDatabase(setupCb) {
    return new Promise((resolve, reject) => {
        var request = indexedDB.open("NotesDatabase", 2);
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
class PresentationNotesCollection {
    constructor(db, _screenid) {
        this.db = db;
        this._screenid = _screenid;
    }
    static setupDB(event, db) {
        let notesStore;
        if (event.oldVersion !== event.newVersion) {
            notesStore = db.createObjectStore(PresentationNotesCollection.STORE_NAME, { keyPath: 'id' });
        }
        else {
            notesStore = event.target.transaction.objectStore(PresentationNotesCollection.STORE_NAME);
        }
        notesStore.createIndex(PresentationNotesCollection.DUAL_INDEX, ['screenid', 'slide'], { unique: false });
        notesStore.createIndex(PresentationNotesCollection.SCREENID_INDEX, 'screenid', { unique: false });
        // notesStore.createIndex('id', 'id', { unique: true })
        return notesStore;
    }
    static createAsync(screenid) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield getNotesDatabase(PresentationNotesCollection.setupDB);
            const notesCollection = new PresentationNotesCollection(db, screenid);
            return notesCollection;
        });
    }
    getNotesBySlide(slide) {
        const transaction = this.db.transaction(PresentationNotesCollection.STORE_NAME, 'readonly');
        const notesStore = transaction.objectStore(PresentationNotesCollection.STORE_NAME);
        const screenidIndex = notesStore.index(PresentationNotesCollection.DUAL_INDEX);
        const notesRequest = screenidIndex.getAll([this._screenid, slide]);
        return new Promise((resolve, reject) => {
            notesRequest.addEventListener('success', ev => {
                const notes = notesRequest.result;
                const slideTitle = notes[0] && notes[0].slideTitle || '';
                const presentationTitle = notes[0] && notes[0].presentationTitle || '';
                resolve(new SlideNotesCollection(new SlideMetadata(slide, this._screenid, slideTitle, presentationTitle), notes, this));
            });
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
            textContext: note.metadata.textContext
        };
    }
    saveNotes(notes) {
        const records = notes.map(PresentationNotesCollection.mapNoteToRecord);
        return this.importNotes(records);
    }
    importNotes(notes) {
        console.log('to import:', { notes });
        const transaction = this.db.transaction(PresentationNotesCollection.STORE_NAME, 'readwrite');
        const notesStore = transaction.objectStore(PresentationNotesCollection.STORE_NAME);
        notes.forEach(record => {
            notesStore.put(record);
        });
        transaction.commit();
        return new Promise((resolve, reject) => {
            transaction.addEventListener('complete', ev => {
                resolve();
            });
        });
    }
    removeNotes(notes) {
        const transaction = this.db.transaction(PresentationNotesCollection.STORE_NAME, 'readwrite');
        const notesStore = transaction.objectStore(PresentationNotesCollection.STORE_NAME);
        notes.forEach(note => {
            console.log('deleting', { note }, 'from PresentationNotesCollection');
            notesStore.delete(note.metadata.id);
        });
        transaction.commit();
        return new Promise((resolve, reject) => {
            transaction.addEventListener('complete', ev => {
                resolve();
            });
        });
    }
    exportNotes() {
        const transaction = this.db.transaction(PresentationNotesCollection.STORE_NAME, 'readonly');
        const notesStore = transaction.objectStore(PresentationNotesCollection.STORE_NAME);
        const screenidIndex = notesStore.index(PresentationNotesCollection.SCREENID_INDEX);
        const notesRequest = screenidIndex.getAll(this._screenid);
        return new Promise((resolve, reject) => {
            notesRequest.addEventListener('success', ev => {
                const notes = notesRequest.result;
                resolve(notes);
            });
        });
    }
}
PresentationNotesCollection.STORE_NAME = 'Notes';
PresentationNotesCollection.DUAL_INDEX = 'byScreenIDAndSlide';
PresentationNotesCollection.SCREENID_INDEX = 'byScreenID';
// PresentationNotesCollection.createAsync(892).then(collection => console.log(collection))
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
        console.log('trying to render sidebar', this.settingsContainer);
        if (this.settingsContainer) {
            console.log('rendering sidebar', this.settingsContainer);
            const optionDivs = this.settingsContainer.querySelectorAll(`div.${CLASS_NAMES.optionContainer}`);
            optionDivs.forEach(el => el.remove());
            Object.values(this.state).forEach(option => this.settingsContainer.appendChild(this._getSettingsOption(option)));
        }
    }
    _getSettingsOption(option) {
        const optionContainer = document.createElement('div');
        optionContainer.classList.add(CLASS_NAMES.optionContainer);
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
        update: state => toggleBodyClass(BODY_CLASS_NAMES.increaseFontSize, state.value),
        defaultValue: true,
        key: 'f'
    },
    {
        name: "increaseAnnotations",
        desc: state => getCheckboxEmoji(state.value) + "📄 Zwiększ wielkość czcionki w przypisach",
        callback: function (state) {
            return { value: !state.value };
        },
        update: state => toggleBodyClass(BODY_CLASS_NAMES.increaseAnnotations, state.value),
        defaultValue: false,
        key: 'a'
    },
    {
        name: "smoothScroll",
        desc: state => getCheckboxEmoji(state.value) + "↕️ Płynne przewijanie strzałkami",
        callback: function (state) {
            return { value: !state.value };
        },
        update: () => null,
        defaultValue: false,
        key: 'a'
    },
    {
        name: "keyboardControl",
        desc: state => getCheckboxEmoji(state.value) + "⌨️ Sterowanie klawiaturą",
        callback: function (state) {
            return { value: !state.value };
        },
        update: state => {
            if (state.value) {
                setupKeyboardControl();
            }
            else {
                document.querySelectorAll('sub.small').forEach(sub => sub.remove());
                document.body.removeEventListener('keyup', shortcutListener);
                if (slideObserver)
                    slideObserver.disconnect();
            }
        },
        defaultValue: true,
        key: 'a'
    },
    {
        name: "changeTitle",
        desc: state => getCheckboxEmoji(state.value) + "🆎 Zmień tytuł karty",
        callback: function (state) {
            return Object.assign(Object.assign({}, state), { value: !state.value });
        },
        update: state => {
            console.log('changeTitle update', { state });
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
        key: 'a'
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
        update: state => toggleBodyClass(BODY_CLASS_NAMES.uniformFontSize, state.value),
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
        update: state => toggleBodyClass(BODY_CLASS_NAMES.invertImages, state.value),
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
            const rangeInput = document.querySelector(`input.${CLASS_NAMES.fontSizeInput}`);
            const rangeLabel = document.querySelector(`.${CLASS_NAMES.fontSizeLabel}`);
            if (rangeInput) {
                rangeInput.value = state.value;
                rangeInput.title = state.value;
            }
            if (rangeLabel)
                rangeLabel.innerText = `${state.value}%`;
        },
        init: function (state) {
            function _toRun() {
                const rangeInput = document.querySelector(`input.${CLASS_NAMES.fontSizeInput}`);
                const rangeLabel = document.querySelector(`.${CLASS_NAMES.fontSizeLabel}`);
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
                registerKeyboardShortcut({
                    keys: ['-'],
                    callback: () => state.increaseBy(-5)
                });
                registerKeyboardShortcut({
                    keys: ['+', '='],
                    callback: () => state.increaseBy(5)
                });
            }
            const toRun = _toRun.bind(this);
            toRunOnLoaded.push(toRun);
        },
        key: 'p'
    }
], `.${CLASS_NAMES.settingsContainer}>div`);
let suggestBreakTimer, obs, noteTarget;
function startBreakTimer() {
    clearTimeout(suggestBreakTimer);
    console.log('starting suggestBreak timer...');
    suggestBreakTimer = setTimeout(() => {
        alert('Pora na przerwę 🔔');
    }, 1000 * 60 * 7);
}
const notesBtnsContainer = `
    <div class='custom-notes-btns-container'>
        <a class="custom-notes-view-btn custom-script-slideshow-btn wnl-rounded-button">
            <div class="a-icon -x-small custom-while-inactive" title="Pokaż notatki">
                ${svgIcons.stickies}
            </div>
            <div class="a-icon -x-small custom-while-active" title="Ukryj notatki">
                ${svgIcons.stickiesFill}
            </div>
        </a>
        <div class='custom-notes-additional-btns hidden'>
            <a class="custom-add-note-btn custom-script-slideshow-btn wnl-rounded-button">
                <div class="a-icon -x-small" title="Dodaj notatkę">
                    ${svgIcons.plusSquare}
                </div>
            </a>
            <a class="custom-clear-notes-btn custom-script-slideshow-btn wnl-rounded-button">
                <div class="a-icon -x-small" title="Usuń wszystkie notatki">
                    ${svgIcons.eraserFill}
                </div>
            </a>
            <a class="custom-notes-view-type-btn custom-script-slideshow-btn wnl-rounded-button">
                <div class="a-icon -x-small custom-while-inactive" title="Pokaż notatki w kolumnie">
                    ${svgIcons.layoutChaotic}
                </div>
                <div class="a-icon -x-small custom-while-active" title="Pokaż notatki na slajdzie">
                    ${svgIcons.viewStack}
                </div>
            </a>
        </div>
    </div>`;
function loadNotes() {
    return __awaiter(this, void 0, void 0, function* () {
        const appDiv = document.querySelector(SELECTORS.appDiv);
        notesCollection = yield PresentationNotesCollection.createAsync(presentationScreenID);
        if (tools && tools.state.useNotes.value) {
            const slideNumber = appDiv.attributes.getNamedItem('slide').value;
            return renderNotes(parseInt(slideNumber));
        }
    });
}
function renderNotes(slideNumber) {
    if (currentSlideNotes)
        currentSlideNotes.commitChanges();
    if (tools && tools.state.useNotes.value && notesCollection) {
        if (noteTarget)
            noteTarget.innerHTML = '';
        const currentSlide = document.querySelector(SELECTORS.currentSlideContainer);
        const notesOverlayElem = currentSlide.querySelector('.custom-notes-overlay');
        if (!noteTarget && notesOverlayElem)
            return;
        return notesCollection.getNotesBySlide(slideNumber).then(notes => {
            currentSlideNotes = notes;
            console.log({ currentSlideNotes });
            currentSlideNotes.onchange = slideNotesChanged;
            return addNoteElems(notes.notes);
        });
    }
}
function slideNotesChanged(change) {
    if (change.added) {
        addNoteElems(change.added);
    }
}
function addNoteElems(notes) {
    let parent;
    if (noteTarget) {
        parent = noteTarget;
    }
    else {
        const currentSlide = document.querySelector(SELECTORS.currentSlideContainer);
        let notesOverlayElem = currentSlide.querySelector('.custom-notes-overlay');
        if (!notesOverlayElem) {
            notesOverlayElem = document.createElement('div');
            notesOverlayElem.classList.add('custom-notes-overlay');
        }
        currentSlide.prepend(notesOverlayElem);
        parent = notesOverlayElem;
    }
    return notes.map(note => {
        return note.render(parent);
    });
}
const addNoteBtnHandler = (event) => {
    if (currentSlideNotes) {
        const slide = document.querySelector(SELECTORS.currentSlideContainer);
        slide.style.cursor = `copy`;
        slide.addEventListener('click', event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            slide.style.cursor = '';
            const slideRect = slide.getBoundingClientRect();
            console.log({ event, slideRect });
            const position = {
                x: (event.x - slideRect.x) / slideRect.width,
                y: (event.y - slideRect.y) / slideRect.height
            };
            const textContext = event.target.innerText;
            const newNote = currentSlideNotes.addNote({
                position, content: '', textContext,
                presentationTitle: presentationName,
                slideTitle: currentSlideTitle
            });
            newNote.element.click();
        }, { once: true });
    }
};
function addNotesColumn() {
    const notesContainer = document.createElement('div');
    notesContainer.classList.add('custom-script-notes-column', 'custom-script-hidden');
    document.querySelector('.order-number-container').after(notesContainer);
    return notesContainer;
}
const notesOverlayToggle = new ClassToggler('custom-script-notes-visible');
const noteColumnToggle = new ClassToggler('custom-script-hidden', '.custom-script-notes-column');
toRunOnLoaded.push(() => {
    obs = onAttributeChange(document.querySelector(SELECTORS.appDiv), 'slide', () => {
        startBreakTimer();
    });
    tools && !tools.state.suggestBreak.value && obs.disconnect();
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
            console.log('update suggestBreak', { state, obs });
            if (!obs)
                return;
            if (state.value) {
                obs.observe(document.querySelector(SELECTORS.appDiv), { attributes: true });
                startBreakTimer();
            }
            else {
                obs.disconnect();
                if (suggestBreakTimer)
                    clearTimeout(suggestBreakTimer);
            }
        }
    },
    {
        name: "useNotes",
        desc: state => `${getCheckboxEmoji(state.value)}📝 Używaj notatek`,
        defaultValue: false,
        callback: function (state) {
            return { value: !state.value };
        },
        update: state => {
            toggleBodyClass('custom-script-use-notes', state.value);
            if (presentationScreenID && state.value && !notesCollection) {
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
                console.log({ notes });
                downloadFile('application/json', `${presentationName}-notes.json`, JSON.stringify(notes));
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
                console.log({ ev });
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
], `.${CLASS_NAMES.toolsContainer}`);
function setupNotesBtns() {
    const addNoteBtn = document.querySelector('.custom-add-note-btn');
    addNoteBtn.addEventListener('click', addNoteBtnHandler);
    const clearNotesBtn = document.querySelector('.custom-clear-notes-btn');
    clearNotesBtn.addEventListener('click', () => {
        if (currentSlideNotes && confirm(`Czy na pewno usunąć WSZYSTKIE (${currentSlideNotes.notes.length}) notatki ze slajdu ${currentSlideNotes.metadata.slide}?`))
            currentSlideNotes.removeAllNotes();
    });
    let viewNotesBtnToggle;
    const viewNotesBtn = document.querySelector('.custom-notes-view-btn');
    const hiddenBtnsToggle = new ClassToggler('hidden', '.custom-notes-additional-btns');
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
            renderNotes(currentSlideNumber);
        });
    });
    viewNotesBtnToggle = new ClassToggler('active', viewNotesBtn, t => {
        hiddenBtnsToggle.state = !t.state;
        notesOverlayToggle.state = !viewTypeBtnToggle.state && t.state;
        noteColumnToggle.state = !(viewTypeBtnToggle.state && t.state);
    });
    viewNotesBtnToggle.state = tools && tools.state.useNotes.value;
    viewNotesBtn.addEventListener('click', () => viewNotesBtnToggle.toggle());
    registerKeyboardShortcut({
        keys: ['n'], callback: () => viewNotesBtnToggle.toggle()
    });
    viewTypeBtn.addEventListener('click', () => viewTypeBtnToggle.toggle());
    registerKeyboardShortcut({
        keys: ['v'], callback: () => viewTypeBtnToggle.toggle()
    });
}
let keyboardShortcuts = [
    {
        keys: ['ArrowUp'],
        callback: showImage
    },
    {
        keys: ['ArrowUp'],
        callback: showImage
    },
    {
        keys: ['q', '0', 'Escape'],
        callback: hideModal
    },
    {
        keys: ['m'],
        callback: () => toggleMouseVisibility()
    },
    {
        keys: ['o', 's'],
        callback: () => toggleOptions()
    },
    {
        keys: ['?', '/'],
        callback: () => toggleSearch()
    },
    {
        keys: ['l'],
        callback: () => toggleSummary()
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
function registerKeyboardShortcut(shortcut) {
    keyboardShortcuts.push(shortcut);
}
function shortcutListener(event) {
    const tagName = event.target.nodeName;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }
    keyboardShortcuts.forEach(shortcut => {
        if (shortcut.keys.includes(event.key))
            shortcut.callback(event);
    });
    // let quizVerifyBtn: HTMLElement
    // switch (event.key) {
    //     case 'ArrowUp':
    //         showImage()
    //         break
    //     case 'ArrowDown':
    //         hideImage()
    //         break
    //     case 'q':
    //     case '0':
    //         hideModal()
    //         break
    //     case 'm':
    //         toggleMouseVisibility()
    //         break
    //     case 'o':
    //     case 's':
    //         toggleOptions()
    //         break
    //     case '?':
    //     case '/':
    //         toggleSearch()
    //         break
    //     case 'l':
    //         toggleSummary()
    //         break
    //     case 'Escape':
    //         hideModal()
    //         break
    //     case 'Enter':
    //         quizVerifyBtn = document.querySelector('.o-quizQuestionReferenceModal__verify span')
    //         if (quizVerifyBtn) quizVerifyBtn.click()
    //         break
    // }
    const charCode = event.keyCode;
    if ((charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105))
        numericKeyPressed(event.key);
}
function setupKeyboardControl() {
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
function observeSlides(cb) {
    console.log('observeSlides');
    slideObserver = new MutationObserver(cb);
    slideObserver.observe(document.querySelector('div.slides'), {
        childList: true,
        subtree: true
    });
}
function observeSlideNumber(cb) {
    console.log('observe slide number');
    const appDiv = document.querySelector(SELECTORS.appDiv);
    slideNumberObserver = onAttributeChange(appDiv, 'slide', value => cb(parseInt(value)));
}
function addSubsToRefs(mutations) {
    console.log('mutation observed');
    let counter = 1;
    mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes && mutation.addedNodes.length > 0) {
            console.log('node added');
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
        document.querySelector(SELECTORS.currentSlideContainer),
        document.querySelector('.m-modal__content'),
        document.querySelector('.wnl-comments')
    ];
    views.forEach(view => {
        if (view)
            view.scrollBy(options);
    });
}
function updateTabTitle() {
    let currentTitleHeader = document.querySelector('.present .sl-block-content h2');
    if (currentTitleHeader !== null)
        currentSlideTitle = currentTitleHeader.textContent;
    if (GM_getValue('option_changeTitle')) {
        let mainTitle;
        mainTitle = presentationName && presentationName.match(/\w/) ? `${presentationName} - ` : '';
        const slideTitle = currentSlideTitle && currentSlideTitle.match(/\w/) ? `${currentSlideTitle} - ` : '';
        const originalTitle = options ? options.state.changeTitle.originalTitle : 'LEK - Kurs - Więcej niż LEK';
        document.title = slideTitle + mainTitle + originalTitle;
    }
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
        console.log({ selector, icon });
        if (icon)
            icon.click();
    }
    else {
        const selector = `.present .a-icon.sub-id-${key}`;
        const icon = document.querySelector(selector);
        console.log({ selector, icon });
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
    console.log({ mouseVisible, visible });
    toggleBodyClass(BODY_CLASS_NAMES.hideCursor, !mouseVisible);
    if (!mouseVisible)
        document.body.addEventListener('mousemove', () => toggleMouseVisibility(true), { once: true });
}
const getSearchURL = (q) => `https://lek.wiecejnizlek.pl/papi/v2/slides/.search?q=${encodeURIComponent(q)}&include=context,sections,slideshows.screens.lesson`;
const WNL_DYNAMIC_SLIDES = 'https://lek.wiecejnizlek.pl/app/dynamic/slides/';
let searchContainer, searchResultsContainer;
function addSearchContainer() {
    searchContainer = document.createElement('div');
    searchContainer.className = 'custom-script-search custom-script-hidden';
    searchContainer.innerHTML = `
        <input class="custom-search-result" style="width: 80%;display: inline-block;">
        <a class='custom-search-submit' style="font-size: 1.2rem;padding:0.1rem;">${svgIcons.search}</a>
        `;
    const closeBtn = document.createElement('div');
    closeBtn.className = 'custom-script-summary-close';
    closeBtn.innerHTML = svgIcons.chevronUp;
    searchContainer.prepend(closeBtn);
    closeBtn.addEventListener('click', () => toggleSearch(false));
    searchResultsContainer = document.createElement('div');
    searchContainer.append(searchResultsContainer);
    document.querySelector('.order-number-container').after(searchContainer);
    searchContainer.querySelector('input.custom-search-result').addEventListener('change', () => performSearch());
    searchContainer.querySelector('a.custom-search-submit').addEventListener('click', () => performSearch());
}
function performSearch() {
    if (!searchContainer)
        return;
    const q = searchContainer.querySelector('input.custom-search-result').value;
    const interpretation = interpretQuery(q);
    searchResultsContainer.innerHTML = `<p style='padding: 0.5rem;text-align: center'>Ładowanie...</p>`;
    getSearchResponseHTML(interpretation).then(resp => {
        if (searchResultsContainer)
            searchResultsContainer.innerHTML = resp;
        toggleSearch(true);
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
            return response.map(el => `
            <a href='${WNL_DYNAMIC_SLIDES + el.id}' target='_blank' class='custom-search-result'>
                <h5>${el.highlight['snippet.header'] || el.details.header}</h5>
                <h6>${el.highlight['snippet.subheader'] || el.details.subheader}</h6>
                <p>${el.highlight['snippet.content'] || el.details.content}</p>
            </a>
            `).join('');
        }
        return `<p style='padding:0.5rem'>Nie znaleziono frazy <em>${q.rawQuery}</em> :(</p>`;
    });
}
function toggleSearch(visible) {
    if (!searchContainer)
        return;
    if (typeof visible === 'undefined')
        visible = searchContainer.className.includes('custom-script-hidden');
    if (visible) {
        searchContainer.classList.remove('custom-script-hidden');
        setTimeout(() => searchContainer.querySelector('input.custom-search-result').focus(), 100);
    }
    else
        searchContainer.classList.add('custom-script-hidden');
}
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
    return filtered;
    function hasSomePhrases(result, phrases) {
        return phrases.map(toSearch => {
            return Object.values(result.highlight).some(highlighted => {
                return highlighted.some(s => stripTags(s).includes(toSearch));
            });
        });
    }
}
function stripTags(s) {
    const tagStripper = /<[^>]+>/g;
    return s.toLowerCase().replace(tagStripper, '');
}
const slideshowOptionsBtn = `
    <a class="custom-options-btn custom-script-slideshow-btn wnl-rounded-button">
        <div class="a-icon -x-small" title="Opcje">
            ${svgIcons.chevronUp}
        </div>
    </a>`;
const slideshowOptions = `
    <a class="custom-search-btn custom-script-slideshow-btn wnl-rounded-button">
        <div class="a-icon -x-small" title="Szukaj" style="margin: 0;padding: 0;">
            ${svgIcons.search}
        </div>
        <span class="custom-btn-caption">SZUKAJ</span>
    </a>
    <a class="custom-zoom-up-btn custom-script-slideshow-btn wnl-rounded-button">
        <div class="a-icon -x-small" title="Powiększ">
            ${svgIcons.zoomIn}
        </div>
    </a>
    <a class="custom-zoom-down-btn custom-script-slideshow-btn wnl-rounded-button">
        <div class="a-icon -x-small" title="Powiększ">
            ${svgIcons.zoomOut}
        </div>
    </a>`;
function addSlideOptions() {
    const bookmarkBtn = document.querySelector('.wnl-rounded-button.bookmark');
    if (!bookmarkBtn)
        return;
    addSearchContainer();
    slideOptionsContainer = document.createElement('div');
    slideOptionsContainer.innerHTML = notesBtnsContainer + slideshowOptionsBtn;
    additionalOptionsContainer = document.createElement('div');
    additionalOptionsContainer.className = 'custom-script-hidden custom-script-additional-options';
    additionalOptionsContainer.innerHTML = slideshowOptions;
    slideOptionsContainer.append(additionalOptionsContainer);
    bookmarkBtn.after(slideOptionsContainer);
    additionalOptionsContainer.prepend(bookmarkBtn);
    slideOptionsContainer.querySelector('.custom-options-btn').addEventListener('click', () => toggleOptions());
    slideOptionsContainer.querySelector('.custom-search-btn').addEventListener('click', () => {
        toggleOptions(false);
        toggleSearch(true);
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
    closeBtn.innerHTML = svgIcons.chevronUp;
    summaryContainer.prepend(closeBtn);
    closeBtn.addEventListener('click', () => toggleSummary(false));
    document.querySelector('.order-number-container').after(summaryContainer);
    const links = summaryContainer.querySelectorAll('a.custom-script-summary-link');
    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const { startPage } = link.dataset;
            goToPage(parseInt(startPage));
            return false;
        });
    });
}
function addChapterInfo() {
    getMetadata(metadata => {
        console.log({ metadata });
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
    currentSlideNumber = current;
    const pageNumberContainer = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`);
    const getChapterIndex = page => {
        const i = metadata.findIndex(m => m.startPage > page) - 1;
        return i >= 0 ? i : metadata.length - 1;
    };
    const chapterIndex = getChapterIndex(current);
    const chapterMetadata = metadata[chapterIndex];
    const relativeCurrent = current - chapterMetadata.startPage + 1;
    const chapterLength = chapterMetadata.chapterLength;
    const relativeCurrentContainer = pageNumberContainer.querySelector(`.${CLASS_NAMES.currentChapterPage}`);
    relativeCurrentContainer.innerText = relativeCurrent.toString();
    const chapterLengthContainer = pageNumberContainer.querySelector(`.${CLASS_NAMES.chapterLength}`);
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
    const classNames = [CLASS_NAMES.pageNumberContainer, CLASS_NAMES.currentChapterPage, '', CLASS_NAMES.chapterLength];
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
    spans[0].addEventListener('click', () => toggleSummary());
    return spans[0];
}
function openMenu() {
    const menuBtn = document.querySelector(SELECTORS.menuBtn);
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
(function () {
    'use strict';
    function onLoaded() {
        console.log('loaded');
        if (!appDiv) {
            appDiv = document.querySelector(SELECTORS.appDiv);
            if (appDiv) {
                onAttributeChange(appDiv, 'screenid', checkUnloaded);
                presentationScreenID = parseInt(appDiv.attributes.getNamedItem('screenid').value);
                console.log({ screenid: presentationScreenID });
                if (tools && tools.state.useNotes.value) {
                    loadNotes();
                }
            }
        }
        let background = document.querySelector(SELECTORS.background);
        if (background !== null) {
            background.classList.remove("image-custom-background");
            background.classList.add("white-custom-background");
        }
        const lessonView = document.querySelector(SELECTORS.lessonView);
        if (lessonView !== null) {
            const mainHeaderElem = document.querySelector('.o-lesson__title__left__header');
            if (mainHeaderElem !== null)
                presentationName = mainHeaderElem.innerText;
            addSliderContainer();
            addSettingsContainer();
            addToolsContainer();
        }
        if (GM_getValue(`option_keyboardControl`))
            setupKeyboardControl();
        addChapterInfo();
        addSlideOptions();
        toRunOnLoaded.forEach(cb => cb());
        unsafeWindow.addEventListener('beforeunload', ev => {
            onUnload();
        });
    }
    function addSliderContainer() {
        const test = document.querySelector(`input.${CLASS_NAMES.fontSizeInput}`);
        if (test)
            return;
        const lessonView = document.querySelector(SELECTORS.lessonView);
        const sliderContainer = document.createElement('div');
        sliderContainer.innerHTML = zoomSliderHTML;
        lessonView.appendChild(sliderContainer);
        sliderContainer.querySelector(`input.${CLASS_NAMES.fontSizeInput}`)
            .addEventListener('input', e => document.querySelector(`.${CLASS_NAMES.fontSizeLabel}`).innerText = `${e.target.value}%`);
        sliderContainer.querySelector(`.${CLASS_NAMES.fontSizeInput}-increase`)
            .addEventListener('click', () => {
            options.setOptionState(state => { return { value: state.value + 5 }; }, 'percentIncrease');
        });
        sliderContainer.querySelector(`.${CLASS_NAMES.fontSizeInput}-decrease`)
            .addEventListener('click', () => {
            options.setOptionState(state => { return { value: state.value - 5 }; }, 'percentIncrease');
        });
    }
    function addToolsContainer() {
        const test = document.querySelector(`.${CLASS_NAMES.toolsContainer}`);
        if (test)
            return;
        const lessonView = document.querySelector(SELECTORS.lessonView);
        const toolsContainer = document.createElement('div');
        toolsContainer.classList.add(CLASS_NAMES.toolsContainer);
        toolsContainer.innerHTML = `
            <span class="metadata" style="display: block;margin-bottom: 15px;">narzędzia</span>
            <div></div>`;
        lessonView.appendChild(toolsContainer);
        tools.rerender();
    }
    function addSettingsContainer() {
        const test = document.querySelector(`.${CLASS_NAMES.settingsContainer}`);
        if (test)
            return;
        const lessonView = document.querySelector(SELECTORS.lessonView);
        const sidebarSettingsContainer = document.createElement('div');
        sidebarSettingsContainer.classList.add(CLASS_NAMES.settingsContainer);
        sidebarSettingsContainer.innerHTML = `
            <span class="metadata" style="display: block;margin-bottom: 15px;">ustawienia</span>
            <div></div>`;
        lessonView.appendChild(sidebarSettingsContainer);
        options.rerender();
    }
    let isAwaiting = false;
    awaitLoad();
    let appDiv = document.querySelector(SELECTORS.appDiv);
    if (appDiv)
        onAttributeChange(appDiv, 'screenid', checkUnloaded);
    function awaitLoad() {
        let checkLoadedInterval;
        isAwaiting = true;
        checkLoadedInterval = setInterval(() => {
            const testExtensionLoaded = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`);
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
        console.log('unloaded??');
        const testExtensionLoaded = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`);
        if (!isAwaiting && !testExtensionLoaded) {
            console.log('unloaded!!!');
            onUnload();
            awaitLoad();
        }
    }
    function onUnload() {
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
        if (suggestBreakTimer)
            clearTimeout(suggestBreakTimer);
    }
})();
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

.${BODY_CLASS_NAMES.increaseFontSize} .sl-block-content span[style*='21px'] {
    font-size: 0.75em!important;
}

.${CLASS_NAMES.optionContainer} {
    padding: 5px 15px;
}

.${CLASS_NAMES.optionContainer}:hover {
    background-color: #f6f6f6
}

a.custom-script-option {
    color: #0c1726
}

.${BODY_CLASS_NAMES.increaseAnnotations} article.content.-styleguide p {
    font-size: var(--scaled-font-size);
    line-height: 150%;
}

.${BODY_CLASS_NAMES.increaseFontSize} .sl-block-content p {
    font-size: var(--scaled-font-size)!important;
}

.${BODY_CLASS_NAMES.uniformFontSize} .sl-block-content :not(h1,h2,h3,h1 *,h2 *,h3 *) {
    font-size: var(--uniform-font-size)!important;
}

@media screen and (orientation:landscape) {
   section.stack.present section {
       overflow-y: auto;
       overflow-x: hidden;
       padding-bottom: 1em;
   }
}


.${BODY_CLASS_NAMES.increaseFontSize} .wnl-reference {
    margin-left: 0.5em
}

.${BODY_CLASS_NAMES.increaseFontSize} .wnl-reference svg,
.${BODY_CLASS_NAMES.uniformFontSize} .wnl-reference svg {
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

.${CLASS_NAMES.pageNumberContainer} {
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

body.${BODY_CLASS_NAMES.hideCursor} {
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

.${CLASS_NAMES.fontSizeLabel} {
    margin: 0 0.5rem;
    height: 16px;
    font-size: 24px; 
    vertical-align: top;
    width: 4.3rem;
    display: inline-block;
    text-align: center;
}

.${CLASS_NAMES.fontSizeInput}-increase, .${CLASS_NAMES.fontSizeInput}-decrease {
    vertical-align: sub;
}

.${CLASS_NAMES.fontSizeInput} {
    -webkit-appearance: none;
    appearance: none;
    margin-right: 0.9em;
    outline: none;
    height: 0.6rem;
    background: #96dbdf;
    border-radius: 5px;
    vertical-align: middle;
}

.${CLASS_NAMES.fontSizeInput}::-webkit-slider-thumb {
    -webkit-appearance: none; 
    appearance: none;
    cursor: pointer;
    width: 0.8rem;
    height: 0.8rem;
    background: var(--color-primary-text);
    border-radius: 0.4rem;
}

.${CLASS_NAMES.fontSizeInput}::-moz-range-thumb {
    cursor: pointer;
    width: 0.8rem;
    height: 0.8rem;
    background: var(--color-primary-text);
    border-radius: 0.4rem;
}

.${CLASS_NAMES.zoomSliderContainer}, .${CLASS_NAMES.settingsContainer}, 
.${CLASS_NAMES.toolsContainer} {
    margin-top: 1rem; 
    border: 1px solid rgb(239, 240, 243); 
    padding: 15px; 
}

.custom-notes-btns-container {
    left: 5px;
    position: absolute;
    bottom: 5px;
    z-index: 11;
    flex-direction: row;
    display: none!important;
}

.custom-notes-additional-btns {
    display: flex;
    flex-direction: row;
    transition: opacity 0.6s, visibility 0.6s;
}

.custom-notes-additional-btns.hidden {
    opacity: 0;
    visibility: hidden;
}

.custom-script-use-notes .fullscreen-mode .wnl-comments, 
.custom-script-use-notes .wnl-lesson-previous-next-nav {
    z-index: 12!important;
}

.custom-notes-btns-container .wnl-rounded-button {
    color: black!important;
}

.slideshow-container.fullscreen .custom-notes-btns-container {
    left: 70px;
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

.custom-note form {display: none;}

.custom-note.editing form {display: block;}

.custom-note.editing .custom-note-content {display: none;}

.custom-note textarea {
    appearance: none;
    border: none;
    width: 100%!important;
    height: 100%!important;
    background: none;
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

.custom-while-active {display: none!important;}

.active .custom-while-active.a-icon {display: inline-flex!important;}

.active .custom-while-inactive {display: none!important;}

.custom-script-use-notes.custom-script-notes-visible .custom-notes-overlay {display: block!important;}

.custom-script-use-notes .custom-notes-btns-container {
    display: flex!important;
}

.${BODY_CLASS_NAMES.invertImages} img.iv-large-image, .logo-mobile {
    filter: invert(1) hue-rotate(180deg) saturate(1.4);
}`;
const head = unsafeWindow.document.querySelector('head');
const stylesheet = document.createElement('style');
stylesheet.innerHTML = styles;
head.appendChild(stylesheet);
