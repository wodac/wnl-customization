// ==UserScript==
// @name         WnL customization (beta)
// @namespace    http://tampermonkey.net/
// @version      1.10.7b
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
class CustomEventEmmiter {
    constructor() {
        this.listeners = {};
    }
    addEventListener(eventName, listener, once) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        if (once) {
            const toAdd = event => {
                listener.bind(this)(event);
                this.removeEventListener(eventName, toAdd);
            };
            this.listeners[eventName].push(toAdd);
        }
        else {
            this.listeners[eventName].push(listener); //.bind(this)
        }
    }
    removeEventListener(eventName, listener) {
        if (!this.listeners[eventName])
            return;
        const i = this.listeners[eventName].findIndex(cb => cb == listener);
        // console.log('removing', { listener }, 'for event', eventName, 'on position', { i }, 'on', this)
        if (i >= 0) {
            const toRemove = this.listeners[eventName].splice(i, 1);
            return toRemove[0];
        }
    }
    removeAllListeners(eventName) {
        if (eventName)
            this.listeners[eventName] = [];
        else
            this.listeners = {};
    }
    trigger(eventName, event = {}) {
        // console.log(`triggering`, eventName, `with data`, event, 'on', this);
        setTimeout(() => {
            this.listeners[eventName] && this.listeners[eventName].forEach(listener => {
                try {
                    listener.bind(this)(event);
                }
                catch (err) {
                    console.error(err, 'triggering', eventName, `with data`, event, 'on', this, 'with callback', listener, `(${listener.toString()})`);
                }
            });
        }, 0);
    }
}
///<reference path="CustomEventEmmiter.ts" />
///<reference path="common.ts" />
///<reference path="enums.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class ChapterListElement extends CustomEventEmmiter {
    constructor(metadata, parent) {
        super();
        this.metadata = metadata;
        this.parent = parent;
        if (metadata.children) {
            this.children = metadata.children.map(meta => new ChapterListElement(meta, parent));
        }
        this.active = false;
    }
    get active() {
        return this._active;
    }
    set active(value) {
        this._active = value;
        this.trigger('activeChange', value);
        if (this.activeToggler)
            this.activeToggler.state = value;
    }
    getHTML() {
        return `<a class='custom-script-summary-link' href='${this.metadata.href}'>
           <span>${this.metadata.name} </span>
           <span class='small'>(${this.metadata.chapterLength})</span>
        </a>`;
    }
    render() {
        this.element = document.createElement('div');
        this.element.classList.add('custom-script-summary-link-container');
        this.element.innerHTML = this.getHTML();
        if (this.children) {
            const list = document.createElement('ul');
            const listElems = this.children.map(child => {
                const li = document.createElement('li');
                li.append(child.render());
                return li;
            });
            list.append(...listElems);
            this.element.append(list);
        }
        this.activeToggler = new ClassToggler('active', this.element);
        const link = this.element.querySelector('a');
        link.addEventListener('click', event => {
            event.preventDefault();
            this.parent.app.slideNumber = this.metadata.startPage;
        });
        this.trigger('rendered');
        return this.element;
    }
}
class SlideshowChapters extends CustomEventEmmiter {
    constructor(app) {
        super();
        this.app = app;
    }
    render(parentElement) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getMetadata();
            if (this._rendered || !this.chapterMetadata)
                return;
            this.element = document.createElement('div');
            this.chapterElements = this.chapterMetadata.map(meta => {
                const el = new ChapterListElement(meta, this);
                return el;
            });
            this.element.append(...this.chapterElements.map(el => el.render()));
            if (parentElement)
                parentElement.append(this.element);
            this._rendered = true;
            this.trigger('rendered');
            setTimeout(() => this.setCurrentPage(this.app.slideNumber), 0);
            return this.element;
        });
    }
    getProgress() {
        if (!this.currentChapterPath)
            return;
        return this.currentChapterPath.map(chapter => {
            return Object.assign(Object.assign({}, chapter.metadata), { current: this.currentPage - chapter.metadata.startPage + 1, actualLength: chapter.metadata.endPage - chapter.metadata.startPage + 1 });
        });
    }
    setCurrentPage(page) {
        if (!this.chapterElements)
            return;
        if (!page || page < 1 || page > this.slideCount)
            return;
        this.currentPage = page;
        if (this.currentChapterPath)
            this.currentChapterPath.forEach(el => el.active = false);
        this.currentChapterPath = [];
        function findChapter(chapters) {
            return chapters.find(chapter => {
                return chapter.metadata.startPage <= page && chapter.metadata.endPage >= page;
            });
        }
        let chapter = findChapter(this.chapterElements);
        if (!chapter)
            return [];
        let children;
        while (true) {
            this.currentChapterPath.push(chapter);
            children = chapter.children;
            if (children) {
                chapter = findChapter(children);
                if (!chapter)
                    break;
            }
            else
                break;
        }
        if (this.scrollIntoView && chapter)
            chapter.element.scrollIntoView({ behavior: "smooth" });
        this.trigger('activeChange', { path: this.currentChapterPath });
        this.currentChapterPath.forEach(el => el.active = true);
        return this.currentChapterPath;
    }
    getEndPages(chapters, length) {
        let chapterEnd = length, currentChapter;
        for (let index = chapters.length - 1; index >= 0; index--) {
            if (currentChapter)
                chapterEnd = currentChapter.startPage - 1;
            currentChapter = chapters[index];
            currentChapter.endPage = chapterEnd;
            if (currentChapter.children) {
                currentChapter.children = this.getEndPages(currentChapter.children, currentChapter.endPage);
            }
        }
        return chapters;
    }
    openMenu() {
        const menuBtn = document.querySelector(".topNavContainer__beforeLogo.topNavContainer__megaMenuMobileEntryPoint" /* SELECTORS.menuBtn */);
        if (menuBtn) {
            menuBtn.click();
            this.menuOpened = true;
        }
    }
    getMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.chapterMetadata)
                return this.chapterMetadata;
            const menu = yield this.getMenu();
            if (!menu)
                return;
            const active = menu.querySelector('.item-wrapper.is-active');
            if (!active) {
                return;
            }
            this.slideCount = this.getSlideCount(active);
            const listParent = active.parentElement;
            if (!listParent) {
                return;
            }
            const list = Array.from(listParent.children);
            if (this.menuOpened)
                this.closeMenu();
            if (list.length === 0) {
                return;
            }
            const wrappers = list.filter(el => el.nodeName === 'DIV');
            if (wrappers.length === 0) {
                return;
            }
            const chapters = this.getMetadataFromLinks(wrappers);
            // console.log({chapters})
            this.chapterMetadata = this.getEndPages(chapters, this.slideCount);
            this.trigger('dataRetrieved', this.chapterMetadata);
            return this.chapterMetadata;
        });
    }
    closeMenu() {
        document.querySelector('.topNavContainer__close').click();
    }
    getSlideCount(a) {
        const t = a.querySelector('span span.sidenav-item-meta').innerText;
        return parseInt(t.slice(1, -1));
    }
    getMetadataFromLinks(wrappers) {
        const links = wrappers.map(div => div.querySelector('a'));
        // console.log({links})
        return links.map((a, i) => {
            if (!a.href)
                return {};
            const chapterLength = this.getSlideCount(a);
            let children;
            const subwrappers = wrappers[i].querySelectorAll('div');
            if (subwrappers.length) {
                children = this.getMetadataFromLinks(Array.from(subwrappers));
            }
            return {
                href: a.href,
                name: a.querySelector('span span').innerText,
                chapterLength, children,
                startPage: parseInt(a.href.split('/').pop())
            };
        });
    }
    getMenu() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                const menu = document.querySelector('aside.sidenav-aside');
                if (!menu) {
                    if (this.menuOpened) {
                        resolve(false);
                        return;
                    }
                    this.openMenu();
                    setTimeout(() => resolve(this.getMenu()), 100);
                }
                else {
                    resolve(menu);
                }
            });
        });
    }
}
///<reference path="enums.ts" />
///<reference path="common.ts" />
///<reference path="ChapterMetadata.ts" />
class PresentationMetadata extends CustomEventEmmiter {
    constructor(app) {
        super();
        this.app = app;
        this.createObserver();
        this.slideshowChapters = new SlideshowChapters(app);
    }
    observe() {
        this.observer.observe(this.appDiv, { attributes: true });
        this.addEventListener('slideChange', slide => this.slideshowChapters.setCurrentPage(slide));
    }
    get appDiv() {
        return document.querySelector(".wnl-app-layout.wnl-course-layout" /* SELECTORS.appDiv */);
    }
    getAttrVal(name) {
        const el = document.querySelector(`[${name}]`);
        const attr = el && el.attributes.getNamedItem(name);
        return attr ? attr.value : null;
    }
    get slideNumber() {
        const n = this.getAttrVal('slide');
        return parseInt(n);
    }
    set slideNumber(n) {
        const nInput = document.querySelector('.wnl-slideshow-controls input[type=number]');
        if (nInput) {
            nInput.value = n.toString();
            nInput.dispatchEvent(new InputEvent('input'));
        }
        else {
            throw Error('Unable to set slide number!');
        }
    }
    get screenID() {
        return parseInt(this.getAttrVal('screenid'));
    }
    get presentationName() {
        const mainHeaderElem = document.querySelector('.o-lesson__title__left__header');
        return mainHeaderElem &&
            mainHeaderElem.textContent &&
            mainHeaderElem.textContent.trim();
    }
    get slideTitle() {
        const currentTitleHeader = document.querySelector('.present .sl-block-content h2');
        return currentTitleHeader &&
            currentTitleHeader.textContent &&
            currentTitleHeader.textContent.trim();
    }
    get lessonID() {
        return parseInt(this.getAttrVal('lesson-id'));
    }
    createObserver() {
        this.observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                const value = this.getAttrFromMutation(mutation);
                switch (mutation.attributeName) {
                    case 'screenid':
                        this.trigger('screenidChange', parseInt(value));
                        break;
                    case 'slide':
                        this.trigger('slideChange', parseInt(value));
                        break;
                }
            }
        });
    }
    getAttrFromMutation(mutation) {
        const attr = mutation.target.attributes.getNamedItem(mutation.attributeName);
        return attr ? attr.value : null;
    }
    stopObserving() {
        this.observer.disconnect();
    }
}
// const presentationMetadata = new PresentationMetadata()
///<reference path="../globals.d.ts" />
///<reference path="CustomEventEmmiter.ts" />
///<reference path="PresentationMetadata.ts" />
var TabOpenerIndexes;
(function (TabOpenerIndexes) {
    TabOpenerIndexes[TabOpenerIndexes["noAction"] = -1] = "noAction";
    TabOpenerIndexes[TabOpenerIndexes["findTab"] = -2] = "findTab";
})(TabOpenerIndexes || (TabOpenerIndexes = {}));
class TabOpener extends CustomEventEmmiter {
    constructor(app) {
        super();
        this.app = app;
        this.getTabIndex();
        this.setInitialStoreVal();
        GM_addValueChangeListener('openInTab', (name, oldVal, toOpen, remote) => {
            if (remote && toOpen.currentTab >= 0) {
                this.trigger('remoteOpenRequest', toOpen);
            }
            this.openSlide(toOpen);
        });
    }
    get tabIndex() {
        return this._tabIndex;
    }
    getTabIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            const tabs = yield this.getTabs();
            let maxIndex = 0;
            if (tabs) {
                tabs.forEach(tab => {
                    if (tab && tab.index > maxIndex)
                        maxIndex = tab.index;
                });
                maxIndex++;
            }
            GM_saveTab({ index: maxIndex });
            this._tabIndex = maxIndex;
        });
    }
    getTabs() {
        return new Promise(resolve => {
            GM_getTabs(tabs => resolve(Object.values(tabs)));
        });
    }
    focusThisTab() {
        if (document.hidden) {
            const w = GM_openInTab('about:blank', { active: true, setParent: true });
            setTimeout(() => w.close(), 0);
        }
    }
    openURLinTab(url) {
        return GM_openInTab(url, { active: true, setParent: true });
    }
    setInitialStoreVal() {
        GM_setValue('openInTab', {
            lessonID: this.app.presentationMetadata.lessonID,
            screenID: this.app.presentationMetadata.screenID,
            slide: this.app.presentationMetadata.slideNumber,
            currentTab: -1
        });
    }
    findTabToOpen(toOpen) {
        return __awaiter(this, void 0, void 0, function* () {
            if (isMobile()) {
                this.openURLinTab(this.generateURL(toOpen));
                return;
            }
            const tabs = yield this.getTabs();
            let nextIndex = 1000;
            tabs.forEach(tab => {
                if (tab && tab.index > toOpen.currentTab && tab.index < nextIndex)
                    nextIndex = tab.index;
            });
            if (nextIndex === 1000) {
                nextIndex = -1;
                this.openURLinTab(this.generateURL(toOpen));
            }
            toOpen.currentTab = nextIndex;
            GM_setValue('openInTab', toOpen);
        });
    }
    generateURL(toOpen) {
        const path = [WNL_LESSON_LINK, toOpen.lessonID, toOpen.screenID, toOpen.slide];
        return path.join('/');
    }
    openSlide(toOpen) {
        if (toOpen) {
            console.table(toOpen);
            if (typeof toOpen.currentTab !== 'number') {
                toOpen.currentTab = TabOpenerIndexes.findTab;
            }
            if (toOpen.currentTab === TabOpenerIndexes.noAction)
                return;
            if (this.isSlideInCurrentSlideshow(toOpen)) {
                this.focusThisTab();
                this.app.presentationMetadata.slideNumber = toOpen.slide;
                this.setInitialStoreVal();
            }
            else if (toOpen.currentTab === TabOpenerIndexes.findTab ||
                toOpen.currentTab === this.tabIndex) {
                this.findTabToOpen(toOpen);
            }
        }
    }
    isSlideInCurrentSlideshow(toOpen) {
        return toOpen.lessonID === this.app.presentationMetadata.lessonID &&
            toOpen.screenID === this.app.presentationMetadata.screenID &&
            toOpen.slide;
    }
}
///<reference path="../interfaces.d.ts" />
///<reference path="CustomEventEmmiter.ts" />
///<reference path="PresentationMetadata.ts" />
///<reference path="TabOpener.ts" />
document = unsafeWindow.document;
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
    minusCircle: inSVG `<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>`,
    stopwatch: inSVG `<path d="M8.5 5.6a.5.5 0 1 0-1 0v2.9h-3a.5.5 0 0 0 0 1H8a.5.5 0 0 0 .5-.5V5.6z"/>
    <path d="M6.5 1A.5.5 0 0 1 7 .5h2a.5.5 0 0 1 0 1v.57c1.36.196 2.594.78 3.584 1.64a.715.715 0 0 1 .012-.013l.354-.354-.354-.353a.5.5 0 0 1 .707-.708l1.414 1.415a.5.5 0 1 1-.707.707l-.353-.354-.354.354a.512.512 0 0 1-.013.012A7 7 0 1 1 7 2.071V1.5a.5.5 0 0 1-.5-.5zM8 3a6 6 0 1 0 .001 12A6 6 0 0 0 8 3z"/>`,
    chat: inSVG `<path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>`,
    capitalT: inSVG `<path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479L12.258 3z"/>`,
    keyboard: inSVG `<path d="M14 5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h12zM2 4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H2z"/>
    <path d="M13 10.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm0-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-5 0A.25.25 0 0 1 8.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 8 8.75v-.5zm2 0a.25.25 0 0 1 .25-.25h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5a.25.25 0 0 1-.25-.25v-.5zm1 2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-5-2A.25.25 0 0 1 6.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 6 8.75v-.5zm-2 0A.25.25 0 0 1 4.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 4 8.75v-.5zm-2 0A.25.25 0 0 1 2.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 2 8.75v-.5zm11-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-2 0a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-2 0A.25.25 0 0 1 9.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 9 6.75v-.5zm-2 0A.25.25 0 0 1 7.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 7 6.75v-.5zm-2 0A.25.25 0 0 1 5.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 5 6.75v-.5zm-3 0A.25.25 0 0 1 2.25 6h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5A.25.25 0 0 1 2 6.75v-.5zm0 4a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm2 0a.25.25 0 0 1 .25-.25h5.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-5.5a.25.25 0 0 1-.25-.25v-.5z"/>`,
    fileRichText: inSVG `<path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
    <path d="M4.5 12.5A.5.5 0 0 1 5 12h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm1.639-3.708 1.33.886 1.854-1.855a.25.25 0 0 1 .289-.047l1.888.974V8.5a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V8s1.54-1.274 1.639-1.208zM6.25 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"/>`,
    chevronExpand: inSVG `<path fill-rule="evenodd" d="M3.646 9.146a.5.5 0 0 1 .708 0L8 12.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708zm0-2.292a.5.5 0 0 0 .708 0L8 3.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708z"/>`,
    bell: inSVG `<path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>`,
    type: inSVG `<path d="m2.244 13.081.943-2.803H6.66l.944 2.803H8.86L5.54 3.75H4.322L1 13.081h1.244zm2.7-7.923L6.34 9.314H3.51l1.4-4.156h.034zm9.146 7.027h.035v.896h1.128V8.125c0-1.51-1.114-2.345-2.646-2.345-1.736 0-2.59.916-2.666 2.174h1.108c.068-.718.595-1.19 1.517-1.19.971 0 1.518.52 1.518 1.464v.731H12.19c-1.647.007-2.522.8-2.522 2.058 0 1.319.957 2.18 2.345 2.18 1.06 0 1.716-.43 2.078-1.011zm-1.763.035c-.752 0-1.456-.397-1.456-1.244 0-.65.424-1.115 1.408-1.115h1.805v.834c0 .896-.752 1.525-1.757 1.525z"/>`,
    import: inSVG `<path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/>
    <path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>`,
    export: inSVG `<path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/>
    <path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V10.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708l3-3z"/>`,
    code: inSVG `<path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>`,
    tools: inSVG `<path d="M1 0 0 1l2.2 3.081a1 1 0 0 0 .815.419h.07a1 1 0 0 1 .708.293l2.675 2.675-2.617 2.654A3.003 3.003 0 0 0 0 13a3 3 0 1 0 5.878-.851l2.654-2.617.968.968-.305.914a1 1 0 0 0 .242 1.023l3.27 3.27a.997.997 0 0 0 1.414 0l1.586-1.586a.997.997 0 0 0 0-1.414l-3.27-3.27a1 1 0 0 0-1.023-.242L10.5 9.5l-.96-.96 2.68-2.643A3.005 3.005 0 0 0 16 3c0-.269-.035-.53-.102-.777l-2.14 2.141L12 4l-.364-1.757L13.777.102a3 3 0 0 0-3.675 3.68L7.462 6.46 4.793 3.793a1 1 0 0 1-.293-.707v-.071a1 1 0 0 0-.419-.814L1 0Zm9.646 10.646a.5.5 0 0 1 .708 0l2.914 2.915a.5.5 0 0 1-.707.707l-2.915-2.914a.5.5 0 0 1 0-.708ZM3 11l.471.242.529.026.287.445.445.287.026.529L5 13l-.242.471-.026.529-.445.287-.287.445-.529.026L3 15l-.471-.242L2 14.732l-.287-.445L1.268 14l-.026-.529L1 13l.242-.471.026-.529.445-.287.287-.445.529-.026L3 11Z"/>`,
    gear: inSVG `<path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>`,
    palette2: inSVG `<path d="M0 .5A.5.5 0 0 1 .5 0h5a.5.5 0 0 1 .5.5v5.277l4.147-4.131a.5.5 0 0 1 .707 0l3.535 3.536a.5.5 0 0 1 0 .708L10.261 10H15.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5H3a2.99 2.99 0 0 1-2.121-.879A2.99 2.99 0 0 1 0 13.044m6-.21 7.328-7.3-2.829-2.828L6 7.188v5.647zM4.5 13a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0zM15 15v-4H9.258l-4.015 4H15zM0 .5v12.495V.5z"/>
    <path d="M0 12.995V13a3.07 3.07 0 0 0 0-.005z"/>`,
    cursor: inSVG `<path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103zM2.25 8.184l3.897 1.67a.5.5 0 0 1 .262.263l1.67 3.897L12.743 3.52 2.25 8.184z"/>`,
    arrowLeftCircle: inSVG `<path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/>`,
};
const zoomSliderHTML = `
        <span class='custom-heading'>
            ${SVGIcons.zoomIn}
            <label class="metadata">POWIĘKSZENIE</label>
        </span>
        <div style="text-align: right;">
            <input class="${"custom-script-font-size-input" /* CLASS_NAMES.fontSizeInput */}" 
                type="range" size="3" maxlength="3" min="70" max="200" 
                step="5">
            <a class="${"custom-script-font-size-input" /* CLASS_NAMES.fontSizeInput */}-decrease">${SVGIcons.zoomOut}</a>
            <span class="${"custom-script-font-size-label" /* CLASS_NAMES.fontSizeLabel */}">120%</span>
            <a class="${"custom-script-font-size-input" /* CLASS_NAMES.fontSizeInput */}-increase">${SVGIcons.zoomIn}</a>
        </div>`;
function toggleBodyClass(className, isOn) {
    let body = document.body;
    if (typeof isOn === 'undefined')
        isOn = !body.classList.contains(className);
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
const setRootProperty = (name, value) => {
    root.style.setProperty(`--${name}`, value);
};
const updateFontSize = (fontSize) => {
    setRootProperty("uniform-font-size", `${getUniformFontSize(fontSize)}em`);
    setRootProperty("scaled-font-size", `${fontSize}%`);
};
function isMobile() {
    return screen.width < 980;
}
class ClassToggler extends CustomEventEmmiter {
    constructor(className, _elementOrSelector = document.body, onchange) {
        super();
        this.className = className;
        this._elementOrSelector = _elementOrSelector;
        this.onchange = onchange;
        this._unresolved = true;
        this.invert = false;
        this._waitForClick = () => this.waitForClick();
        // if (this.element) this._getClassState()
        // else this._unresolved = true
    }
    _getClassState() {
        if (this.invert)
            this._state = !this.element.classList.contains(this.className);
        else
            this._state = this.element.classList.contains(this.className);
        this._unresolved = false;
    }
    get element() {
        if (typeof this._elementOrSelector === 'string') {
            return document.querySelector(this._elementOrSelector);
        }
        return this._elementOrSelector;
    }
    get state() {
        if (this._unresolved)
            this._getClassState();
        return this._state;
    }
    set state(val) {
        if (this._unresolved)
            this._getClassState();
        if (this._state === val)
            return;
        this._state = val;
        if (this.onchange)
            this.onchange(this);
        if (!this.invert) {
            this.element && this.element.classList[val ? 'add' : 'remove'](this.className);
        }
        else {
            this.element && this.element.classList[val ? 'remove' : 'add'](this.className);
        }
        this.trigger('stateChange', val);
    }
    flash(milis = 1000) {
        if (!this._state) {
            this.state = true;
            setTimeout(() => this.state = false, milis);
        }
    }
    toggle() {
        this.state = !this.state;
    }
    waitForClick() {
        const bodyListener = (ev) => {
            this.state = false;
            removeListeners();
        };
        const elementListener = (ev) => {
            ev.stopPropagation();
        };
        const removeListeners = () => {
            document.body.removeEventListener('click', bodyListener);
            this.element && this.element.removeEventListener('click', elementListener);
        };
        if (this.state) {
            document.body.addEventListener('click', bodyListener);
            this.element && this.element.addEventListener('click', elementListener);
        }
        else {
            removeListeners();
        }
    }
    setDismissible(dissmisible) {
        if (dissmisible)
            this.addEventListener('stateChange', this._waitForClick);
        else
            this.removeEventListener('stateChange', this._waitForClick);
    }
}
var Toggles;
(function (Toggles) {
    Toggles.summary = new ClassToggler('custom-script-hidden', '.custom-script-summary', t => {
        if (!t.state) {
            const summaryContainer = document.querySelector('custom-script-summary');
            if (!summaryContainer)
                return;
            summaryContainer.classList.remove('custom-script-hidden');
            const activeLink = summaryContainer.querySelector('.active');
            if (activeLink) {
                activeLink.scrollIntoView({ behavior: "smooth" });
            }
        }
    });
    Toggles.summary.invert = true;
    Toggles.summary.setDismissible(true);
    Toggles.search = new ClassToggler('custom-script-hidden', '.custom-script-search', t => {
        if (t.state)
            setTimeout(() => {
                document.querySelector('.slideshow-container input.custom-search-result').focus();
            }, 100);
    });
    Toggles.search.invert = true;
    Toggles.search.setDismissible(true);
    const options = new ClassToggler('custom-script-hidden', '.custom-script-additional-options');
    options.invert = true;
    Toggles.optionsBtn = new ClassToggler('active', 'a.custom-options-btn', t => {
        options.state = t.state;
    });
    Toggles.optionsBtn.setDismissible(true);
})(Toggles || (Toggles = {}));
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
///<reference path="common.ts" />
///<reference path="../App.ts" />
class SearchConstructor extends CustomEventEmmiter {
    constructor(app) {
        super();
        this.app = app;
    }
    getSearchURL(q) {
        return `https://lek.wiecejnizlek.pl/papi/v2/slides/.search?q=${encodeURIComponent(q)}&include=context,sections,slideshows.screens.lesson`;
    }
    getSearchContainer(dissmisible = false) {
        this.searchContainer = document.createElement('div');
        this.searchContainer.className = `${"custom-script-search" /* CLASS_NAMES.searchContainer */} ${dissmisible ? 'custom-script-hidden' : ''}`;
        this.searchContainer.innerHTML = SearchConstructor.searchMenu;
        this.searchResultsContainer = document.createElement('div');
        this.searchResultsContainer.className = 'custom-search-results';
        this.searchResultsContainer.innerHTML = SearchConstructor.searchInvitation;
        this.searchContainer.append(this.searchResultsContainer);
        this.searchInput = this.searchContainer.querySelector('input.custom-search-result');
        this.searchContainer.querySelector('form').addEventListener('submit', ev => {
            ev.preventDefault();
            this.performSearch();
        });
        if (dissmisible) {
            const closeBtn = document.createElement('div');
            closeBtn.className = 'custom-script-summary-close';
            closeBtn.innerHTML = SVGIcons.chevronUp;
            this.searchContainer.prepend(closeBtn);
            closeBtn.addEventListener('click', () => this.trigger('dissmiss'));
            this.searchInput.addEventListener('keyup', ev => {
                if (ev.key === 'Escape') {
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                    this.trigger('dissmiss');
                }
            });
        }
        this.searchContainer.querySelector('a.custom-search-submit').addEventListener('click', () => this.performSearch());
        this.setupClearBtn();
        return this.searchContainer;
    }
    setupClearBtn() {
        const clearBtn = this.searchContainer.querySelector('.custom-clear-search');
        this.clearBtnToggle = new ClassToggler('hidden', clearBtn);
        this.clearBtnToggle.invert = true;
        clearBtn.addEventListener('click', ev => {
            ev.preventDefault();
            this.clearSearch();
        });
        this.searchInput.addEventListener('input', ev => {
            const showClearBtn = !!this.searchInput.value || !!this.searchResultsContainer.children.length;
            this.clearBtnToggle.state = showClearBtn;
        });
    }
    clearSearch() {
        this.searchInput.value = '';
        this.searchResultsContainer.innerHTML = SearchConstructor.searchInvitation;
        this.clearBtnToggle.state = false;
        this.searchInput.focus();
        this.trigger('clear');
    }
    performSearch(query) {
        if (!this.searchContainer)
            return;
        if (query)
            this.searchInput.value = query;
        const q = this.searchInput.value;
        if (!q) {
            this.clearSearch();
            return;
        }
        this.searchContainer.scrollIntoView({ behavior: 'smooth' });
        const interpretation = this.interpretQuery(q);
        this.trigger('searchStart', interpretation);
        this.searchResultsContainer.innerHTML = `
            <div class='custom-search-result custom-loading'>
                <div style="height: 2rem;width: 65%;"></div>
                <div style="height: 1.6rem;width: 79%;"></div>
            </div>`.repeat(2);
        this.getSearchResponseHTML(interpretation).then(resp => {
            if (this.searchResultsContainer) {
                this.searchResultsContainer.innerHTML = '';
                this.searchResultsContainer.append(...resp);
                this.clearBtnToggle.state = true;
            }
            this.trigger('searchEnd');
        });
    }
    interpretQuery(rawQuery) {
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
    getSearchResponseHTML(q) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.searchRequest(q);
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
                        this.app.tabOpener.openSlide({
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
                    return SearchConstructor.WNL_DYNAMIC_SLIDES + el.id;
                return '#';
            }
        });
    }
    searchRequest(q) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                url: this.getSearchURL(q.query),
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
                    resolve(this.filterSearch(parsed, q));
                },
                onerror: reject
            });
        });
    }
    filterSearch(parsed, q) {
        return __awaiter(this, void 0, void 0, function* () {
            let filtered = parsed;
            const hasSomePhrases = (result, phrases) => {
                return phrases.map(toSearch => {
                    return Object.values(result.highlight).some(highlighted => {
                        return highlighted.some(s => this.stripHTMLTags(s).includes(toSearch));
                    });
                });
            };
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
            filtered.sort(sortUpSome(res => res.context.screen.id === this.app.presentationMetadata.screenID));
            function sortUpSome(predicate) {
                return (val1, val2) => predicate(val1) && !predicate(val2) ? -1 : 1;
            }
            return (yield this.getTagsAsResults(q)).concat(filtered);
        });
    }
    getTagsAsResults(q) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.app.notesCollection)
                return [];
            const tagColors = this.app.notesCollection.tags;
            const tags = yield this.app.notesCollection.getAllTagsWithName(q.query);
            return tags.map(tag => {
                const record = tagColors.find(record => record.name === tag.content);
                return {
                    highlight: {
                        "snippet.content": [
                            `<div title='${tag.content}'
                         style='background:${record.color};color:${getForegroundColor(record.color)}'
                         class='custom-tag'>${tag.content}</div>`
                        ]
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
    stripHTMLTags(s) {
        const tagStripper = /<[^>]+>/g;
        return s.toLowerCase().replace(tagStripper, '');
    }
}
SearchConstructor.searchMenu = `
        <form class="custom-search-input-container">
            <div>
                <input class="custom-search-result" placeholder="Szukaj...">
                <a href='#' class="custom-clear-search hidden">${SVGIcons.removeCircle}</a>
            </div>
            <a class='custom-search-submit'>${SVGIcons.search}</a>
        </form>
        `;
SearchConstructor.searchInvitation = `
        <p class="custom-search-invitation">
            <span class='custom-script-heading'>
                ${SVGIcons.search}
                <span>Zacznij wyszukiwanie</span>
            </span>
        </p>`;
SearchConstructor.WNL_DYNAMIC_SLIDES = 'https://lek.wiecejnizlek.pl/app/dynamic/slides/';
///<reference path="common.ts" />
///<reference path="CustomEventEmmiter.ts" />
///<reference path="../App.ts" />
class ResettingTimer extends CustomEventEmmiter {
    constructor(time) {
        super();
        this.time = time;
        this._listener = () => this.start();
        // app.addEventListener('unloaded', () => this.timer && clearTimeout(this.timer))
    }
    start() {
        clearTimeout(this.timer);
        this.trigger('timerStart');
        this.timer = setTimeout(() => {
            this.trigger('timerEnd');
        }, this.time);
    }
    get listener() {
        return this._listener;
    }
    endListening() {
        if (this.timer)
            clearTimeout(this.timer);
        this.trigger('endListening');
    }
}
///<reference path="common.ts" />
///<reference path="../App.ts" />
///<reference path="Search.ts" />
///<reference path="ResettingTimer.ts" />
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
                Toggles.optionsBtn.state = false;
                Toggles.search.state = false;
                Toggles.summary.state = false;
            }
        },
        // {
        //     keys: ['m'],
        //     callback: () => toggleMouseHiding()
        // },
        {
            keys: ['o'],
            callback: () => Toggles.optionsBtn.toggle()
        },
        {
            keys: ['s'],
            callback: () => Toggles.optionsBtn.flash(3000)
        },
        {
            keys: ['?', '/'],
            callback: () => Toggles.search.toggle()
        },
        {
            keys: ['l'],
            callback: () => Toggles.summary.toggle()
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
    if (!isMobile()) {
        document.addEventListener('fullscreenchange', ev => {
            if (!document.fullscreenElement) {
                if (document.querySelector('.o-referenceModal')) {
                    hideModal();
                    toggleFullscreen();
                }
                else if (Toggles.search.state) {
                    Toggles.search.state = false;
                    toggleFullscreen();
                }
                else if (Toggles.summary.state) {
                    Toggles.summary.state = false;
                    toggleFullscreen();
                }
            }
        });
    }
    function setupControl(app) {
        const slides = document.querySelectorAll('.slides .stack');
        if (!slides.length)
            return;
        slides.forEach(slide => {
            let counter = 1;
            const icons = slide.querySelectorAll('.a-icon');
            icons.forEach(icon => addSubToRef(icon, counter++));
        });
        observeSlides(app, addSubsToRefs);
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
    function observeSlides(app, cb) {
        //console.log('observeSlides')
        app.slideObserver = new MutationObserver(cb);
        app.slideObserver.observe(document.querySelector('div.slides'), {
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
        if (ref.className.includes('sub-id-'))
            return;
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
            document.querySelector(".present .present" /* SELECTORS.currentSlideContainer */),
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
    let hideAfter = 5000;
    let mouseTimer;
    const mouseTimerReset = () => {
        toggleMouseHidden(false);
        clearTimeout(mouseTimer);
        mouseTimer = setTimeout(() => {
            toggleMouseHidden(true);
        }, hideAfter);
    };
    let hideMouse = false;
    function toggleMouseHiding(timeout = 5000, hide) {
        hideAfter = timeout;
        if (timeout < 0) {
            toggleMouseHidden(hide);
            return;
        }
        if (typeof hide !== 'undefined')
            hideMouse = hide;
        else
            hideMouse = !hideMouse;
        if (hideMouse) {
            document.body.addEventListener('mousemove', mouseTimerReset);
            mouseTimerReset();
        }
        else {
            clearTimeout(mouseTimer);
            document.body.removeEventListener('mousemove', mouseTimerReset);
            toggleMouseHidden(false);
        }
    }
    function toggleMouseHidden(mouseHidden) {
        toggleBodyClass("custom-script-hide-cursor" /* BODY_CLASS_NAMES.hideCursor */, mouseHidden);
    }
})(Keyboard || (Keyboard = {}));
///<reference path="CustomEventEmmiter.ts" />
///<reference path="../globals.d.ts" />
var SettingType;
(function (SettingType) {
    SettingType[SettingType["Checkbox"] = 0] = "Checkbox";
    SettingType[SettingType["Percent"] = 1] = "Percent";
    SettingType[SettingType["Integer"] = 2] = "Integer";
    SettingType[SettingType["Button"] = 3] = "Button";
    SettingType[SettingType["Divider"] = 4] = "Divider";
    SettingType[SettingType["Enum"] = 5] = "Enum";
    SettingType[SettingType["Color"] = 6] = "Color";
})(SettingType || (SettingType = {}));
class Setting extends CustomEventEmmiter {
    constructor(options, parent) {
        super();
        this.options = options;
        this.parent = parent;
        this.name = options.name;
        this.type = options.type;
        if (this.type !== SettingType.Button && this.type !== SettingType.Divider) {
            GM_addValueChangeListener(this.name, (name, oldValue, value, remote) => {
                if (this._value === value)
                    return;
                this._value = value;
                this.trigger('change', { oldValue, remote, value });
            });
            this._value = GM_getValue(this.name, options.defaultValue);
            GM_setValue(this.name, this._value);
            if (options.isInRange)
                this.isInRange = options.isInRange;
        }
    }
    get value() {
        return this._value;
    }
    set value(value) {
        if (this.type === SettingType.Button || this._value === value)
            return;
        if (this.isInRange && !this.isInRange(value)) {
            this.trigger('change', { value: this._value, oldValue: this._value, remote: false });
            return;
        }
        const oldValue = this._value;
        this._value = value;
        GM_setValue(this.name, value);
        this.trigger('change', { value, oldValue, remote: false });
    }
}
class SettingElement extends Setting {
    constructor(options, parent) {
        super(options, parent);
        if (options.onchange)
            this.addEventListener('change', options.onchange);
        if (options.onrender)
            this.addEventListener('rendered', options.onrender);
        if (options.onclick)
            this.addEventListener('tmMenuClicked', options.onclick);
    }
    getIconHTML() {
        if (this.options.icon) {
            if (this.options.icon.html) {
                return this.options.icon.html;
            }
            else if (this.options.icon.emoji) {
                return `<span class='custom-script-emoji'>${this.options.icon.emoji}</span>`;
            }
        }
        return '';
    }
    getIconEmoji() {
        if (this.options.icon && this.options.icon.emoji) {
            return this.options.icon.emoji + ' ';
        }
        return '';
    }
    removeFromTMMenu() {
        GM_unregisterMenuCommand(this.tmHandle);
    }
    set disabled(val) {
        if (this._disabled === val)
            return;
        this._disabled = val;
        if (val)
            this.removeFromTMMenu();
        if (this.element) {
            if (val)
                this.element.style.display = 'none';
            else
                this.element.style.display = '';
        }
        this.trigger('disabled', val);
    }
    addToTMMenu() {
        if (this._disabled)
            return;
        this.tmHandle = GM_registerMenuCommand(this.renderSimple(), () => this.trigger('tmMenuClicked'), this.options.key);
    }
}
class DividerSetting extends SettingElement {
    constructor(parent) {
        super({
            name: '_divider',
            desc: 'Divider',
            type: SettingType.Divider
        }, parent);
        this.index = DividerSetting.index++;
    }
    render() {
        this.element = document.createElement('div');
        this.element.className = 'custom-setting-divider';
        this.element.innerHTML = `<div></div>`;
        return this.element;
    }
    renderSimple() {
        return '-'.repeat(15 + this.index);
    }
}
DividerSetting.index = 0;
class CheckboxSetting extends SettingElement {
    constructor(options, parent) {
        super(options, parent);
        this.addEventListener('tmMenuClicked', () => {
            this.value = !this.value;
        });
    }
    getHTML() {
        return `
        <input type='checkbox' id='custom-input-${this.name}' name='${this.name}' />
        ${this.getIconHTML()}
        <label for='custom-input-${this.name}'>${this.options.desc}</label>`;
    }
    render() {
        this.element = document.createElement('div');
        this.element.innerHTML = this.getHTML();
        this.element.classList.add('custom-script-setting');
        this.input = this.element.querySelector('input');
        this.input.checked = this.value;
        this.addEventListener('change', ({ value }) => this.input.checked = value);
        this.input.addEventListener('change', (ev) => this.value = this.input.checked);
        this.trigger('rendered');
        return this.element;
    }
    renderSimple() {
        return CheckboxSetting.getCheckboxEmoji(this.value) + ' ' +
            this.getIconEmoji() + this.options.desc;
    }
}
CheckboxSetting.getCheckboxEmoji = isOn => isOn ? "☑️" : "🔲";
class ButtonSetting extends SettingElement {
    constructor(options, parent) {
        super(options, parent);
    }
    getHTML() {
        let inner = this.getIconHTML();
        inner += this.options.desc;
        return `<a name='${this.name}'>${inner}</a>`;
    }
    render() {
        this.element = document.createElement('div');
        this.element.innerHTML = this.getHTML();
        this.element.classList.add('custom-script-setting');
        this.btn = this.element.querySelector('a');
        this.btn.addEventListener('click', () => this.trigger('tmMenuClicked'));
        this.trigger('rendered');
        return this.element;
    }
    renderSimple() {
        return this.getIconEmoji() + this.options.desc;
    }
}
ButtonSetting.getCheckboxEmoji = isOn => isOn ? "☑️" : "🔲";
class NumberSetting extends SettingElement {
    constructor(options, parent) {
        super(options, parent);
        this.addEventListener('tmMenuClicked', () => {
            const isPercent = options.type === SettingType.Percent;
            this.value = parseInt(prompt(`Podaj wartość ${isPercent ? "procentową " : ''}dla ustawienia (obecnie ${this.value}${isPercent ? '%' : ''}):\n${this.options.desc}`));
        });
    }
    set upperLimit(ul) {
        this.input && (this.input.max = ul.toString());
    }
    set lowerLimit(ll) {
        this.input && (this.input.min = ll.toString());
    }
    getHTML() {
        const isPercent = this.type === SettingType.Percent;
        if (isPercent) {
            return `
                ${this.getIconHTML()}
                <label>${this.options.desc}</label>
                <div>
                    <a>${SVGIcons.minusCircle}</a>
                    <input type='range' name='${this.name}' />
                    <a>${SVGIcons.plusCircle}</a>
                    <span class='custom-range-val'></span>
                </div>`;
        }
        else {
            return `
                ${this.getIconHTML()}
                <label>${this.options.desc}</label>
                <input type='number' name='${this.name}' />`;
        }
    }
    render() {
        this.element = document.createElement('div');
        this.element.innerHTML = this.getHTML();
        this.element.classList.add('custom-script-setting');
        this.input = this.element.querySelector('input');
        this.input.value = this.value.toString();
        if (this.type === SettingType.Percent) {
            this.element.style.flexWrap = 'wrap';
            const valueEl = this.element.querySelector('span');
            valueEl.innerText = `${this.value}%`;
            const btnElems = this.element.querySelectorAll('a');
            btnElems.forEach((btn, i) => {
                btn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    const delta = Math.ceil(this.value * 0.05);
                    this.value = this.value + (i ? delta : -delta);
                });
            });
            this.addEventListener('change', ({ value }) => valueEl.innerText = `${value}%`);
            this.input.addEventListener('input', () => valueEl.innerText = `${this.input.value}%`);
        }
        this.addEventListener('change', ({ value }) => this.input.value = value.toString());
        this.input.addEventListener('change', (ev) => this.value = this.parse(this.input.value));
        this.input.addEventListener('input', (ev) => this.trigger('input', { value: this.parse(this.input.value) }));
        this.trigger('rendered');
        return this.element;
    }
    parse(value) {
        return parseFloat(value.replace(',', '.'));
    }
    renderSimple() {
        const percentSymb = this.type === SettingType.Percent ? '%' : '';
        return this.getIconEmoji() + this.options.desc + ` (${this.value}${percentSymb})`;
    }
}
class ColorSetting extends SettingElement {
    constructor(options, parent) {
        super(options, parent);
        this.addEventListener('tmMenuClicked', () => {
            /// todo
            this.input.click();
        });
    }
    getHTML() {
        return `
            ${this.getIconHTML()}
            <label>${this.options.desc}</label>
            <input type='color' name='${this.name}' />`;
    }
    render() {
        this.element = document.createElement('div');
        this.element.innerHTML = this.getHTML();
        this.element.classList.add('custom-script-setting');
        this.input = this.element.querySelector('input');
        this.input.value = this.value.toString();
        this.addEventListener('change', ({ value }) => this.input.value = value.toString());
        this.input.addEventListener('change', (ev) => this.value = this.input.value);
        this.input.addEventListener('input', (ev) => this.trigger('input', { value: this.input.value }));
        this.trigger('rendered');
        return this.element;
    }
    renderSimple() {
        return this.getIconEmoji() + this.options.desc + ` (${this.value})`;
    }
}
class EnumSetting extends SettingElement {
    constructor(options, parent) {
        super(options, parent);
        this.keys = this.options.enum.map(opt => opt.value);
        this.addEventListener('tmMenuClicked', () => {
            const currentIndex = this.keys.findIndex(key => {
                return key === this.value;
            }) + 1;
            this.value = this.keys[currentIndex >= this.keys.length ? 0 : currentIndex];
        });
    }
    getHTML() {
        return `
            ${this.getIconHTML()}
            <label>${this.options.desc}</label>
            <div>
                <select name='${this.name}'>
                    ${this.options.enum.map(opt => {
            return `<option value='${opt.value}' 
                        ${opt.value === 'default' ? 'default' : ''}>
                        ${opt.desc}</option>`;
        }).join('')}
                </select>
            </div>`;
    }
    render() {
        this.element = document.createElement('div');
        this.element.innerHTML = this.getHTML();
        this.element.classList.add('custom-script-setting');
        this.select = this.element.querySelector('select');
        this.select.value = this.value;
        this.addEventListener('change', ({ value }) => this.select.value = value.toString());
        this.select.addEventListener('change', (ev) => this.value = this.select.value);
        // this.select.addEventListener(
        //     'input', 
        //     (ev) => this.trigger('input', { value: this.select.value as Key })
        // )
        this.trigger('rendered');
        return this.element;
    }
    renderSimple() {
        return this.getIconEmoji() + this.options.desc + ` (${this.options.enum.find(opt => opt.value === this.value).desc})`;
    }
}
class Settings extends CustomEventEmmiter {
    constructor(app) {
        super();
        this.app = app;
        this.settings = [];
    }
    addSettings(settings) {
        settings.forEach(sett => this.addSetting(sett));
    }
    addSetting(setting) {
        let sett;
        if (setting instanceof SettingElement) {
            setting.parent = this;
            sett = setting;
        }
        else if (setting.type === SettingType.Checkbox) {
            sett = new CheckboxSetting(setting, this);
        }
        else if (setting.type === SettingType.Button) {
            sett = new ButtonSetting(setting, this);
        }
        else if (setting.type === SettingType.Divider) {
            sett = new DividerSetting(this);
        }
        else if (setting.type === SettingType.Percent || setting.type === SettingType.Integer) {
            sett = new NumberSetting(setting, this);
        }
        else if (setting.type === SettingType.Enum) {
            sett = new EnumSetting(setting, this);
        }
        else if (setting.type === SettingType.Color) {
            sett = new ColorSetting(setting, this);
        }
        if (!sett)
            return;
        this.settings.push(sett);
        this.app.addEventListener('loaded', () => sett.trigger('change', {
            value: sett.value,
            oldValue: sett.options.defaultValue,
            remote: false
        }));
        sett.addEventListener('change', () => {
            this.renderInTMMenu();
        });
    }
    setValue(name, value) {
        let toSave;
        if (typeof value === "function")
            toSave = value(this.getValue(name));
        else
            toSave = value;
        GM_setValue(name, toSave);
    }
    getValue(name) {
        return GM_getValue(name);
    }
    getSetting(name) {
        return this.settings.find(s => s.name === name);
    }
    renderInTMMenu() {
        this.settings.forEach(setting => {
            setting.removeFromTMMenu();
            setting.addToTMMenu();
        });
    }
    render() {
        this.element = document.createElement('div');
        this.element.append(...this.settings.map(setting => setting.render()));
        return this.element;
    }
}
///<reference path="CustomEventEmmiter.ts" />
class ExternalFragment extends CustomEventEmmiter {
    constructor(initialURL, selector) {
        super();
        this.initialURL = initialURL;
        this.selector = selector;
        this.iframe = document.createElement('iframe');
        this.iframe.width = '1300';
        this.iframe.height = '800';
        this.iframe.style.position = 'absolute';
        this.iframe.style.bottom = '100vh';
        document.body.append(this.iframe);
        this.load();
    }
    load() {
        if (this.interval)
            clearInterval(this.interval);
        if (this.element)
            this.element.remove();
        this.iframe.src = this.initialURL;
        this.triesLeft = 20;
        this.iframe.addEventListener('load', (ev) => __awaiter(this, void 0, void 0, function* () {
            this.element = yield this.getElement();
            this.setupURLChangeDetection();
            this.trigger('loaded', this.element);
        }), { once: true });
        this.childWindow = this.iframe.contentWindow;
    }
    getElement() {
        this.iframe.hidden = false;
        return new Promise(resolve => {
            const doc = this.iframe.contentDocument;
            if (!doc)
                return resolve(null);
            const interval = setInterval(() => {
                const element = doc.querySelector(this.selector);
                if (!element && this.triesLeft--)
                    return;
                clearInterval(interval);
                this.iframe.hidden = true;
                resolve(element);
            }, 100);
        });
    }
    setupURLChangeDetection() {
        if (!this.childWindow)
            return;
        this.url = this.childWindow.location.href;
        this.interval = setInterval(() => {
            if (!this.childWindow)
                return;
            if (this.url === this.childWindow.location.href)
                return;
            this.url = this.childWindow.location.href;
            console.log({ changedURL: this.url });
            this.trigger('iframeURLChange', this.url);
        }, 100);
    }
    destroy() {
        clearInterval(this.interval);
        this.iframe.remove();
        this.element.remove();
        this.element = this.iframe = this.childWindow = this.url = null;
    }
}
///<reference path="ExternalFragment.ts" />
///<reference path="../globals.d.ts" />
class CourseSidebar extends ExternalFragment {
    constructor() {
        super('https://lek.wiecejnizlek.pl/app/courses/1/', '.course-sidenav');
        this.urlChangeTime = 1200;
        this.lessonOpened = false;
        this.prepareContainer();
        this.addEventListener('loaded', el => {
            if (!el)
                return;
            this.lessonOpened = false;
            this.goBackToggle.state = false;
            this.container.append(el);
        });
        this.setupOpenLinks();
    }
    setupOpenLinks() {
        this.lastURLUpdate = Date.now();
        const urlRegExp = /lek.wiecejnizlek.pl\/app\/courses\/1\/lessons\/([0-9]+)\/([0-9]+)\/([0-9]+)/;
        this.addEventListener('iframeURLChange', newURL => {
            this.goBackToggle.state = true;
            const now = Date.now();
            console.log({ now });
            // if (now - this.lastURLUpdate < this.urlChangeTime) return
            this.lastURLUpdate = now;
            const matching = urlRegExp.exec(newURL);
            console.table(matching);
            if (!matching)
                return;
            if (!this.lessonOpened) {
                this.lessonOpened = true;
                return;
            }
            this.trigger('urlChange', {
                url: newURL,
                lessonID: parseInt(matching[1]),
                screenID: parseInt(matching[2]),
                slide: parseInt(matching[3]),
            });
        });
    }
    prepareContainer() {
        this.container = document.createElement('div');
        this.container.innerHTML = CourseSidebar.CONTAINER_HTML;
        this.container.classList.add('custom-main-nav-container');
        this.collapseToggler = new ClassToggler('active', this.container);
        this.container.querySelector('a.custom-expand').addEventListener('click', () => this.collapseToggler.toggle());
        const goBackBtn = this.container.querySelector('a.custom-go-back');
        this.goBackToggle = new ClassToggler('hidden', goBackBtn);
        this.goBackToggle.invert = true;
        goBackBtn.addEventListener('click', () => this.load());
        // sidenav.prepend(this.container)
    }
    attach(parent) {
        parent.prepend(this.container);
    }
    show() {
        this.container && (this.container.style.display = '');
    }
    hide() {
        this.container && (this.container.style.display = 'none');
    }
    destroy() {
        this.container.remove();
        super.destroy();
    }
}
CourseSidebar.CONTAINER_HTML = `
    <a class='custom-expand'>
        ${SVGIcons.chevronUp}
        <span>CAŁY KURS</span>
    </a>
    <a class='custom-go-back hidden'>
        ${SVGIcons.arrowLeftCircle}
        <span>WRÓĆ</span>
    </a>`;
///<reference path="common.ts" />
///<reference path="Keyboard.ts" />
///<reference path="Settings.ts" />
///<reference path="CourseSidebar.ts" />
///<reference path="../App.ts" />
const mouseTimer = new ResettingTimer(5000);
const getOptions = (app) => [
    {
        name: "increaseFontSize",
        type: SettingType.Checkbox,
        desc: "Zwiększ wielkość czcionki",
        icon: {
            emoji: "🔎",
            html: SVGIcons.zoomIn
        },
        onchange: function (state) {
            if (state.value) {
                this.parent.setValue("uniformFontSize", false);
            }
            toggleBodyClass("custom-script-increase-font-size" /* BODY_CLASS_NAMES.increaseFontSize */, state.value);
        },
        defaultValue: true,
        key: 'f'
    },
    {
        name: "increaseAnnotations",
        icon: {
            emoji: "📄",
            html: SVGIcons.fileRichText
        },
        desc: "Zwiększ wielkość czcionki w przypisach",
        type: SettingType.Checkbox,
        onchange: state => toggleBodyClass("custom-script-increase-annotations" /* BODY_CLASS_NAMES.increaseAnnotations */, state.value),
        defaultValue: false,
        key: 'a'
    },
    {
        name: "uniformFontSize",
        icon: {
            emoji: "🔤",
            html: SVGIcons.type
        },
        desc: "Ujednolicona wielkość czcionki",
        type: SettingType.Checkbox,
        onchange: function (state) {
            if (state.value) {
                this.parent.setValue("increaseFontSize", false);
            }
            toggleBodyClass("custom-script-uniform-font-size" /* BODY_CLASS_NAMES.uniformFontSize */, state.value);
        },
        defaultValue: false,
        key: 'u'
    },
    {
        name: "percentIncrease",
        type: SettingType.Percent,
        icon: {
            emoji: "➕",
            html: SVGIcons.zoomIn
        },
        desc: "Zmień powiększenie",
        isInRange: nextValue => nextValue !== NaN && nextValue > 10 && nextValue < 300,
        defaultValue: 110,
        onchange: state => {
            updateFontSize(state.value);
            const rangeInput = document.querySelector(`input.${"custom-script-font-size-input" /* CLASS_NAMES.fontSizeInput */}`);
            const rangeLabel = document.querySelector(`.${"custom-script-font-size-label" /* CLASS_NAMES.fontSizeLabel */}`);
            if (rangeInput) {
                rangeInput.value = state.value.toString();
                rangeInput.title = state.value.toString();
            }
            if (rangeLabel)
                rangeLabel.innerText = `${state.value}%`;
        },
        onrender: function () {
            const rangeInput = document.querySelector(`input.${"custom-script-font-size-input" /* CLASS_NAMES.fontSizeInput */}`);
            const rangeLabel = document.querySelector(`.${"custom-script-font-size-label" /* CLASS_NAMES.fontSizeLabel */}`);
            if (rangeInput) {
                rangeInput.value = this.value.toString();
                rangeLabel.innerText = `${this.value}%`;
                rangeInput.addEventListener('change', event => {
                    const value = parseInt(rangeInput.value);
                    this.value = value;
                });
                const oninput = () => {
                    const value = rangeInput.value;
                    updateFontSize(parseInt(value));
                };
                rangeInput.addEventListener('input', oninput);
                this.addEventListener('input', oninput);
            }
            const increaseBy = (n) => {
                this.value += n;
            };
            Keyboard.registerShortcut({
                keys: ['-'],
                callback: () => increaseBy(-5)
            });
            Keyboard.registerShortcut({
                keys: ['+', '='],
                callback: () => increaseBy(5)
            });
        },
        key: 'p'
    },
    {
        type: SettingType.Divider
    },
    {
        name: "hideChat",
        icon: {
            emoji: "💬",
            html: SVGIcons.chat
        },
        desc: "Ukryj czat",
        type: SettingType.Checkbox,
        onchange: state => toggleBodyClass("custom-script-hide-chat" /* BODY_CLASS_NAMES.hideChat */, state.value),
        defaultValue: false,
        key: 'c'
    },
    {
        name: "hideSlideNav",
        icon: {
            emoji: "↔️",
            html: SVGIcons.code
        },
        desc: "Ukryj strzałki nawigacji na slajdach",
        type: SettingType.Checkbox,
        defaultValue: isMobile(),
        onchange: state => toggleBodyClass("custom-script-slide-nav-chat" /* BODY_CLASS_NAMES.hideSlideNav */, state.value),
    },
    {
        name: "showMainCourseSidebar",
        icon: {
            emoji: "📗",
            html: SVGIcons.viewStack
        },
        desc: "Pokaż nawigację całego kursu w panelu bocznym",
        type: SettingType.Checkbox,
        defaultValue: false,
        onchange: state => {
            if (state.value) {
                if (!app.courseSidebar) {
                    setupSidebar();
                    app.addEventListener('unloaded', () => app.courseSidebar.destroy());
                }
                app.addEventListener('loaded', setupSidebar);
                app.courseSidebar.show();
            }
            else {
                app.removeEventListener('loaded', setupSidebar);
                if (app.courseSidebar)
                    app.courseSidebar.hide();
            }
            function setupSidebar() {
                app.courseSidebar = new CourseSidebar();
                const sidenav = document.querySelector('aside.course-sidenav');
                if (sidenav && !document.querySelector('.wnl-sidenav-detached')) {
                    app.courseSidebar.attach(sidenav);
                }
                else {
                    app.setupObserveSidenav();
                    app.addEventListener('sidenavOpened', opened => {
                        if (opened) {
                            const sidenav = document.querySelector('aside.course-sidenav');
                            app.courseSidebar.attach(sidenav);
                        }
                    });
                }
                app.courseSidebar.addEventListener('urlChange', toOpen => {
                    app.tabOpener.openSlide(toOpen);
                });
            }
        },
    },
    {
        type: SettingType.Divider
    },
    {
        name: "keyboardControl",
        icon: {
            emoji: "⌨️",
            html: SVGIcons.keyboard
        },
        desc: "Sterowanie klawiaturą",
        type: SettingType.Checkbox,
        onchange: state => {
            if (state.value) {
                Keyboard.setupControl(app);
            }
            else {
                document.querySelectorAll('sub.small').forEach(sub => sub.remove());
                Keyboard.disableControl();
                if (app.slideObserver)
                    app.slideObserver.disconnect();
            }
        },
        defaultValue: !isMobile(),
        key: 'k'
    },
    {
        name: "changeTitle",
        icon: {
            emoji: "🆎",
            html: SVGIcons.capitalT
        },
        desc: "Zmień tytuł karty",
        type: SettingType.Checkbox,
        onchange: state => {
            if (!state.value) {
                if (app.originalTitle)
                    unsafeWindow.document.title = app.originalTitle;
            }
            app.updateTabTitle();
        },
        onrender: () => {
            app.originalTitle = unsafeWindow.document.title;
        },
        defaultValue: !isMobile(),
        key: 't'
    },
    {
        name: "invertImages",
        icon: {
            emoji: "🔃",
            html: SVGIcons.pallete
        },
        desc: "Odwróć kolory obrazów",
        type: SettingType.Checkbox,
        defaultValue: false,
        onchange: state => toggleBodyClass("custom-script-invert-images" /* BODY_CLASS_NAMES.invertImages */, state.value),
        key: 'i'
    },
    {
        name: "changeTheme",
        icon: {
            emoji: "🖼️",
            html: SVGIcons.palette2
        },
        enum: [
            {
                value: 'default',
                desc: 'nie zmieniaj'
            },
            {
                value: 'white',
                desc: 'biały'
            },
            {
                value: 'black',
                desc: 'czarny'
            },
            {
                value: 'image',
                desc: 'obrazek'
            },
            {
                value: 'custom',
                desc: 'wybrany kolor...'
            }
        ],
        desc: "Zmień domyślny motyw...",
        type: SettingType.Enum,
        defaultValue: "default",
        onchange: function (state) {
            app.setBackground();
            const parent = this.parent;
            console.log({ parent });
            const customColorSett = parent.getSetting('customSlideshowColor');
            console.log({ customColorSett });
            customColorSett.disabled = state.value !== 'custom';
        },
        key: 'i'
    },
    {
        type: SettingType.Color,
        name: 'customSlideshowColor',
        desc: 'Kolor slajdów',
        defaultValue: '#ffffff',
        icon: {
            html: SVGIcons.pallete,
            emoji: '🎨'
        },
        onchange: state => {
            console.log('color chosen:', state.value);
            setRootProperty('custom-slideshow-bg-color', state.value);
            setRootProperty('custom-slideshow-fg-color', getForegroundColor(state.value));
        }
    },
    {
        name: "smoothScroll",
        icon: {
            emoji: "↕️",
            html: SVGIcons.chevronExpand
        },
        desc: "Płynne przewijanie strzałkami",
        type: SettingType.Checkbox,
        defaultValue: false,
        key: 's'
    },
    {
        name: "hideCursor",
        icon: {
            emoji: "🖱️",
            html: SVGIcons.cursor
        },
        desc: "Ukryj kursor (przy braku aktywności)",
        type: SettingType.Checkbox,
        defaultValue: false,
        onchange: state => {
            if (state.value) {
                mouseTimer.start();
            }
            else {
                mouseTimer.endListening();
            }
        },
        onrender: function () {
            if (isMobile()) {
                this.disabled = true;
                return;
            }
            mouseTimer.addEventListener('timerEnd', () => {
                setMouseVisible(false);
                document.addEventListener('mousemove', () => setMouseVisible(true));
            });
            mouseTimer.addEventListener('timerStart', () => setMouseVisible(true));
            setupListening();
            mouseTimer.addEventListener('endListening', () => {
                document.removeEventListener('mousemove', mouseTimer.listener);
                setMouseVisible(true);
                setupListening();
            });
            Keyboard.registerShortcut({
                keys: ['m'],
                callback: () => {
                    this.value = !this.value;
                }
            });
            function setMouseVisible(visible) {
                toggleBodyClass("custom-script-hide-cursor" /* BODY_CLASS_NAMES.hideCursor */, !visible);
            }
            function setupListening() {
                mouseTimer.addEventListener('timerStart', () => {
                    document.addEventListener('mousemove', mouseTimer.listener);
                    setMouseVisible(false);
                }, true);
            }
        }
    },
    {
        type: SettingType.Divider
    },
    {
        name: "hideTools",
        icon: {
            emoji: "🛠️",
            html: SVGIcons.tools
        },
        desc: "Ukryj narzędzia",
        type: SettingType.Checkbox,
        onchange: state => toggleBodyClass("custom-script-hideTools" /* BODY_CLASS_NAMES.hideTools */, state.value),
        defaultValue: false,
    },
    {
        name: "hideTags",
        icon: {
            emoji: "🔖",
            html: SVGIcons.tags
        },
        desc: "Ukryj listę tagów",
        type: SettingType.Checkbox,
        onchange: state => toggleBodyClass("custom-script-hideTags" /* BODY_CLASS_NAMES.hideTags */, state.value),
        defaultValue: false,
    },
    {
        name: "hideBottomSearch",
        icon: {
            emoji: "🔎",
            html: SVGIcons.search
        },
        desc: "Ukryj narzędzie wyszukiwania pod slajdem",
        type: SettingType.Checkbox,
        onchange: state => toggleBodyClass("custom-script-hideBottomSearch" /* BODY_CLASS_NAMES.hideBottomSearch */, state.value),
        defaultValue: false,
    },
];
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
                if (this._lastValue !== this.content)
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
    let NoteType;
    (function (NoteType) {
        NoteType["Regular"] = "regular";
        NoteType["Tag"] = "tag";
    })(NoteType = Notes.NoteType || (Notes.NoteType = {}));
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
                options.type = NoteType.Regular;
                return this.addAnyNote(options, RegularNote);
            }
            addTag(options) {
                options.type = NoteType.Tag;
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
                const transaction = event.target.transaction;
                try {
                    notesStore = db.createObjectStore(Presentation.NOTES_STORE, { keyPath: 'id' });
                }
                catch (_a) {
                    notesStore = transaction.objectStore(Presentation.NOTES_STORE);
                }
                try {
                    tagsStore = db.createObjectStore(Presentation.TAGS_STORE, { keyPath: 'name' });
                }
                catch (_b) {
                    tagsStore = transaction.objectStore(Presentation.TAGS_STORE);
                }
                Presentation.generateIndexes(notesStore, Presentation.NOTES_INDEXES);
                Presentation.generateIndexes(tagsStore, Presentation.TAGS_INDEXES);
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
                    const db = yield getIndexedDB("NotesDatabase", Presentation.dbVersion, Presentation.setupDB);
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
        Presentation.dbVersion = 6;
        Collections.Presentation = Presentation;
    })(Collections = Notes.Collections || (Notes.Collections = {}));
})(Notes || (Notes = {}));
// PresentationNotesCollection.createAsync(892).then(collection => console.log(collection))
///<reference path="common.ts" />
class BreakTimer {
    constructor(app) {
        this.app = app;
        this.listener = () => this.start();
        app.addEventListener('unloaded', () => this.timer && clearTimeout(this.timer));
    }
    start() {
        clearTimeout(this.timer);
        //console.log('starting suggestBreak timer...')
        this.timer = setTimeout(() => {
            alert('Pora na przerwę 🔔');
        }, 1000 * 60 * this.app.tools.getValue('breakTime'));
    }
    endListening() {
        this.app.presentationMetadata.removeEventListener('slideChange', this.listener);
        if (this.timer)
            clearTimeout(this.timer);
    }
    startListening() {
        this.app.presentationMetadata.addEventListener('slideChange', this.listener);
    }
}
///<reference path="common.ts" />
///<reference path="Notes.ts" />
///<reference path="BreakTimer.ts" />
let noteTarget;
const tagContainerHTML = `
        <div class='custom-tags-container'> 
            <a class='custom-new-tag custom-tag'>${SVGIcons.plusCircle}</a>  
        </div>`;
const notesBtnsHTML = `
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
        </div>`;
function createNotesBtnsAndTags() {
    const slideshowContainer = document.querySelector('.slideshow-container');
    if (!slideshowContainer)
        return;
    if (document.querySelector('.custom-tags-and-btns-container'))
        return;
    const el = document.createElement('div');
    el.innerHTML = tagContainerHTML + notesBtnsHTML;
    el.className = 'custom-tags-and-btns-container';
    slideshowContainer.append(el);
}
class NotesRendering {
    constructor(app) {
        this.app = app;
        this.notesChangedListener = (change) => this.slideNotesChanged(change);
        this.addNoteBtnHandler = (event) => {
            if (this.app.currentSlideNotes) {
                const slide = document.querySelector(".present .present" /* SELECTORS.currentSlideContainer */);
                slide.style.cursor = `copy`;
                const newNote = this.app.currentSlideNotes.addNote({
                    content: '', position: { x: 0, y: 1 },
                    presentationTitle: this.app.presentationMetadata.presentationName,
                    slideTitle: this.app.presentationMetadata.slideTitle
                });
                newNote.startFollowingMouse({ x: 0, y: 10 });
                slide.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    newNote.endFollowingMouse();
                    slide.style.cursor = '';
                    const contextElem = event.target;
                    this.setupContextElem(contextElem, newNote);
                    const textContext = contextElem.innerText;
                    newNote.metadata.textContext = textContext;
                    newNote.element.click();
                }, { once: true });
            }
        };
        this.btnsContainerNoTags = new ClassToggler('custom-no-tags', '.custom-notes-btns-container');
        this.btnsContainerNoNotes = new ClassToggler('custom-no-notes', '.custom-notes-btns-container');
    }
    loadNotes() {
        return __awaiter(this, void 0, void 0, function* () {
            const presentationMetadata = this.app.presentationMetadata;
            this.app.notesCollection = yield Notes.Collections.Presentation.createAsync(presentationMetadata.screenID, presentationMetadata.lessonID);
            this.setupTagList();
            return this.renderNotes(this.app.slideNumber);
        });
    }
    setupTagList() {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = yield this.app.notesCollection.getAllTagNames();
            this.app.addTagListContainer();
            const tagToOption = (tag) => {
                const opt = document.createElement('option');
                opt.value = tag.name;
                opt.style.background = tag.color;
                opt.innerHTML = tag.name;
                return opt;
            };
            const tagToTagListElem = (tag) => {
                const el = document.createElement('a');
                el.className = 'custom-tag';
                el.innerText = tag.name;
                el.style.background = tag.color;
                el.style.color = getForegroundColor(tag.color);
                el.addEventListener('click', ev => {
                    ev.preventDefault();
                    this.app.searchInBottomContainer.performSearch(`"${tag.name}"`);
                });
                return el;
            };
            const suggestions = tags.map(tagToOption);
            const tagListElems = tags.map(tagToTagListElem);
            const suggestionsContainer = document.createElement('datalist');
            const tagListContainer = document.querySelector(`.${"custom-tagList" /* CLASS_NAMES.tagList */}`);
            suggestionsContainer.id = 'custom-tags-list';
            suggestionsContainer.append(...suggestions);
            tagListContainer.append(...tagListElems);
            document.body.append(suggestionsContainer);
            this.app.notesCollection.addEventListener('changedTags', desc => {
                if (desc.added && desc.added.length) {
                    suggestionsContainer.append(...desc.added.map(tagToOption));
                    tagListContainer.append(...desc.added.map(tagToTagListElem));
                }
            });
        });
    }
    getRandomTagColor() {
        const colors = ["#6e8898", "#606c38", "#fabc2a", "#c3423f", "#011936"];
        return getRandomElement(colors);
    }
    renderNotes(slideNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.app.currentSlideNotes) {
                this.app.currentSlideNotes.commitChanges();
                this.app.currentSlideNotes.removeEventListener('change', this.notesChangedListener);
            }
            if (this.app.tools && this.app.tools.getValue('useNotes') && this.app.notesCollection) {
                if (noteTarget)
                    noteTarget.innerHTML = '';
                const currentSlide = document.querySelector(".present .present" /* SELECTORS.currentSlideContainer */);
                if (!currentSlide)
                    return;
                const notesOverlayElem = currentSlide.querySelector('.custom-notes-overlay');
                return this.app.notesCollection.getNotesBySlide(slideNumber).then(notes => {
                    this.app.currentSlideNotes = notes;
                    this.renderTags();
                    this.btnsContainerNoNotes.state = !notes.notes.length;
                    if (!noteTarget && notesOverlayElem)
                        return notes.notes.map(n => n.element);
                    //console.log({ currentSlideNotes })
                    this.app.currentSlideNotes.addEventListener('change', this.notesChangedListener);
                    return this.addNoteElems(notes.notes);
                });
            }
        });
    }
    renderTags() {
        const tagContainer = document.querySelector('.custom-tags-container');
        if (!tagContainer)
            return;
        const toRemove = Array.from(tagContainer.children);
        toRemove.pop();
        toRemove.forEach(el => el.remove());
        const tags = this.app.currentSlideNotes.tags;
        if (tags.length) {
            tags.forEach(tag => {
                tag.render(tagContainer);
            });
        }
        this.btnsContainerNoTags.state = !tags.length;
    }
    slideNotesChanged(change) {
        if (change.added) {
            const regular = change.added.filter(note => note instanceof Notes.RegularNote);
            if (regular.length)
                this.addNoteElems(regular);
            const tags = change.added.filter(note => note instanceof Notes.TagNote);
            this.btnsContainerNoTags.state = this.btnsContainerNoTags.state && !tags.length;
            const tagContainer = document.querySelector('.custom-tags-container');
            tags.forEach(tag => {
                const tagElem = tag.render(tagContainer);
                tagElem.click();
            });
        }
        if (change.deleted && !this.app.currentSlideNotes.notes.length) {
            this.btnsContainerNoNotes.state = true;
        }
    }
    addNoteElems(notes) {
        if (!notes.length)
            return;
        this.btnsContainerNoNotes.state = false;
        let parent;
        const currentSlide = document.querySelector(".present .present" /* SELECTORS.currentSlideContainer */);
        if (!currentSlide)
            return;
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
                    this.setupContextElem(contextElem, note);
            }
            return noteElem;
        });
    }
    setupContextElem(contextElem, note) {
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
    addNotesColumn() {
        const notesContainer = document.createElement('div');
        notesContainer.classList.add('custom-script-notes-column', 'custom-script-hidden');
        const numberContainer = document.querySelector('.order-number-container');
        if (!numberContainer)
            return;
        numberContainer.after(notesContainer);
        return notesContainer;
    }
}
///<reference path="../App.ts" />
///<reference path="NotesRendering.ts" />
const notesOverlayToggle = new ClassToggler('custom-script-notes-visible');
const noteColumnToggle = new ClassToggler('custom-script-hidden', '.custom-script-notes-column');
let uploadInput;
const getToolsConfig = app => [
    {
        name: "suggestBreak",
        type: SettingType.Checkbox,
        desc: "Sugeruj przerwę przy dłuższym braku aktywności",
        icon: {
            emoji: '🔔',
            html: SVGIcons.bell
        },
        defaultValue: false,
        onchange: function (state) {
            if (!app.breakTimer)
                app.breakTimer = new BreakTimer(app);
            if (state.value) {
                app.breakTimer.startListening();
                app.breakTimer.start();
            }
            else {
                app.breakTimer.endListening();
            }
            this.parent.getSetting('breakTime').disabled = !state.value;
        },
        onrender: () => {
            app.addEventListener('loaded', () => {
                app.breakTimer = new BreakTimer(app);
            });
        }
    },
    {
        name: 'breakTime',
        desc: "Czas przerwy (w minutach)",
        type: SettingType.Integer,
        defaultValue: 7,
        icon: {
            html: SVGIcons.stopwatch,
            emoji: '⌚'
        },
        onchange: function (event) {
            if (app.breakTimer.timer) {
                app.breakTimer.start();
            }
        },
        isInRange: val => val > 2 && val < 200
    },
    {
        name: "useNotes",
        type: SettingType.Checkbox,
        desc: "Używaj notatek i tagów",
        icon: {
            emoji: '📝',
            html: SVGIcons.stickies
        },
        defaultValue: false,
        onchange: function (state) {
            toggleBodyClass('custom-script-use-notes', state.value);
            if (app.notesRendering && app.presentationMetadata.screenID && state.value && !app.notesCollection) {
                app.notesRendering.addNotesColumn();
                setupNotesBtns(app);
                app.notesRendering.loadNotes();
                // if (isMobile()) {
                //     viewNotesBtnToggle.state = true
                //     viewTagsBtnToggle.state = true
                // }
            }
            this.parent.getSetting('exportNotes').disabled = !state.value;
            this.parent.getSetting('importNotes').disabled = !state.value;
        },
        onrender: function () {
            const onLoaded = () => {
                if (this.value) {
                    app.notesRendering.addNotesColumn();
                    setupNotesBtns(app);
                }
            };
            if (app.loaded)
                onLoaded();
            else
                app.addEventListener('loaded', onLoaded);
        },
    },
    {
        name: "exportNotes",
        desc: "Eksportuj notatki",
        icon: {
            emoji: '📤',
            html: SVGIcons.export
        },
        type: SettingType.Button,
        onclick: () => {
            if (!app.notesCollection)
                return;
            app.notesCollection.exportNotes().then(notes => {
                //console.log({ notes })
                downloadFile('application/json', `${app.presentationMetadata.presentationName}-notes.json`, JSON.stringify(notes));
            });
        }
    },
    {
        name: "importNotes",
        desc: "Importuj notatki",
        icon: {
            emoji: '📥',
            html: SVGIcons.import
        },
        type: SettingType.Button,
        onclick: function () {
            uploadInput.addEventListener('change', (ev) => {
                if (!app.notesCollection)
                    return;
                if (uploadInput.files.length) {
                    const file = uploadInput.files.item(0);
                    file.text().then(imported => app.notesCollection.importNotes(JSON.parse(imported))).then(() => unsafeWindow.location.reload());
                }
            }, { once: true });
            uploadInput.click();
        },
        onrender: function () {
            uploadInput = document.createElement('input');
            uploadInput.type = 'file';
            uploadInput.name = 'importNotes';
            uploadInput.accept = 'application/json';
            uploadInput.style.display = 'none';
            document.body.appendChild(uploadInput);
        }
    }
];
function setupNotesBtns(app) {
    createNotesBtnsAndTags();
    const addBtn = document.querySelector('.custom-add-btn');
    const addBtnContToggle = new ClassToggler('active', '.custom-add-note-btns');
    const addBtnToggle = new ClassToggler('active', addBtn, t => {
        addBtnContToggle.state = t.state;
    });
    addBtnToggle.setDismissible(true);
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
        if (app.currentSlideNotes && confirm(`Czy na pewno usunąć WSZYSTKIE (${app.currentSlideNotes.notes.length}) notatki ze slajdu ${app.currentSlideNotes.metadata.slide}?`))
            app.currentSlideNotes.removeAllNotes();
    });
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
        app.currentSlideNotes.commitChanges().then(() => {
            app.notesRendering.renderNotes(app.presentationMetadata.slideNumber);
        });
    });
    const viewNotesBtnToggle = new ClassToggler('active', viewNotesBtn, t => {
        hiddenBtnsToggle.state = !t.state;
        notesOverlayToggle.state = !viewTypeBtnToggle.state && t.state;
        noteColumnToggle.state = !(viewTypeBtnToggle.state && t.state);
    });
    const addNoteBtn = document.querySelector('.custom-add-note-btn');
    addNoteBtn.addEventListener('click', (ev) => {
        addBtnToggle.state = false;
        viewNotesBtnToggle.state = true;
        app.notesRendering.addNoteBtnHandler(ev);
    });
    viewNotesBtnToggle.state = app.tools && app.tools.getValue('useNotes');
    viewNotesBtn.addEventListener('click', () => viewNotesBtnToggle.toggle());
    Keyboard.registerShortcut({
        keys: ['n'], callback: () => viewNotesBtnToggle.toggle()
    });
    viewTypeBtn.addEventListener('click', () => viewTypeBtnToggle.toggle());
    Keyboard.registerShortcut({
        keys: ['v'], callback: () => viewTypeBtnToggle.toggle()
    });
    if (isMobile()) {
        viewNotesBtnToggle.state = true;
        viewTagsBtnToggle.state = true;
    }
    function addTag() {
        app.currentSlideNotes.addTag({
            content: '', color: app.notesRendering.getRandomTagColor(),
            presentationTitle: app.presentationMetadata.presentationName,
            slideTitle: app.presentationMetadata.slideTitle
        });
    }
}
///<reference path="common.ts" />
///<reference path="ChapterMetadata.ts" />
///<reference path="../App.ts" />
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
function addSlideOptions(app) {
    const bookmarkBtn = document.querySelector('.wnl-rounded-button.bookmark');
    if (!bookmarkBtn)
        return;
    const searchContainer = app.searchInSlideshow.getSearchContainer(true);
    app.searchInSlideshow.addEventListener('dissmiss', () => Toggles.search.state = false);
    app.searchInSlideshow.addEventListener('searchEnd', () => app.searchInSlideshow.searchInput.focus());
    document.querySelector('.order-number-container').after(searchContainer);
    const slideOptionsContainer = document.createElement('div');
    slideOptionsContainer.innerHTML = slideshowOptionsBtn;
    const additionalOptionsContainer = document.createElement('div');
    additionalOptionsContainer.className = 'custom-script-hidden custom-script-additional-options';
    additionalOptionsContainer.innerHTML = slideshowOptions;
    slideOptionsContainer.append(additionalOptionsContainer);
    bookmarkBtn.after(slideOptionsContainer);
    additionalOptionsContainer.prepend(bookmarkBtn);
    slideOptionsContainer.querySelector('.custom-options-btn').addEventListener('click', () => Toggles.optionsBtn.toggle());
    slideOptionsContainer.querySelector('.custom-search-btn').addEventListener('click', () => {
        Toggles.optionsBtn.state = false;
        Toggles.search.toggle();
    });
    slideOptionsContainer.querySelector('.custom-zoom-up-btn').addEventListener('click', () => {
        if (app.options) {
            app.options.setValue('percentIncrease', (v) => v + 5);
        }
    });
    slideOptionsContainer.querySelector('.custom-zoom-down-btn').addEventListener('click', () => {
        if (app.options) {
            app.options.setValue('percentIncrease', (v) => v - 5);
        }
    });
}
function addSummary(app) {
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'custom-script-summary custom-script-hidden';
    const closeBtn = document.createElement('div');
    closeBtn.className = 'custom-script-summary-close';
    closeBtn.innerHTML = SVGIcons.chevronUp;
    summaryContainer.prepend(closeBtn);
    closeBtn.addEventListener('click', () => Toggles.summary.state = false);
    app.slideshowChapters.render(summaryContainer);
    document.querySelector('.order-number-container').after(summaryContainer);
}
function addChapterInfo(app) {
    addPageNumberContainer();
    addSummary(app);
    app.slideshowChapters.addEventListener('activeChange', () => updateChapterProgress(app));
    app.slideshowChapters.setCurrentPage(app.slideNumber);
}
function updateChapterProgress(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const pageNumberContainer = document.querySelector(`.${"custom-script-page-number-container" /* CLASS_NAMES.pageNumberContainer */}`);
        if (!pageNumberContainer)
            return;
        const chapterPath = app.slideshowChapters.getProgress();
        if (chapterPath) {
            let progress;
            do {
                progress = chapterPath.pop();
            } while (chapterPath.length && progress.actualLength < 5);
            const relativeCurrentContainer = pageNumberContainer.querySelector(`.${"current-number" /* CLASS_NAMES.currentChapterPage */}`);
            relativeCurrentContainer.innerText = progress.current.toString();
            const chapterLengthContainer = pageNumberContainer.querySelector(`.${"n-of-pages" /* CLASS_NAMES.chapterLength */}`);
            chapterLengthContainer.innerText = progress.actualLength.toString();
        }
    });
}
function addPageNumberContainer() {
    const classNames = ["custom-script-page-number-container" /* CLASS_NAMES.pageNumberContainer */, "current-number" /* CLASS_NAMES.currentChapterPage */, '', "n-of-pages" /* CLASS_NAMES.chapterLength */];
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
    spans[0].addEventListener('click', () => Toggles.summary.toggle());
    return spans[0];
}
///<reference path="globals.d.ts" />
///<reference path="utils/enums.ts" />
///<reference path="utils/common.ts" />
///<reference path="utils/PresentationMetadata.ts" />
///<reference path="utils/CustomEventEmmiter.ts" />
///<reference path="utils/TabOpener.ts" />
///<reference path="utils/Options.ts" />
///<reference path="utils/Settings.ts" />
///<reference path="utils/CourseSidebar.ts" />
///<reference path="utils/tools.ts" />
///<reference path="utils/Keyboard.ts" />
///<reference path="utils/slideshowOptions.ts" />
class App extends CustomEventEmmiter {
    constructor() {
        super(...arguments);
        this._loaded = false;
        this.isAwaiting = false;
    }
    get loaded() {
        return this._loaded;
    }
    get slideNumber() {
        return this.presentationMetadata.slideNumber;
    }
    set slideNumber(value) {
        this.presentationMetadata.slideNumber = value;
    }
    onLoaded() {
        this.slideshowChapters = this.presentationMetadata.slideshowChapters;
        this.options.addSettings(getOptions(this));
        this.notesRendering = new NotesRendering(this);
        this.tools.addSettings(getToolsConfig(this));
        if (!this.appDiv) {
            this.appDiv = document.querySelector(".wnl-app-layout.wnl-course-layout" /* SELECTORS.appDiv */);
            if (!this.appDiv)
                return;
        }
        this.presentationMetadata.observe();
        this.presentationMetadata.addEventListener('slideChange', slide => this.trigger('slideChange', slide));
        this.tabOpener = new TabOpener(this);
        this.setBackground();
        this.searchInSlideshow = new SearchConstructor(this);
        this.searchInBottomContainer = new SearchConstructor(this);
        this.lessonView = document.querySelector(".wnl-lesson-view" /* SELECTORS.lessonView */);
        if (this.lessonView !== null) {
            this.addBottomContainer();
        }
        if (GM_getValue(`option_keyboardControl`))
            Keyboard.setupControl(this);
        addChapterInfo(this);
        addSlideOptions(this);
        this.addEventListener('slideChange', () => this.updateTabTitle());
        this._loaded = true;
        this.trigger('loaded');
        this.presentationMetadata.addEventListener('screenidChange', screenid => this.checkUnloaded());
        unsafeWindow.addEventListener('beforeunload', ev => {
            this.onUnload();
        });
    }
    setBackground() {
        const backgrounds = {
            image: "image-custom-background",
            white: "white-custom-background",
            black: "dark-custom-background",
            custom: "custom-script-background-color"
        };
        const theme = this.options.getValue('changeTheme');
        if (theme === 'default')
            return;
        const backgroundClasses = Object.values(backgrounds);
        const backgroundEl = document.querySelector(backgroundClasses.map(s => `.${s}`).join(','));
        if (backgroundEl !== null) {
            backgroundEl.classList.remove(...backgroundClasses);
            backgroundEl.classList.add(backgrounds[theme]);
        }
    }
    addBottomContainer() {
        this.bottomContainer = document.createElement('div');
        this.bottomContainer.className = "custom-script-bottom-container" /* CLASS_NAMES.bottomContainer */;
        this.addSliderContainer();
        // this.addTagListContainer()
        this.bottomContainer.append(this.searchInBottomContainer.getSearchContainer(false));
        this.addToolsContainer();
        this.addSettingsContainer();
        this.lessonView.append(this.bottomContainer);
    }
    addTagListContainer() {
        const tagListContainer = document.createElement('div');
        tagListContainer.style.order = '-1';
        tagListContainer.className = "custom-tagListContainer" /* CLASS_NAMES.tagListContainer */;
        tagListContainer.innerHTML = `
            <span class='custom-heading'>
                ${SVGIcons.tags}
                <span class='metadata'>tagi</span>
            </span>
            <div class=${"custom-tagList" /* CLASS_NAMES.tagList */}></div>`;
        this.bottomContainer.append(tagListContainer);
    }
    setupObserveSidenav() {
        if (this.sidenavObserver)
            return;
        function findSideNav(nodeList) {
            if (nodeList) {
                for (const node of nodeList) {
                    if (node.classList &&
                        node.classList.contains('wnl-sidenav-slot')) {
                        return node;
                    }
                }
            }
        }
        this.sidenavObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (findSideNav(mutation.addedNodes))
                    this.trigger('sidenavOpened', true);
                if (findSideNav(mutation.removedNodes))
                    this.trigger('sidenavOpened', false);
            }
        });
        this.sidenavObserver.observe(this.appDiv, { childList: true });
        this.addEventListener('unloaded', () => this.sidenavObserver.disconnect());
    }
    updateTabTitle() {
        if (this.options.getValue('changeTitle') && this.presentationMetadata) {
            let mainTitle;
            mainTitle = this.presentationMetadata.presentationName;
            mainTitle = mainTitle && mainTitle.match(/\w/) ? `${mainTitle} - ` : '';
            let slideTitle = this.presentationMetadata.slideTitle;
            slideTitle = slideTitle && slideTitle.match(/\w/) ? `${slideTitle} - ` : '';
            const originalTitle = this.originalTitle || 'LEK - Kurs - Więcej niż LEK';
            document.title = slideTitle + mainTitle + originalTitle;
        }
    }
    addSliderContainer() {
        const test = document.querySelector(`input.${"custom-script-font-size-input" /* CLASS_NAMES.fontSizeInput */}`);
        if (test)
            return;
        const sliderContainer = document.createElement('div');
        sliderContainer.innerHTML = zoomSliderHTML;
        sliderContainer.className = "custom-script-zoom-slider-container" /* CLASS_NAMES.zoomSliderContainer */;
        this.bottomContainer.appendChild(sliderContainer);
        sliderContainer.querySelector(`input.${"custom-script-font-size-input" /* CLASS_NAMES.fontSizeInput */}`)
            .addEventListener('input', e => document.querySelector(`.${"custom-script-font-size-label" /* CLASS_NAMES.fontSizeLabel */}`).innerText = `${e.target.value}%`);
        sliderContainer.querySelector(`.${"custom-script-font-size-input" /* CLASS_NAMES.fontSizeInput */}-increase`)
            .addEventListener('click', () => {
            this.options.setValue('percentIncrease', (state) => state + 5);
        });
        sliderContainer.querySelector(`.${"custom-script-font-size-input" /* CLASS_NAMES.fontSizeInput */}-decrease`)
            .addEventListener('click', () => {
            this.options.setValue('percentIncrease', (state) => state - 5);
        });
    }
    addToolsContainer() {
        const test = document.querySelector(`.${"custom-script-tools-container" /* CLASS_NAMES.toolsContainer */}`);
        if (test)
            return;
        const toolsContainer = document.createElement('div');
        toolsContainer.classList.add("custom-script-tools-container" /* CLASS_NAMES.toolsContainer */);
        toolsContainer.innerHTML = `
            <span class='custom-heading'>
                ${SVGIcons.tools}
                <span class="metadata">narzędzia</span>
            </span>
            <div></div>`;
        this.bottomContainer.appendChild(toolsContainer);
        toolsContainer.append(this.tools.render());
    }
    addSettingsContainer() {
        const test = document.querySelector(`.${"custom-script-settings-container" /* CLASS_NAMES.settingsContainer */}`);
        if (test)
            return;
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add("custom-script-settings-container" /* CLASS_NAMES.settingsContainer */);
        optionsContainer.innerHTML = `
            <span class='custom-heading'>
                ${SVGIcons.gear}
                <span class="metadata">ustawienia</span>
            </span>
            <div></div>`;
        this.bottomContainer.appendChild(optionsContainer);
        optionsContainer.append(this.options.render());
        const pIncr = this.options.getSetting('percentIncrease');
        pIncr.lowerLimit = 60;
        pIncr.upperLimit = 200;
    }
    init() {
        this.options = new Settings(this);
        this.tools = new Settings(this);
        this.awaitLoad();
        this.appDiv = document.querySelector(".wnl-app-layout.wnl-course-layout" /* SELECTORS.appDiv */);
        this.presentationMetadata = new PresentationMetadata(this);
    }
    awaitLoad() {
        let checkLoadedInterval;
        this.isAwaiting = true;
        checkLoadedInterval = setInterval(() => {
            const testExtensionLoaded = document.querySelector(`.${"custom-script-page-number-container" /* CLASS_NAMES.pageNumberContainer */}`);
            if (testExtensionLoaded) {
                this.isAwaiting = false;
                clearInterval(checkLoadedInterval);
                return;
            }
            const testSlideshowLoaded = document.querySelector('.order-number-container');
            if (testSlideshowLoaded) {
                this.isAwaiting = false;
                clearInterval(checkLoadedInterval);
                this.onLoaded();
            }
        }, 300);
    }
    checkUnloaded() {
        const testExtensionLoaded = document.querySelector(`.${"custom-script-page-number-container" /* CLASS_NAMES.pageNumberContainer */}`);
        if (!this.isAwaiting && !testExtensionLoaded) {
            this.onUnload();
            this.awaitLoad();
        }
    }
    onUnload() {
        this._loaded = false;
        this.trigger('unloaded');
        if (this.options && this.options.getValue('changeTitle')) {
            document.title = this.originalTitle;
        }
        if (this.currentSlideNotes) {
            this.currentSlideNotes.commitChanges().then(() => {
                this.notesCollection = undefined;
                this.currentSlideNotes = undefined;
            });
        }
        this.presentationMetadata.removeAllListeners('slideChange');
        if (this.slideObserver)
            this.slideObserver.disconnect();
    }
}
///<reference path="packageMetadata.ts" />
///<reference path="globals.d.ts" />
///<reference path="App.ts" />
(function () {
    'use strict';
    try {
        //@ts-ignore
        __SENTRY__.hub.getClient().getOptions().enabled = false;
    }
    catch (err) { }
    if (unsafeWindow.top != unsafeWindow.self) {
        return; //in iframe
    }
    const app = new App();
    app.init();
    console.log({ app });
})();
