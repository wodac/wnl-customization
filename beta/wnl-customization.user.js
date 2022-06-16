class CustomEventEmmiter{constructor(){this.listeners={}}addEventListener(t,n,e){if(this.listeners[t]||(this.listeners[t]=[]),e){const s=e=>{n.bind(this)(e),this.removeEventListener(t,s)};this.listeners[t].push(s)}else this.listeners[t].push(n)}removeEventListener(e,t){var n;if(this.listeners[e])return n=this.listeners[e].findIndex(e=>e==t),0<=n?this.listeners[e].splice(n,1)[0]:void 0}removeAllListeners(e){e?this.listeners[e]=[]:this.listeners={}}trigger(n,s={}){setTimeout(()=>{this.listeners[n]&&this.listeners[n].forEach(t=>{try{t.bind(this)(s)}catch(e){console.error("triggering",n,"with data",s,"on",this,"with callback",t,`(${t.toString()})`)}})},0)}}var TabOpenerIndexes,Toggles,SettingType,Notes,Keyboard,__awaiter=this&&this.__awaiter||function(e,o,r,l){return new(r=r||Promise)(function(n,t){function s(e){try{a(l.next(e))}catch(e){t(e)}}function i(e){try{a(l.throw(e))}catch(e){t(e)}}function a(e){var t;e.done?n(e.value):((t=e.value)instanceof r?t:new r(function(e){e(t)})).then(s,i)}a((l=l.apply(e,o||[])).next())})};class ChapterListElement extends CustomEventEmmiter{constructor(e,t){super(),this.metadata=e,this.parent=t,e.children&&(this.children=e.children.map(e=>new ChapterListElement(e,t))),this.active=!1}get active(){return this._active}set active(e){this._active=e,this.trigger("activeChange",e),this.activeToggler&&(this.activeToggler.state=e)}getHTML(){return`<a class='custom-script-summary-link' href='${this.metadata.href}'>
           <span>${this.metadata.name} </span>
           <span class='small'>(${this.metadata.chapterLength})</span>
        </a>`}render(){if(this.element=document.createElement("div"),this.element.classList.add("custom-script-summary-link-container"),this.element.innerHTML=this.getHTML(),this.children){const n=document.createElement("ul");var e=this.children.map(e=>{const t=document.createElement("li");return t.append(e.render()),t});n.append(...e),this.element.append(n)}this.activeToggler=new ClassToggler("active",this.element);const t=this.element.querySelector("a");return t.addEventListener("click",e=>{e.preventDefault(),this.parent.app.slideNumber=this.metadata.startPage}),this.trigger("rendered"),this.element}}class SlideshowChapters extends CustomEventEmmiter{constructor(e){super(),this.app=e}render(e){return __awaiter(this,void 0,void 0,function*(){if(yield this.getMetadata(),!this._rendered&&this.chapterMetadata)return this.element=document.createElement("div"),this.chapterElements=this.chapterMetadata.map(e=>{return new ChapterListElement(e,this)}),this.element.append(...this.chapterElements.map(e=>e.render())),e&&e.append(this.element),this._rendered=!0,this.trigger("rendered"),setTimeout(()=>this.setCurrentPage(this.app.slideNumber),0),this.element})}getProgress(){if(this.currentChapterPath)return this.currentChapterPath.map(e=>Object.assign(Object.assign({},e.metadata),{current:this.currentPage-e.metadata.startPage+1,actualLength:e.metadata.endPage-e.metadata.startPage+1}))}setCurrentPage(t){if(this.chapterElements&&!(!t||t<1||t>this.slideCount)){this.currentPage=t,this.currentChapterPath&&this.currentChapterPath.forEach(e=>e.active=!1),this.currentChapterPath=[];let e=s(this.chapterElements);if(!e)return[];for(var n;;){if(this.currentChapterPath.push(e),!(n=e.children))break;if(!(e=s(n)))break}return this.scrollIntoView&&e&&e.element.scrollIntoView({behavior:"smooth"}),this.trigger("activeChange",{path:this.currentChapterPath}),this.currentChapterPath.forEach(e=>e.active=!0),this.currentChapterPath;function s(e){return e.find(e=>e.metadata.startPage<=t&&e.metadata.endPage>=t)}}}getEndPages(t,e){let n=e,s;for(let e=t.length-1;0<=e;e--)s&&(n=s.startPage-1),(s=t[e]).endPage=n,s.children&&(s.children=this.getEndPages(s.children,s.endPage));return t}openMenu(){const e=document.querySelector(".topNavContainer__beforeLogo.topNavContainer__megaMenuMobileEntryPoint");e&&(e.click(),this.menuOpened=!0)}getMetadata(){return __awaiter(this,void 0,void 0,function*(){if(this.chapterMetadata)return this.chapterMetadata;const e=yield this.getMenu();if(e){var t=e.querySelector(".item-wrapper.is-active");if(t){this.slideCount=this.getSlideCount(t);t=t.parentElement;if(t){const n=Array.from(t.children);if(this.menuOpened&&this.closeMenu(),0!==n.length){var t=n.filter(e=>"DIV"===e.nodeName);if(0!==t.length)return t=this.getMetadataFromLinks(t),this.chapterMetadata=this.getEndPages(t,this.slideCount),this.trigger("dataRetrieved",this.chapterMetadata),this.chapterMetadata}}}}})}closeMenu(){document.querySelector(".topNavContainer__close").click()}getSlideCount(e){const t=e.querySelector("span span.sidenav-item-meta").innerText;return parseInt(t.slice(1,-1))}getMetadataFromLinks(i){const e=i.map(e=>e.querySelector("a"));return e.map((e,t)=>{if(!e.href)return{};var n=this.getSlideCount(e);let s;t=i[t].querySelectorAll("div");return t.length&&(s=this.getMetadataFromLinks(Array.from(t))),{href:e.href,name:e.querySelector("span span").innerText,chapterLength:n,children:s,startPage:parseInt(e.href.split("/").pop())}})}getMenu(){return __awaiter(this,void 0,void 0,function*(){return new Promise(e=>{var t=document.querySelector("aside.sidenav-aside");t?e(t):this.menuOpened?e(!1):(this.openMenu(),setTimeout(()=>e(this.getMenu()),100))})})}}class PresentationMetadata extends CustomEventEmmiter{constructor(e){super(),this.app=e,this.createObserver(),this.slideshowChapters=new SlideshowChapters(e)}observe(){this.observer.observe(this.appDiv,{attributes:!0}),this.addEventListener("slideChange",e=>this.slideshowChapters.setCurrentPage(e))}get appDiv(){return document.querySelector(".wnl-app-layout.wnl-course-layout")}getAttrVal(e){const t=document.querySelector(`[${e}]`);e=t&&t.attributes.getNamedItem(e);return e?e.value:null}get slideNumber(){var e=this.getAttrVal("slide");return parseInt(e)}set slideNumber(e){const t=document.querySelector(".wnl-slideshow-controls input[type=number]");if(!t)throw Error("Unable to set slide number!");t.value=e.toString(),t.dispatchEvent(new InputEvent("input"))}get screenID(){return parseInt(this.getAttrVal("screenid"))}get presentationName(){const e=document.querySelector(".o-lesson__title__left__header");return e&&e.textContent&&e.textContent.trim()}get slideTitle(){const e=document.querySelector(".present .sl-block-content h2");return e&&e.textContent&&e.textContent.trim()}get lessonID(){return parseInt(this.getAttrVal("lesson-id"))}createObserver(){this.observer=new MutationObserver(e=>{for(const n of e){var t=this.getAttrFromMutation(n);switch(n.attributeName){case"screenid":this.trigger("screenidChange",parseInt(t));break;case"slide":this.trigger("slideChange",parseInt(t))}}})}getAttrFromMutation(e){e=e.target.attributes.getNamedItem(e.attributeName);return e?e.value:null}stopObserving(){this.observer.disconnect()}}!function(e){e[e.noAction=-1]="noAction",e[e.findTab=-2]="findTab"}(TabOpenerIndexes=TabOpenerIndexes||{});class TabOpener extends CustomEventEmmiter{constructor(e){super(),this.app=e,this.getTabIndex(),this.setInitialStoreVal(),GM_addValueChangeListener("openInTab",(e,t,n,s)=>{s&&0<=n.currentTab&&this.trigger("remoteOpenRequest",n),this.openSlide(n)})}get tabIndex(){return this._tabIndex}getTabIndex(){return __awaiter(this,void 0,void 0,function*(){const e=yield this.getTabs();let t=0;e&&(e.forEach(e=>{e&&e.index>t&&(t=e.index)}),t++),GM_saveTab({index:t}),this._tabIndex=t})}getTabs(){return new Promise(t=>{GM_getTabs(e=>t(Object.values(e)))})}focusThisTab(){if(document.hidden){const e=GM_openInTab("about:blank",{active:!0,setParent:!0});setTimeout(()=>e.close(),0)}}openURLinTab(e){return GM_openInTab(e,{active:!0,setParent:!0})}setInitialStoreVal(){GM_setValue("openInTab",{lessonID:this.app.presentationMetadata.lessonID,screenID:this.app.presentationMetadata.screenID,slide:this.app.presentationMetadata.slideNumber,currentTab:-1})}findTabToOpen(n){return __awaiter(this,void 0,void 0,function*(){const e=yield this.getTabs();let t=1e3;e.forEach(e=>{e&&e.index>n.currentTab&&e.index<t&&(t=e.index)}),1e3===t&&(t=-1,this.openURLinTab(this.generateURL(n))),n.currentTab=t,GM_setValue("openInTab",n)})}generateURL(e){const t=[WNL_LESSON_LINK,e.lessonID,e.screenID,e.slide];return t.join("/")}openSlide(e){e&&("number"!=typeof e.currentTab&&(e.currentTab=TabOpenerIndexes.findTab),e.currentTab!==TabOpenerIndexes.noAction&&(this.isSlideInCurrentSlideshow(e)?(this.focusThisTab(),this.app.presentationMetadata.slideNumber=e.slide,this.setInitialStoreVal()):e.currentTab!==TabOpenerIndexes.findTab&&e.currentTab!==this.tabIndex||this.findTabToOpen(e)))}isSlideInCurrentSlideshow(e){return e.lessonID===this.app.presentationMetadata.lessonID&&e.screenID===this.app.presentationMetadata.screenID&&e.slide}}document=unsafeWindow.document;const WNL_LESSON_LINK="https://lek.wiecejnizlek.pl/app/courses/1/lessons",inSVG=e=>`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">${e[0]}</svg>`,SVGIcons={chevronUp:inSVG`<path fill-rule="evenodd" d="M7.776 5.553a.5.5 0 0 1 .448 0l6 3a.5.5 0 1 1-.448.894L8 6.56 2.224 9.447a.5.5 0 1 1-.448-.894l6-3z"/>`,dots:inSVG`<path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>`,search:inSVG`<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>`,zoomIn:inSVG`<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
    <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
    <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/>`,zoomOut:inSVG`<path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
    <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
    <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>`,stickies:inSVG`<path d="M1.5 0A1.5 1.5 0 0 0 0 1.5V13a1 1 0 0 0 1 1V1.5a.5.5 0 0 1 .5-.5H14a1 1 0 0 0-1-1H1.5z"/>
    <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v11A1.5 1.5 0 0 0 3.5 16h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 16 9.586V3.5A1.5 1.5 0 0 0 14.5 2h-11zM3 3.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V9h-4.5A1.5 1.5 0 0 0 9 10.5V15H3.5a.5.5 0 0 1-.5-.5v-11zm7 11.293V10.5a.5.5 0 0 1 .5-.5h4.293L10 14.793z"/>`,stickiesFill:inSVG`<path d="M0 1.5V13a1 1 0 0 0 1 1V1.5a.5.5 0 0 1 .5-.5H14a1 1 0 0 0-1-1H1.5A1.5 1.5 0 0 0 0 1.5z"/>
    <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v11A1.5 1.5 0 0 0 3.5 16h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 16 9.586V3.5A1.5 1.5 0 0 0 14.5 2h-11zm6 8.5a1 1 0 0 1 1-1h4.396a.25.25 0 0 1 .177.427l-5.146 5.146a.25.25 0 0 1-.427-.177V10.5z"/>`,plusSquare:inSVG`<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>`,trash:inSVG`<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>`,move:inSVG`<path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10zM.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708l-2-2zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8z"/>`,eraserFill:inSVG`<path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z"/>`,viewList:inSVG`<path d="M3 4.5h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H3zM1 2a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 2zm0 12a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 14z"/>`,layoutChaotic:inSVG`<path d="M5 1v8H1V1h4zM1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm13 2v5H9V2h5zM9 1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9zM5 13v2H3v-2h2zm-2-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3zm12-1v2H9v-2h6zm-6-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H9z"/>`,viewStack:inSVG`<path d="M3 0h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3zm0 8h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H3z"/>`,removeCircle:inSVG`<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>`,plusCircle:inSVG`<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>`,tags:inSVG`<path d="M3 2v4.586l7 7L14.586 9l-7-7H3zM2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2z"/>
    <path d="M5.5 5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM1 7.086a1 1 0 0 0 .293.707L8.75 15.25l-.043.043a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 0 7.586V3a1 1 0 0 1 1-1v5.086z"/>`,tagsFill:inSVG`<path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2zm3.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
    <path d="M1.293 7.793A1 1 0 0 1 1 7.086V2a1 1 0 0 0-1 1v4.586a1 1 0 0 0 .293.707l7 7a1 1 0 0 0 1.414 0l.043-.043-7.457-7.457z"/>`,addTag:inSVG`<path d="m2.7323 2.684v4.586l7 7 4.586-4.586-7-7zm-1 0a1 1 0 0 1 1-1h4.586a1 1 0 0 1 0.707 0.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7a1 1 0 0 1-0.293-0.707z"/>
    <path d="m8.0118 6.3688c0.27243 0 0.49328 0.22085 0.49328 0.49328v0.56847h0.68583c0.65771 0 0.65771 0.98657 0 0.98657h-0.68583v0.67116c0 0.65771-0.98657 0.65771-0.98657 0v-0.67116h-0.64182c-0.65771 0-0.65771-0.98657 0-0.98657h0.64182v-0.56847c0-0.27243 0.22085-0.49328 0.49328-0.49328z" stroke-width=".99963"/>
    <ellipse cx="8" cy="8" rx="2.25" ry="2.25" fill="none" opacity="1" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"/>`,pallete:inSVG`<path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
    <path d="M16 8c0 3.15-1.866 2.585-3.567 2.07C11.42 9.763 10.465 9.473 10 10c-.603.683-.475 1.819-.351 2.92C9.826 14.495 9.996 16 8 16a8 8 0 1 1 8-8zm-8 7c.611 0 .654-.171.655-.176.078-.146.124-.464.07-1.119-.014-.168-.037-.37-.061-.591-.052-.464-.112-1.005-.118-1.462-.01-.707.083-1.61.704-2.314.369-.417.845-.578 1.272-.618.404-.038.812.026 1.16.104.343.077.702.186 1.025.284l.028.008c.346.105.658.199.953.266.653.148.904.083.991.024C14.717 9.38 15 9.161 15 8a7 7 0 1 0-7 7z"/>`,minusCircle:inSVG`<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>`,stopwatch:inSVG`<path d="M8.5 5.6a.5.5 0 1 0-1 0v2.9h-3a.5.5 0 0 0 0 1H8a.5.5 0 0 0 .5-.5V5.6z"/>
    <path d="M6.5 1A.5.5 0 0 1 7 .5h2a.5.5 0 0 1 0 1v.57c1.36.196 2.594.78 3.584 1.64a.715.715 0 0 1 .012-.013l.354-.354-.354-.353a.5.5 0 0 1 .707-.708l1.414 1.415a.5.5 0 1 1-.707.707l-.353-.354-.354.354a.512.512 0 0 1-.013.012A7 7 0 1 1 7 2.071V1.5a.5.5 0 0 1-.5-.5zM8 3a6 6 0 1 0 .001 12A6 6 0 0 0 8 3z"/>`,chat:inSVG`<path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>`,capitalT:inSVG`<path d="M12.258 3h-8.51l-.083 2.46h.479c.26-1.544.758-1.783 2.693-1.845l.424-.013v7.827c0 .663-.144.82-1.3.923v.52h4.082v-.52c-1.162-.103-1.306-.26-1.306-.923V3.602l.431.013c1.934.062 2.434.301 2.693 1.846h.479L12.258 3z"/>`,keyboard:inSVG`<path d="M14 5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h12zM2 4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H2z"/>
    <path d="M13 10.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm0-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-5 0A.25.25 0 0 1 8.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 8 8.75v-.5zm2 0a.25.25 0 0 1 .25-.25h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5a.25.25 0 0 1-.25-.25v-.5zm1 2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-5-2A.25.25 0 0 1 6.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 6 8.75v-.5zm-2 0A.25.25 0 0 1 4.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 4 8.75v-.5zm-2 0A.25.25 0 0 1 2.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 2 8.75v-.5zm11-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-2 0a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm-2 0A.25.25 0 0 1 9.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 9 6.75v-.5zm-2 0A.25.25 0 0 1 7.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 7 6.75v-.5zm-2 0A.25.25 0 0 1 5.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 5 6.75v-.5zm-3 0A.25.25 0 0 1 2.25 6h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5A.25.25 0 0 1 2 6.75v-.5zm0 4a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zm2 0a.25.25 0 0 1 .25-.25h5.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-5.5a.25.25 0 0 1-.25-.25v-.5z"/>`,fileRichText:inSVG`<path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
    <path d="M4.5 12.5A.5.5 0 0 1 5 12h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm1.639-3.708 1.33.886 1.854-1.855a.25.25 0 0 1 .289-.047l1.888.974V8.5a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V8s1.54-1.274 1.639-1.208zM6.25 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"/>`,chevronExpand:inSVG`<path fill-rule="evenodd" d="M3.646 9.146a.5.5 0 0 1 .708 0L8 12.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708zm0-2.292a.5.5 0 0 0 .708 0L8 3.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708z"/>`,bell:inSVG`<path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>`,type:inSVG`<path d="m2.244 13.081.943-2.803H6.66l.944 2.803H8.86L5.54 3.75H4.322L1 13.081h1.244zm2.7-7.923L6.34 9.314H3.51l1.4-4.156h.034zm9.146 7.027h.035v.896h1.128V8.125c0-1.51-1.114-2.345-2.646-2.345-1.736 0-2.59.916-2.666 2.174h1.108c.068-.718.595-1.19 1.517-1.19.971 0 1.518.52 1.518 1.464v.731H12.19c-1.647.007-2.522.8-2.522 2.058 0 1.319.957 2.18 2.345 2.18 1.06 0 1.716-.43 2.078-1.011zm-1.763.035c-.752 0-1.456-.397-1.456-1.244 0-.65.424-1.115 1.408-1.115h1.805v.834c0 .896-.752 1.525-1.757 1.525z"/>`,import:inSVG`<path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/>
    <path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>`,export:inSVG`<path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/>
    <path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V10.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708l3-3z"/>`,code:inSVG`<path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>`,tools:inSVG`<path d="M1 0 0 1l2.2 3.081a1 1 0 0 0 .815.419h.07a1 1 0 0 1 .708.293l2.675 2.675-2.617 2.654A3.003 3.003 0 0 0 0 13a3 3 0 1 0 5.878-.851l2.654-2.617.968.968-.305.914a1 1 0 0 0 .242 1.023l3.27 3.27a.997.997 0 0 0 1.414 0l1.586-1.586a.997.997 0 0 0 0-1.414l-3.27-3.27a1 1 0 0 0-1.023-.242L10.5 9.5l-.96-.96 2.68-2.643A3.005 3.005 0 0 0 16 3c0-.269-.035-.53-.102-.777l-2.14 2.141L12 4l-.364-1.757L13.777.102a3 3 0 0 0-3.675 3.68L7.462 6.46 4.793 3.793a1 1 0 0 1-.293-.707v-.071a1 1 0 0 0-.419-.814L1 0Zm9.646 10.646a.5.5 0 0 1 .708 0l2.914 2.915a.5.5 0 0 1-.707.707l-2.915-2.914a.5.5 0 0 1 0-.708ZM3 11l.471.242.529.026.287.445.445.287.026.529L5 13l-.242.471-.026.529-.445.287-.287.445-.529.026L3 15l-.471-.242L2 14.732l-.287-.445L1.268 14l-.026-.529L1 13l.242-.471.026-.529.445-.287.287-.445.529-.026L3 11Z"/>`,gear:inSVG`<path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>`,palette2:inSVG`<path d="M0 .5A.5.5 0 0 1 .5 0h5a.5.5 0 0 1 .5.5v5.277l4.147-4.131a.5.5 0 0 1 .707 0l3.535 3.536a.5.5 0 0 1 0 .708L10.261 10H15.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5H3a2.99 2.99 0 0 1-2.121-.879A2.99 2.99 0 0 1 0 13.044m6-.21 7.328-7.3-2.829-2.828L6 7.188v5.647zM4.5 13a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0zM15 15v-4H9.258l-4.015 4H15zM0 .5v12.495V.5z"/>
    <path d="M0 12.995V13a3.07 3.07 0 0 0 0-.005z"/>`},zoomSliderHTML=`
        <span class='custom-heading'>
            ${SVGIcons.zoomIn}
            <label class="metadata">POWIĘKSZENIE</label>
        </span>
        <div style="text-align: right;">
            <input class="custom-script-font-size-input" 
                type="range" size="3" maxlength="3" min="70" max="200" 
                step="5">
            <a class="custom-script-font-size-input-decrease">${SVGIcons.zoomOut}</a>
            <span class="custom-script-font-size-label">120%</span>
            <a class="custom-script-font-size-input-increase">${SVGIcons.zoomIn}</a>
        </div>`;function toggleBodyClass(e,t){let n=document.body;t?n.classList.add(e):n.classList.remove(e)}function getForegroundColor(e){if(6!==(e=3===(e=0===e.indexOf("#")?e.slice(1):e).length?e[0]+e[0]+e[1]+e[1]+e[2]+e[2]:e).length)throw new Error("Invalid HEX color.");return 186<.299*parseInt(e.slice(0,2),16)+.587*parseInt(e.slice(2,4),16)+.114*parseInt(e.slice(4,6),16)?"#000000":"#FFFFFF"}function getRandomElement(e){var t;if(e&&e.length)return t=Math.random()*e.length,e[Math.floor(t)]}const getUniformFontSize=e=>.01*(e-100)+.93,root=unsafeWindow.document.querySelector(":root"),updateFontSize=e=>{root.style.setProperty("--uniform-font-size",getUniformFontSize(e)+"em"),root.style.setProperty("--scaled-font-size",e+"%")};function isMobile(){return screen.width<980}class ClassToggler extends CustomEventEmmiter{constructor(e,t=document.body,n){super(),this.className=e,this._elementOrSelector=t,this.onchange=n,this._unresolved=!0,this.invert=!1,this._waitForClick=()=>this.waitForClick()}_getClassState(){this.invert?this._state=!this.element.classList.contains(this.className):this._state=this.element.classList.contains(this.className),this._unresolved=!1}get element(){return"string"==typeof this._elementOrSelector?document.querySelector(this._elementOrSelector):this._elementOrSelector}get state(){return this._unresolved&&this._getClassState(),this._state}set state(e){this._unresolved&&this._getClassState(),this._state!==e&&(this._state=e,this.onchange&&this.onchange(this),this.invert?this.element&&this.element.classList[e?"remove":"add"](this.className):this.element&&this.element.classList[e?"add":"remove"](this.className),this.trigger("stateChange",e))}flash(e=1e3){this._state||(this.state=!0,setTimeout(()=>this.state=!1,e))}toggle(){this.state=!this.state}waitForClick(){const e=e=>{this.state=!1,n()},t=e=>{e.stopPropagation()},n=()=>{document.body.removeEventListener("click",e),this.element&&this.element.removeEventListener("click",t)};this.state?(document.body.addEventListener("click",e),this.element&&this.element.addEventListener("click",t)):n()}setDismissible(e){e?this.addEventListener("stateChange",this._waitForClick):this.removeEventListener("stateChange",this._waitForClick)}}function downloadFile(e,t,n){let s;s="string"==typeof n?n:n.toString();n=`data:${e};charset=utf-8,`+encodeURIComponent(s);let i=document.getElementById("downloadAnchorElem");i||((i=document.createElement("a")).id="downloadAnchorElem",i.style.display="none",document.body.append(i)),i.setAttribute("href",n),i.setAttribute("download",t),i.click()}function toggleFullscreen(){setTimeout(()=>document.dispatchEvent(new KeyboardEvent("keydown",{key:"f",altKey:!1,bubbles:!0,cancelable:!0,charCode:0,code:"KeyF",composed:!0,ctrlKey:!1,detail:0,isComposing:!1,keyCode:70,location:0,metaKey:!1,repeat:!1,shiftKey:!1})),10)}function getIndexedDB(n,i,a){return new Promise((s,t)=>{var e=indexedDB.open(n,i);e.addEventListener("error",e=>{t("Unable to open database")}),e.addEventListener("upgradeneeded",function(e){const t=this.result,n=a(e,t);n.transaction.addEventListener("complete",function(){s(t)})}),e.addEventListener("success",function(){const e=this.result;e.onerror=e=>{console.error("Database error: "+e.target.errorCode)},s(e)})})}!function(e){e.summary=new ClassToggler("custom-script-hidden",".custom-script-summary",e=>{if(!e.state){const t=document.querySelector("custom-script-summary");if(t){t.classList.remove("custom-script-hidden");const n=t.querySelector(".active");n&&n.scrollIntoView({behavior:"smooth"})}}}),e.summary.invert=!0,e.summary.setDismissible(!0),e.search=new ClassToggler("custom-script-hidden",".custom-script-search",e=>{e.state&&setTimeout(()=>{document.querySelector(".slideshow-container input.custom-search-result").focus()},100)}),e.search.invert=!0,e.search.setDismissible(!0);const t=new ClassToggler("custom-script-hidden",".custom-script-additional-options");t.invert=!0,e.optionsBtn=new ClassToggler("active","a.custom-options-btn",e=>{t.state=e.state}),e.optionsBtn.setDismissible(!0)}(Toggles=Toggles||{});const getOptions=n=>[{name:"increaseFontSize",type:SettingType.Checkbox,desc:"Zwiększ wielkość czcionki",icon:{emoji:"🔎",html:SVGIcons.zoomIn},onchange:function(e){e.value&&this.parent.setValue("uniformFontSize",!1),toggleBodyClass("custom-script-increase-font-size",e.value)},defaultValue:!0,key:"f"},{name:"increaseAnnotations",icon:{emoji:"📄",html:SVGIcons.fileRichText},desc:"Zwiększ wielkość czcionki w przypisach",type:SettingType.Checkbox,onchange:e=>toggleBodyClass("custom-script-increase-annotations",e.value),defaultValue:!1,key:"a"},{name:"uniformFontSize",icon:{emoji:"🔤",html:SVGIcons.type},desc:"Ujednolicona wielkość czcionki",type:SettingType.Checkbox,onchange:function(e){e.value&&this.parent.setValue("increaseFontSize",!1),toggleBodyClass("custom-script-uniform-font-size",e.value)},defaultValue:!1,key:"u"},{name:"percentIncrease",type:SettingType.Percent,icon:{emoji:"➕",html:SVGIcons.zoomIn},desc:"Zmień powiększenie",isInRange:e=>NaN!==e&&10<e&&e<300,defaultValue:110,onchange:e=>{updateFontSize(e.value);const t=document.querySelector("input.custom-script-font-size-input"),n=document.querySelector(".custom-script-font-size-label");t&&(t.value=e.value.toString(),t.title=e.value.toString()),n&&(n.innerText=e.value+"%")},onrender:function(){const n=document.querySelector("input.custom-script-font-size-input"),e=document.querySelector(".custom-script-font-size-label");var t;n&&(n.value=this.value.toString(),e.innerText=this.value+"%",n.addEventListener("change",e=>{var t=parseInt(n.value);this.value=t}),t=()=>{var e=n.value;updateFontSize(parseInt(e))},n.addEventListener("input",t),this.addEventListener("input",t));const s=e=>{this.value+=e};Keyboard.registerShortcut({keys:["-"],callback:()=>s(-5)}),Keyboard.registerShortcut({keys:["+","="],callback:()=>s(5)})},key:"p"},{type:SettingType.Divider},{name:"hideChat",icon:{emoji:"💬",html:SVGIcons.chat},desc:"Ukryj czat",type:SettingType.Checkbox,onchange:e=>toggleBodyClass("custom-script-hide-chat",e.value),defaultValue:!1,key:"c"},{name:"hideSlideNav",icon:{emoji:"↔️",html:SVGIcons.code},desc:"Ukryj strzałki nawigacji na slajdach",type:SettingType.Checkbox,defaultValue:!1,onchange:e=>toggleBodyClass("custom-script-slide-nav-chat",e.value)},{name:"showMainCourseSidebar",icon:{emoji:"📗",html:SVGIcons.viewStack},desc:"Pokaż nawigację całego kursu w panelu bocznym",type:SettingType.Checkbox,defaultValue:!1,onchange:e=>{function t(){n.courseSidebar=new CourseSidebar;var e=document.querySelector("aside.course-sidenav");e&&!document.querySelector(".wnl-sidenav-detached")?n.courseSidebar.attach(e):(n.setupObserveSidenav(),n.addEventListener("sidenavOpened",e=>{e&&(e=document.querySelector("aside.course-sidenav"),n.courseSidebar.attach(e))})),n.courseSidebar.addEventListener("urlChange",e=>{n.tabOpener.openSlide(e)})}e.value?(n.courseSidebar||(t(),n.addEventListener("unloaded",()=>n.courseSidebar.destroy())),n.addEventListener("loaded",t),n.courseSidebar.show()):(n.removeEventListener("loaded",t),n.courseSidebar&&n.courseSidebar.hide())}},{type:SettingType.Divider},{name:"keyboardControl",icon:{emoji:"⌨️",html:SVGIcons.keyboard},desc:"Sterowanie klawiaturą",type:SettingType.Checkbox,onchange:e=>{e.value?Keyboard.setupControl(n):(document.querySelectorAll("sub.small").forEach(e=>e.remove()),Keyboard.disableControl(),n.slideObserver&&n.slideObserver.disconnect())},defaultValue:isMobile(),key:"k"},{name:"changeTitle",icon:{emoji:"🆎",html:SVGIcons.capitalT},desc:"Zmień tytuł karty",type:SettingType.Checkbox,onchange:e=>{e.value||n.originalTitle&&(unsafeWindow.document.title=n.originalTitle),n.updateTabTitle()},onrender:()=>{n.originalTitle=unsafeWindow.document.title},defaultValue:!isMobile(),key:"t"},{name:"invertImages",icon:{emoji:"🔃",html:SVGIcons.pallete},desc:"Odwróć kolory obrazów",type:SettingType.Checkbox,defaultValue:!1,onchange:e=>toggleBodyClass("custom-script-invert-images",e.value),key:"i"},{name:"changeTheme",icon:{emoji:"🔃",html:SVGIcons.palette2},enum:[{value:"default",desc:"nie zmieniaj"},{value:"white",desc:"biały"},{value:"black",desc:"czarny"},{value:"image",desc:"obrazek"}],desc:"Zmień domyślny motyw...",type:SettingType.Enum,defaultValue:"default",onchange:e=>{n.setBackground()},key:"i"},{name:"smoothScroll",icon:{emoji:"↕️",html:SVGIcons.chevronExpand},desc:"Płynne przewijanie strzałkami",type:SettingType.Checkbox,defaultValue:!1,key:"s"},{type:SettingType.Divider},{name:"hideTools",icon:{emoji:"🛠️",html:SVGIcons.tools},desc:"Ukryj narzędzia",type:SettingType.Checkbox,onchange:e=>toggleBodyClass("custom-script-hideTools",e.value),defaultValue:!1},{name:"hideTags",icon:{emoji:"🔖",html:SVGIcons.tags},desc:"Ukryj listę tagów",type:SettingType.Checkbox,onchange:e=>toggleBodyClass("custom-script-hideTags",e.value),defaultValue:!1},{name:"hideBottomSearch",icon:{emoji:"🔎",html:SVGIcons.search},desc:"Ukryj narzędzie wyszukiwania pod slajdem",type:SettingType.Checkbox,onchange:e=>toggleBodyClass("custom-script-hideBottomSearch",e.value),defaultValue:!1}];!function(e){e[e.Checkbox=0]="Checkbox",e[e.Percent=1]="Percent",e[e.Integer=2]="Integer",e[e.Button=3]="Button",e[e.Divider=4]="Divider",e[e.Enum=5]="Enum"}(SettingType=SettingType||{});class Setting extends CustomEventEmmiter{constructor(e,t){super(),this.options=e,this.parent=t,this.name=e.name,this.type=e.type,this.type!==SettingType.Button&&this.type!==SettingType.Divider&&(GM_addValueChangeListener(this.name,(e,t,n,s)=>{this._value!==n&&(this._value=n,this.trigger("change",{oldValue:t,remote:s,value:n}))}),this._value=GM_getValue(this.name,e.defaultValue),e.isInRange&&(this.isInRange=e.isInRange))}get value(){return this._value}set value(e){var t;this.type!==SettingType.Button&&this._value!==e&&(this.isInRange&&!this.isInRange(e)?this.trigger("change",{value:this._value,oldValue:this._value,remote:!1}):(t=this._value,this._value=e,GM_setValue(this.name,e),this.trigger("change",{value:e,oldValue:t,remote:!1})))}}class SettingElement extends Setting{constructor(e,t){super(e,t),e.onchange&&this.addEventListener("change",e.onchange),e.onrender&&this.addEventListener("rendered",e.onrender),e.onclick&&this.addEventListener("tmMenuClicked",e.onclick)}getIconHTML(){if(this.options.icon){if(this.options.icon.html)return this.options.icon.html;if(this.options.icon.emoji)return`<span class='custom-script-emoji'>${this.options.icon.emoji}</span>`}return""}getIconEmoji(){return this.options.icon&&this.options.icon.emoji?this.options.icon.emoji+" ":""}removeFromTMMenu(){GM_unregisterMenuCommand(this.tmHandle)}set disabled(e){this._disabled!==e&&((this._disabled=e)&&this.removeFromTMMenu(),this.element&&(this.element.style.display=e?"none":""),this.trigger("disabled",e))}addToTMMenu(){this._disabled||(this.tmHandle=GM_registerMenuCommand(this.renderSimple(),()=>this.trigger("tmMenuClicked"),this.options.key))}}class DividerSetting extends SettingElement{constructor(e){super({name:"_divider",desc:"Divider",type:SettingType.Divider},e),this.index=DividerSetting.index++}render(){return this.element=document.createElement("div"),this.element.className="custom-setting-divider",this.element.innerHTML="<div></div>",this.element}renderSimple(){return"-".repeat(15+this.index)}}DividerSetting.index=0;class CheckboxSetting extends SettingElement{constructor(e,t){super(e,t),this.addEventListener("tmMenuClicked",()=>{this.value=!this.value})}getHTML(){return`
        <input type='checkbox' id='custom-input-${this.name}' name='${this.name}' />
        ${this.getIconHTML()}
        <label for='custom-input-${this.name}'>${this.options.desc}</label>`}render(){return this.element=document.createElement("div"),this.element.innerHTML=this.getHTML(),this.element.classList.add("custom-script-setting"),this.input=this.element.querySelector("input"),this.input.checked=this.value,this.addEventListener("change",({value:e})=>this.input.checked=e),this.input.addEventListener("change",e=>this.value=this.input.checked),this.trigger("rendered"),this.element}renderSimple(){return CheckboxSetting.getCheckboxEmoji(this.value)+" "+this.getIconEmoji()+this.options.desc}}CheckboxSetting.getCheckboxEmoji=e=>e?"☑️":"🔲";class ButtonSetting extends SettingElement{constructor(e,t){super(e,t)}getHTML(){var e=this.getIconHTML();return e+=this.options.desc,`<a name='${this.name}'>${e}</a>`}render(){return this.element=document.createElement("div"),this.element.innerHTML=this.getHTML(),this.element.classList.add("custom-script-setting"),this.btn=this.element.querySelector("a"),this.btn.addEventListener("click",()=>this.trigger("tmMenuClicked")),this.trigger("rendered"),this.element}renderSimple(){return this.getIconEmoji()+this.options.desc}}ButtonSetting.getCheckboxEmoji=e=>e?"☑️":"🔲";class NumberSetting extends SettingElement{constructor(t,e){super(t,e),this.addEventListener("tmMenuClicked",()=>{var e=t.type===SettingType.Percent;this.value=parseInt(prompt(`Podaj wartość ${e?"procentową ":""}dla ustawienia (obecnie ${this.value}${e?"%":""}):
`+this.options.desc))})}set upperLimit(e){this.input&&(this.input.max=e.toString())}set lowerLimit(e){this.input&&(this.input.min=e.toString())}getHTML(){return this.type===SettingType.Percent?`
                ${this.getIconHTML()}
                <label>${this.options.desc}</label>
                <div>
                    <a>${SVGIcons.minusCircle}</a>
                    <input type='range' name='${this.name}' />
                    <a>${SVGIcons.plusCircle}</a>
                    <span class='custom-range-val'></span>
                </div>`:`
                ${this.getIconHTML()}
                <label>${this.options.desc}</label>
                <input type='number' name='${this.name}' />`}render(){if(this.element=document.createElement("div"),this.element.innerHTML=this.getHTML(),this.element.classList.add("custom-script-setting"),this.input=this.element.querySelector("input"),this.input.value=this.value.toString(),this.type===SettingType.Percent){this.element.style.flexWrap="wrap";const t=this.element.querySelector("span"),e=(t.innerText=this.value+"%",this.element.querySelectorAll("a"));e.forEach((e,t)=>{e.addEventListener("click",e=>{e.preventDefault();e=Math.ceil(.05*this.value);this.value=this.value+(t?e:-e)})}),this.addEventListener("change",({value:e})=>t.innerText=e+"%"),this.input.addEventListener("input",()=>t.innerText=this.input.value+"%")}return this.addEventListener("change",({value:e})=>this.input.value=e.toString()),this.input.addEventListener("change",e=>this.value=this.parse(this.input.value)),this.input.addEventListener("input",e=>this.trigger("input",{value:this.parse(this.input.value)})),this.trigger("rendered"),this.element}parse(e){return parseFloat(e.replace(",","."))}renderSimple(){var e=this.type===SettingType.Percent?"%":"";return this.getIconEmoji()+this.options.desc+` (${this.value}${e})`}}class EnumSetting extends SettingElement{constructor(e,t){super(e,t),this.keys=this.options.enum.map(e=>e.value),this.addEventListener("tmMenuClicked",()=>{var e=this.keys.findIndex(e=>e===this.value)+1;this.value=this.keys[e>=this.keys.length?0:e]})}getHTML(){return`
            ${this.getIconHTML()}
            <label>${this.options.desc}</label>
            <div>
                <select name='${this.name}'>
                    ${this.options.enum.map(e=>`<option value='${e.value}' 
                        ${"default"===e.value?"default":""}>
                        ${e.desc}</option>`).join("")}
                </select>
            </div>`}render(){return this.element=document.createElement("div"),this.element.innerHTML=this.getHTML(),this.element.classList.add("custom-script-setting"),this.select=this.element.querySelector("select"),this.select.value=this.value,this.addEventListener("change",({value:e})=>this.select.value=e.toString()),this.select.addEventListener("change",e=>this.value=this.select.value),this.trigger("rendered"),this.element}renderSimple(){return this.getIconEmoji()+this.options.desc+` (${this.options.enum.find(e=>e.value===this.value).desc})`}}class Settings extends CustomEventEmmiter{constructor(e){super(),this.app=e,this.settings=[]}addSettings(e){e.forEach(e=>this.addSetting(e))}addSetting(e){let t;e instanceof SettingElement?(e.parent=this,t=e):e.type===SettingType.Checkbox?t=new CheckboxSetting(e,this):e.type===SettingType.Button?t=new ButtonSetting(e,this):e.type===SettingType.Divider?t=new DividerSetting(this):e.type===SettingType.Percent||e.type===SettingType.Integer?t=new NumberSetting(e,this):e.type===SettingType.Enum&&(t=new EnumSetting(e,this)),t&&(this.settings.push(t),this.app.addEventListener("loaded",()=>t.trigger("change",{value:t.value,oldValue:t.options.defaultValue,remote:!1})),t.addEventListener("change",()=>{this.renderInTMMenu()}))}setValue(e,t){let n;n="function"==typeof t?t(this.getValue(e)):t,GM_setValue(e,n)}getValue(e){return GM_getValue(e)}getSetting(t){return this.settings.find(e=>e.name===t)}renderInTMMenu(){this.settings.forEach(e=>{e.removeFromTMMenu(),e.addToTMMenu()})}render(){return this.element=document.createElement("div"),this.element.append(...this.settings.map(e=>e.render())),this.element}}class ExternalFragment extends CustomEventEmmiter{constructor(e,t){super(),this.initialURL=e,this.selector=t,this.iframe=document.createElement("iframe"),this.iframe.width="1300",this.iframe.height="800",this.iframe.style.position="absolute",this.iframe.style.bottom="100vh",document.body.append(this.iframe),this.load()}load(){this.interval&&clearInterval(this.interval),this.element&&this.element.remove(),this.iframe.src=this.initialURL,this.triesLeft=20,this.iframe.addEventListener("load",e=>__awaiter(this,void 0,void 0,function*(){this.element=yield this.getElement(),this.setupURLChangeDetection(),this.trigger("loaded",this.element)}),{once:!0}),this.childWindow=this.iframe.contentWindow}getElement(){return this.iframe.hidden=!1,new Promise(t=>{const n=this.iframe.contentDocument;if(!n)return t(null);const s=setInterval(()=>{var e=n.querySelector(this.selector);!e&&this.triesLeft--||(clearInterval(s),this.iframe.hidden=!0,t(e))},100)})}setupURLChangeDetection(){this.childWindow&&(this.url=this.childWindow.location.href,this.interval=setInterval(()=>{this.childWindow&&this.url!==this.childWindow.location.href&&(this.url=this.childWindow.location.href,console.log({changedURL:this.url}),this.trigger("iframeURLChange",this.url))},100))}destroy(){clearInterval(this.interval),this.iframe.remove(),this.element.remove(),this.element=this.iframe=this.childWindow=this.url=null}}class CourseSidebar extends ExternalFragment{constructor(){super("https://lek.wiecejnizlek.pl/app/courses/1/",".course-sidenav>div"),this.prepareContainer(),this.addEventListener("loaded",e=>{e&&this.container.append(e)}),this.setupOpenLinks()}setupOpenLinks(){this.lastURLUpdate=Date.now();const n=/lek.wiecejnizlek.pl\/app\/courses\/1\/lessons\/([0-9]+)\/([0-9]+)\/([0-9]+)/;this.addEventListener("iframeURLChange",e=>{var t=Date.now();console.log({now:t}),t-this.lastURLUpdate<500||(t=n.exec(e))&&(this.trigger("urlChange",{url:e,lessonID:parseInt(t[1]),screenID:parseInt(t[2]),slide:parseInt(t[3])}),this.load())})}prepareContainer(){this.container=document.createElement("div"),this.container.innerHTML=CourseSidebar.CONTAINER_HTML,this.container.classList.add("custom-main-nav-container"),this.collapseToggler=new ClassToggler("active",this.container),this.container.querySelector("a").addEventListener("click",()=>this.collapseToggler.toggle())}attach(e){e.prepend(this.container)}show(){this.container&&(this.container.style.display="")}hide(){this.container&&(this.container.style.display="none")}destroy(){this.container.remove(),super.destroy()}}CourseSidebar.CONTAINER_HTML=`
    <a>
        ${SVGIcons.chevronUp}
        <span>CAŁY KURS</span>
    </a>`,function(e){class t extends CustomEventEmmiter{constructor(e,t,n){super(),this.metadata=e,this._content=t,this.parent=n,this._edited=!1,this._editing=!1,this._deleted=!1}get content(){return this._content}get element(){return this._element}remove(e=!0){this._deleted||(this._deleted=!0,this.trigger("remove"),this._element&&this._element.remove(),e&&this.parent.removeNoteById(this.metadata.id),this._element=null,this.removeAllListeners())}set content(e){if(this._deleted)throw new n;this._content=e,this.contentElement&&(this.contentElement.innerHTML=e.replace(/\n/g,"<br />")),this.trigger("change",{newContent:e}),this.parent.saveNote(this)}setupEditing(t){t.value=this.content,t.addEventListener("blur",e=>{this.endEditing()}),t.addEventListener("keyup",e=>{"Enter"!==e.key||e.shiftKey||e.altKey||(e.stopImmediatePropagation(),e.preventDefault(),this.endEditing())}),t.addEventListener("input",e=>{e.stopPropagation();e=t.value;this.content=e});const e=this._element.querySelector("form");e&&e.addEventListener("submit",e=>{e.preventDefault(),this.endEditing()}),this._element.addEventListener("click",e=>this.startEditing(t))}startEditing(e){this._editing=!0,this._lastValue=this._content,this._element.classList.add("editing"),e.focus()}endEditing(){this._editing&&(this._editing=!1,this._element.classList.remove("editing"),this._lastValue!==this.content&&this.trigger("edited",{newContent:this.content}),this._content.trim().length||(this._edited?this.remove():this._edited=!0))}}e.Note=t;class i extends t{constructor(){super(...arguments),this._edited=!0}static from(e){return new i(e.metadata,e.content,e.parent)}get contentElement(){return this._element&&this._element.querySelector(".custom-tag-content")}render(e){this._element=document.createElement("div"),this._element.innerHTML=i.HTML,this._element.classList.add("custom-tag"),this._element.title=this.content,this._element.tabIndex=0;const t=this._element.querySelector(".custom-remove"),n=this._element.querySelector(".custom-change-color");return this.colorInput=this._element.querySelector("input[type=color]"),this.setColor(this.metadata.color),this.contentElement.innerText=this.content,this.setupEditing(this._element.querySelector("input")),n.addEventListener("click",e=>{e.stopImmediatePropagation(),this.colorInput.click()}),this.colorInput.addEventListener("change",()=>{this.metadata.color=this.colorInput.value,this.trigger("colorChange",{newColor:this.metadata.color}),this.parent.saveNote(this),this.setColor(this.metadata.color)}),t.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),this.remove()}),this._element.title=this.content,this.addEventListener("edited",({newContent:e})=>{this._element.title=e,this.setColorFromTagName()}),e&&e.prepend(this._element),this.trigger("rendered"),this._element}setColorFromTagName(){const e=this.parent.parent.tags;console.log({tagColors:e});let t=this.metadata.color;var n;e.length&&this.content&&((n=e.find(e=>e.name===this.content))&&(t=n.color)),this.metadata.color=t,this.setColor(t)}setColor(e){this._element.style.background=e,this._element.style.color=getForegroundColor(e),this.colorInput.value=e}}i.HTML=`
    <span class='custom-tag-content'></span>
    <form>
        <input type='text' list='custom-tags-list' />
        <input type='color' />
    </form>
    <a class='custom-change-color' title='Zmień kolor'>${SVGIcons.pallete}</a>
    <a class='custom-remove' title='Usuń'>${SVGIcons.removeCircle}</a>
    `,e.TagNote=i;class a extends t{static from(e){return new a(e.metadata,e.content,e.parent)}static normalizeFractionalPosition(e){return e.x<0&&(e.x=0),e.y<0&&(e.y=0),1<e.x&&(e.x=1),1<e.y&&(e.y=1),e}setNotePosition(e){e=e||{x:0,y:0},e=a.normalizeFractionalPosition(e),this._element.style.top=Math.round(100*e.y)+"%",this._element.style.left=Math.round(100*e.x)+"%"}render(e){this.parentElement=e,this._element=document.createElement("div"),this.setNotePosition(this.metadata.position),this._element.dataset.id=this.metadata.id,this._element.classList.add("custom-note"),this._element.innerHTML=a.HTML;var t=this._element.querySelector("textarea");const n=this.contentElement,s=this._element.querySelector(".custom-note-remove");return n.innerHTML=this.content.replace(/\n/g,"<br />"),this.setupEditing(t),this.setupMoving(),s.addEventListener("click",e=>{e.stopPropagation(),this.remove()}),e&&e.appendChild(this._element),this._element}get contentElement(){return this._element&&this._element.querySelector("div.custom-note-content")}setupMoving(){const t=this._element.querySelector(".custom-note-move");t.addEventListener("mousedown",e=>{e.stopPropagation();e={x:-t.offsetLeft,y:-t.offsetTop};this.startFollowingMouse(e),this._endFollowingCb=()=>this.endFollowingMouse(),document.addEventListener("mouseup",this._endFollowingCb)})}endFollowingMouse(){document.removeEventListener("mousemove",this._followingCb),document.removeEventListener("mouseup",this._endFollowingCb),this.isMoving=!1,this.parent.saveNote(this)}startFollowingMouse(e={x:0,y:0}){this.followingOffset=e,this.parentElement&&(this.isMoving=!0,this.parentRect=this.parentElement.getBoundingClientRect(),this._followingCb=e=>this.followMouse(e),document.addEventListener("mousemove",this._followingCb))}followMouse(e){e.preventDefault();e={x:(e.x+this.followingOffset.x-this.parentRect.x)/this.parentRect.width,y:(e.y+this.followingOffset.y-this.parentRect.y)/this.parentRect.height};this.metadata.position=e,this.setNotePosition(e)}}a.HTML=`
        <div class="custom-note-content"></div>
        <form> 
            <textarea></textarea> 
        </form>
        <a class="custom-note-remove">${SVGIcons.trash}</a>
        <a class="custom-note-move">${SVGIcons.move}</a>`,e.RegularNote=a;class n extends Error{constructor(){super("Cannot modify deleted note!")}}class r{constructor(e,t,n,s,i){this.slide=e,this.screenid=t,this.slideTitle=n,this.presentationTitle=s,this.lessonID=i}}let s;(o=s=e.NoteType||(e.NoteType={})).Regular="regular",o.Tag="tag";class l extends r{constructor(e,t,n,s,i,a="#95b9f9"){super(n.slide,n.screenid,n.slideTitle,n.presentationTitle,n.lessonID),this.id=e,this.type=t,this.position=s,this.textContext=i,this.color=a}}{var o=e.Collections||(e.Collections={});class h extends CustomEventEmmiter{constructor(e,t,n){super(),this.metadata=e,this._notesRaw=t,this.parent=n,this._notes=[],t.forEach(t=>{let n;if("tag"!==t.type)n=new a(new l(t.id,t.type,this.metadata,t.position,t.textContext),t.content,this);else{const s=this.parent.tags;var e=s.find(e=>e.name===t.content),e=e&&e.color||t.color;(n=new i(new l(t.id,t.type,this.metadata,void 0,void 0,e),t.content,this)).addEventListener("edited",({newContent:t})=>{const e=this.tags.map(e=>e.content);1<e.filter(e=>e===t).length&&n.remove()})}this._notes.push(n)}),this._changedNotes=[],this._deletedNotes=[]}get notes(){return this._notes.filter(e=>e instanceof a)}get tags(){return this._notes.filter(e=>e instanceof i)}get isSaved(){return this._changedNotes.length+this._deletedNotes.length===0}getNoteByPosition(t){return this._notes.find(e=>e.metadata.position===t)}getNoteById(t){return this._notes.find(e=>e.metadata.id===t)}addAnyNote({position:e,content:t,textContext:n,presentationTitle:s,slideTitle:i,type:a,color:o},r){s&&(this.metadata.presentationTitle=s),i&&(this.metadata.slideTitle=i);s=c(),i=new r(new l(s,a,this.metadata,e,n,o),t,this);return this._notes.push(i),this._changedNotes.push(i),this.trigger("change",{added:[i]}),i}addNote(e){return e.type=s.Regular,this.addAnyNote(e,a)}addTag(e){return e.type=s.Tag,this.addAnyNote(e,i)}removeNoteByQuery(e){let t;var n=this._notes.findIndex(e),e=this._changedNotes.findIndex(e);return 0<=n&&(t=this._notes.splice(n,1)[0],this._deletedNotes.push(t)),(t=0<=e?this._changedNotes.splice(e,1)[0]:t).remove(!1),this.trigger("change",{deleted:[t]}),t}removeAllNotes(){const e=this._notes.concat(this._changedNotes);return this._changedNotes=this._notes=[],this.trigger("change",{deleted:e}),this._deletedNotes.push(...e),e.forEach(e=>{e.remove(!1)}),e}removeNoteById(t){return this.removeNoteByQuery(e=>e.metadata.id===t)}saveNote(e){this._changedNotes.includes(e)||this._changedNotes.push(e),this.trigger("change",{changed:[e]})}commitChanges(){return __awaiter(this,void 0,void 0,function*(){this.trigger("commit",{}),yield this.parent.removeNotes(this._deletedNotes),this._deletedNotes=[],yield this.parent.saveNotes(this._changedNotes),this._changedNotes=[]})}}o.Slide=h}function c(){return unsafeWindow.crypto.randomUUID()}{var d=e.Collections||(e.Collections={});class u extends CustomEventEmmiter{constructor(e,t,n){super(),this.db=e,this._screenid=t,this._lessonID=n,this.cache={},this._tags=[]}static setupDB(e,t){let n,s;const i=e.target.transaction;try{n=t.createObjectStore(u.NOTES_STORE,{keyPath:"id"})}catch(e){n=i.objectStore(u.NOTES_STORE)}try{s=t.createObjectStore(u.TAGS_STORE,{keyPath:"name"})}catch(e){s=i.objectStore(u.TAGS_STORE)}return u.generateIndexes(n,u.NOTES_INDEXES),u.generateIndexes(s,u.TAGS_INDEXES),n}static generateIndexes(t,e){const n=Object.values(e);n.forEach(e=>{try{t.createIndex(e.name,e.columns,e.options)}catch(e){console.error(e)}})}static createAsync(t,n){return __awaiter(this,void 0,void 0,function*(){var e=yield getIndexedDB("NotesDatabase",u.dbVersion,u.setupDB);return new u(e,t,n)})}wipeCache(){this.cache={}}getNotesBySlide(o){return __awaiter(this,void 0,void 0,function*(){const e=this.db.transaction(u.NOTES_STORE,"readonly"),t=e.objectStore(u.NOTES_STORE),n=t.index(u.NOTES_INDEXES.byScreenIDAndSlide.name),a=n.getAll([this._screenid,o]);return new Promise((i,t)=>{a.addEventListener("success",e=>{var t=a.result,n=t[0]&&t[0].slideTitle||"",s=t[0]&&t[0].presentationTitle||"",n=new d.Slide(new r(o,this._screenid,n,s,this._lessonID),t,this);this.cache[o]=n,i(n)}),a.addEventListener("error",e=>t(e))})})}get tags(){return this._tags}getAllTagNames(){const e=this.db.transaction(u.TAGS_STORE,"readonly"),t=e.objectStore(u.TAGS_STORE),n=t.index(u.TAGS_INDEXES.byName.name),s=n.getAll();return new Promise((n,t)=>{s.addEventListener("success",e=>{const t=s.result;this._tags.length!==t.length&&(this._tags=t,this.trigger("changedTags",{changed:t.map((e,t)=>Object.assign(Object.assign({},e),{index:t}))})),n(t)}),s.addEventListener("error",e=>t(e))})}getAllTagsWithName(e){const t=this.db.transaction(u.NOTES_STORE,"readonly"),n=t.objectStore(u.NOTES_STORE),s=n.index(u.NOTES_INDEXES.byContentAndType.name),i=s.getAll([e,"tag"]);return new Promise((n,t)=>{i.addEventListener("success",e=>{var t=i.result;n(t)}),i.addEventListener("error",e=>t(e))})}static mapNoteToRecord(e){return{content:e.content,id:e.metadata.id,screenid:e.metadata.screenid,slide:e.metadata.slide,position:e.metadata.position,presentationTitle:e.metadata.presentationTitle,slideTitle:e.metadata.slideTitle,textContext:e.metadata.textContext,type:e.metadata.type,color:e.metadata.color,lessonID:e.metadata.lessonID}}saveNotes(e){e=e.map(u.mapNoteToRecord);return this.importNotes(e)}importNotes(e){const s=this.db.transaction([u.NOTES_STORE,u.TAGS_STORE],"readwrite"),i=s.objectStore(u.NOTES_STORE),a=s.objectStore(u.TAGS_STORE),o=[],r=[];return e.forEach(e=>{if(i.put(e),"tag"===e.type){const s=e.content;var e=e.color,t={name:s,color:e},n=(a.put(t),this._tags.findIndex(e=>e.name===s));0<=n?this._tags[n].color!==e&&(this._tags[n].color=e,o.push(Object.assign(Object.assign({},this._tags[n]),{index:n}))):(this._tags.push(t),r.push(t))}}),s.commit(),(o.length||r.length)&&this.trigger("changedTags",{changed:o,added:r}),new Promise((t,n)=>{s.addEventListener("complete",e=>{t()}),s.addEventListener("error",e=>n(e))})}removeNotes(e){const s=this.db.transaction(u.NOTES_STORE,"readwrite"),t=s.objectStore(u.NOTES_STORE);return e.forEach(e=>{t.delete(e.metadata.id)}),s.commit(),new Promise((t,n)=>{s.addEventListener("complete",e=>{t()}),s.addEventListener("error",e=>n(e))})}exportNotes(){const e=this.db.transaction(u.NOTES_STORE,"readonly"),t=e.objectStore(u.NOTES_STORE),n=t.index(u.NOTES_INDEXES.byScreenID.name),s=n.getAll(this._screenid);return new Promise((n,t)=>{s.addEventListener("success",e=>{var t=s.result;n(t)}),s.addEventListener("error",e=>t(e))})}}u.NOTES_STORE="Notes",u.TAGS_STORE="Tags",u.NOTES_INDEXES={byScreenIDAndSlide:{name:"byScreenIDAndSlide",columns:["screenid","slide"],options:{unique:!1}},byScreenID:{name:"byScreenID",columns:"screenid",options:{unique:!1}},byContentAndType:{name:"contentAndType",columns:["content","type"],options:{unique:!1}},byType:{name:"byType",columns:"type",options:{unique:!1}},byContent:{name:"byContent",columns:"content",options:{unique:!1}}},u.TAGS_INDEXES={byName:{columns:"name",name:"byName",options:{unique:!0}}},u.dbVersion=6,d.Presentation=u}}(Notes=Notes||{});class BreakTimer{constructor(e){(this.app=e).addEventListener("unloaded",()=>this.timer&&clearTimeout(this.timer))}start(){clearTimeout(this.timer),this.timer=setTimeout(()=>{alert("Pora na przerwę 🔔")},6e4*this.app.tools.getValue("breakTime"))}endListening(){this.app.presentationMetadata.removeEventListener("slideChange",this.start),this.timer&&clearTimeout(this.timer)}startListening(){this.app.presentationMetadata.addEventListener("slideChange",this.start)}}let noteTarget;const tagContainerHTML=`
        <div class='custom-tags-container'> 
            <a class='custom-new-tag custom-tag'>${SVGIcons.plusCircle}</a>  
        </div>`,notesBtnsHTML=`
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
        </div>`;function createNotesBtnsAndTags(){const e=document.querySelector(".slideshow-container");if(e&&!document.querySelector(".custom-tags-and-btns-container")){const t=document.createElement("div");t.innerHTML=tagContainerHTML+notesBtnsHTML,t.className="custom-tags-and-btns-container",e.append(t)}}class NotesRendering{constructor(e){this.app=e,this.notesChangedListener=e=>this.slideNotesChanged(e),this.addNoteBtnHandler=e=>{if(this.app.currentSlideNotes){const t=document.querySelector(".present .present"),n=(t.style.cursor="copy",this.app.currentSlideNotes.addNote({content:"",position:{x:0,y:1},presentationTitle:this.app.presentationMetadata.presentationName,slideTitle:this.app.presentationMetadata.slideTitle}));n.startFollowingMouse({x:0,y:10}),t.addEventListener("click",e=>{e.preventDefault(),e.stopImmediatePropagation(),n.endFollowingMouse(),t.style.cursor="";e=e.target,this.setupContextElem(e,n),e=e.innerText;n.metadata.textContext=e,n.element.click()},{once:!0})}},this.btnsContainerNoTags=new ClassToggler("custom-no-tags",".custom-notes-btns-container"),this.btnsContainerNoNotes=new ClassToggler("custom-no-notes",".custom-notes-btns-container")}loadNotes(){return __awaiter(this,void 0,void 0,function*(){var e=this.app.presentationMetadata;return this.app.notesCollection=yield Notes.Collections.Presentation.createAsync(e.screenID,e.lessonID),this.setupTagList(),this.renderNotes(this.app.slideNumber)})}setupTagList(){return __awaiter(this,void 0,void 0,function*(){const e=yield this.app.notesCollection.getAllTagNames(),t=(this.app.addTagListContainer(),e=>{const t=document.createElement("option");return t.value=e.name,t.style.background=e.color,t.innerHTML=e.name,t}),n=t=>{const e=document.createElement("a");return e.className="custom-tag",e.innerText=t.name,e.style.background=t.color,e.style.color=getForegroundColor(t.color),e.addEventListener("click",e=>{e.preventDefault(),this.app.searchInBottomContainer.performSearch(`"${t.name}"`)}),e};var s=e.map(t),i=e.map(n);const a=document.createElement("datalist"),o=document.querySelector(".custom-tagList");a.id="custom-tags-list",a.append(...s),o.append(...i),document.body.append(a),this.app.notesCollection.addEventListener("changedTags",e=>{e.added&&e.added.length&&(a.append(...e.added.map(t)),o.append(...e.added.map(n)))})})}getRandomTagColor(){return getRandomElement(["#6e8898","#606c38","#fabc2a","#c3423f","#011936"])}renderNotes(n){return __awaiter(this,void 0,void 0,function*(){if(this.app.currentSlideNotes&&(this.app.currentSlideNotes.commitChanges(),this.app.currentSlideNotes.removeEventListener("change",this.notesChangedListener)),this.app.tools&&this.app.tools.getValue("useNotes")&&this.app.notesCollection){noteTarget&&(noteTarget.innerHTML="");const e=document.querySelector(".present .present");if(e){const t=e.querySelector(".custom-notes-overlay");return this.app.notesCollection.getNotesBySlide(n).then(e=>(this.app.currentSlideNotes=e,this.renderTags(),this.btnsContainerNoNotes.state=!e.notes.length,!noteTarget&&t?e.notes.map(e=>e.element):(this.app.currentSlideNotes.addEventListener("change",this.notesChangedListener),this.addNoteElems(e.notes))))}}})}renderTags(){const t=document.querySelector(".custom-tags-container");if(t){const e=Array.from(t.children),n=(e.pop(),e.forEach(e=>e.remove()),this.app.currentSlideNotes.tags);n.length&&n.forEach(e=>{e.render(t)}),this.btnsContainerNoTags.state=!n.length}}slideNotesChanged(e){if(e.added){var t=e.added.filter(e=>e instanceof Notes.RegularNote);t.length&&this.addNoteElems(t);const n=e.added.filter(e=>e instanceof Notes.TagNote),s=(this.btnsContainerNoTags.state=this.btnsContainerNoTags.state&&!n.length,document.querySelector(".custom-tags-container"));n.forEach(e=>{const t=e.render(s);t.click()})}e.deleted&&!this.app.currentSlideNotes.notes.length&&(this.btnsContainerNoNotes.state=!0)}addNoteElems(e){if(e.length){this.btnsContainerNoNotes.state=!1;let i;const a=document.querySelector(".present .present");if(a){if(noteTarget)i=noteTarget;else{let e=a.querySelector(".custom-notes-overlay");e||(e=document.createElement("div")).classList.add("custom-notes-overlay"),a.prepend(e),i=e}return e.map(e=>{var t,n=e.render(i);const s=e.metadata.textContext;return s&&s.trim().length&&(t=a.querySelectorAll("*"),(t=Array.from(t).find(e=>e.innerText&&e.innerText.trim()===s.trim()))&&this.setupContextElem(t,e)),n})}}}setupContextElem(t,e){const n=e.element;t.title="Notatka: "+e.content,e.addEventListener("change",({newContent:e})=>t.title="Notatka: "+e),e.addEventListener("remove",()=>t.title=""),n.addEventListener("mouseenter",()=>{e.isMoving||(t.style.border="solid 1px black")}),n.addEventListener("mouseleave",()=>{t.style.border=""}),e.addEventListener("remove",()=>{t.style.border=""})}addNotesColumn(){const e=document.createElement("div"),t=(e.classList.add("custom-script-notes-column","custom-script-hidden"),document.querySelector(".order-number-container"));if(t)return t.after(e),e}}const notesOverlayToggle=new ClassToggler("custom-script-notes-visible"),noteColumnToggle=new ClassToggler("custom-script-hidden",".custom-script-notes-column");let uploadInput;const getToolsConfig=n=>[{name:"suggestBreak",type:SettingType.Checkbox,desc:"Sugeruj przerwę przy dłuższym braku aktywności",icon:{emoji:"🔔",html:SVGIcons.bell},defaultValue:!1,onchange:function(e){n.breakTimer||(n.breakTimer=new BreakTimer(n)),e.value?(n.breakTimer.startListening(),n.breakTimer.start()):n.breakTimer.endListening(),this.parent.getSetting("breakTime").disabled=!e.value},onrender:()=>{n.addEventListener("loaded",()=>{n.breakTimer=new BreakTimer(n)})}},{name:"breakTime",desc:"Czas przerwy (w minutach)",type:SettingType.Integer,defaultValue:7,icon:{html:SVGIcons.stopwatch,emoji:"⌚"},onchange:function(e){n.breakTimer.timer&&n.breakTimer.start()},isInRange:e=>2<e&&e<200},{name:"useNotes",type:SettingType.Checkbox,desc:"Używaj notatek i tagów",icon:{emoji:"📝",html:SVGIcons.stickies},defaultValue:!1,onchange:function(e){toggleBodyClass("custom-script-use-notes",e.value),n.notesRendering&&n.presentationMetadata.screenID&&e.value&&!n.notesCollection&&(n.notesRendering.addNotesColumn(),setupNotesBtns(n),n.notesRendering.loadNotes()),this.parent.getSetting("exportNotes").disabled=!e.value,this.parent.getSetting("importNotes").disabled=!e.value},onrender:function(){var e=()=>{this.value&&(n.notesRendering.addNotesColumn(),setupNotesBtns(n))};n.loaded?e():n.addEventListener("loaded",e)}},{name:"exportNotes",desc:"Eksportuj notatki",icon:{emoji:"📤",html:SVGIcons.export},type:SettingType.Button,onclick:()=>{n.notesCollection&&n.notesCollection.exportNotes().then(e=>{downloadFile("application/json",n.presentationMetadata.presentationName+"-notes.json",JSON.stringify(e))})}},{name:"importNotes",desc:"Importuj notatki",icon:{emoji:"📥",html:SVGIcons.import},type:SettingType.Button,onclick:function(){uploadInput.addEventListener("change",e=>{if(n.notesCollection&&uploadInput.files.length){const t=uploadInput.files.item(0);t.text().then(e=>n.notesCollection.importNotes(JSON.parse(e))).then(()=>unsafeWindow.location.reload())}},{once:!0}),uploadInput.click()},onrender:function(){(uploadInput=document.createElement("input")).type="file",uploadInput.name="importNotes",uploadInput.accept="application/json",uploadInput.style.display="none",document.body.appendChild(uploadInput)}}];function setupNotesBtns(t){createNotesBtnsAndTags();const e=document.querySelector(".custom-add-btn"),n=new ClassToggler("active",".custom-add-note-btns"),s=new ClassToggler("active",e,e=>{n.state=e.state}),i=(s.setDismissible(!0),e.addEventListener("click",()=>s.toggle()),document.querySelector(".custom-tags-view-btn")),a=new ClassToggler("custom-script-tags-visible"),o=new ClassToggler("active",i,e=>a.state=e.state),r=(i.addEventListener("click",()=>o.toggle()),document.querySelectorAll(".custom-new-tag, .custom-add-tag-btn")),l=()=>{s.state=!1,o.state=!0,t.currentSlideNotes.addTag({content:"",color:t.notesRendering.getRandomTagColor(),presentationTitle:t.presentationMetadata.presentationName,slideTitle:t.presentationMetadata.slideTitle})},c=(r.forEach(e=>e.addEventListener("click",l)),Keyboard.registerShortcut({keys:["t"],callback:l}),document.querySelector(".custom-clear-notes-btn")),d=(c.addEventListener("click",()=>{t.currentSlideNotes&&confirm(`Czy na pewno usunąć WSZYSTKIE (${t.currentSlideNotes.notes.length}) notatki ze slajdu ${t.currentSlideNotes.metadata.slide}?`)&&t.currentSlideNotes.removeAllNotes()}),document.querySelector(".custom-notes-view-btn")),h=new ClassToggler("inactive",".custom-notes-additional-btns"),u=document.querySelector(".custom-notes-view-type-btn"),m=new ClassToggler("active",u,e=>{p&&p.state&&(noteColumnToggle.state=!e.state,notesOverlayToggle.state=!e.state,e.state?(noteTarget=noteColumnToggle.element).innerHTML="":(noteTarget=null,document.querySelectorAll(".custom-notes-overlay").forEach(e=>e.remove())),t.currentSlideNotes.commitChanges().then(()=>{t.notesRendering.renderNotes(t.presentationMetadata.slideNumber)}))}),p=new ClassToggler("active",d,e=>{h.state=!e.state,notesOverlayToggle.state=!m.state&&e.state,noteColumnToggle.state=!(m.state&&e.state)}),g=document.querySelector(".custom-add-note-btn");g.addEventListener("click",e=>{s.state=!1,p.state=!0,t.notesRendering.addNoteBtnHandler(e)}),p.state=t.tools&&t.tools.getValue("useNotes"),d.addEventListener("click",()=>p.toggle()),Keyboard.registerShortcut({keys:["n"],callback:()=>p.toggle()}),u.addEventListener("click",()=>m.toggle()),Keyboard.registerShortcut({keys:["v"],callback:()=>m.toggle()}),isMobile()&&(p.state=!0,o.state=!0)}class SearchConstructor extends CustomEventEmmiter{constructor(e){super(),this.app=e}getSearchURL(e){return`https://lek.wiecejnizlek.pl/papi/v2/slides/.search?q=${encodeURIComponent(e)}&include=context,sections,slideshows.screens.lesson`}getSearchContainer(e=!1){if(this.searchContainer=document.createElement("div"),this.searchContainer.className="custom-script-search "+(e?"custom-script-hidden":""),this.searchContainer.innerHTML=SearchConstructor.searchMenu,this.searchResultsContainer=document.createElement("div"),this.searchResultsContainer.className="custom-search-results",this.searchResultsContainer.innerHTML=SearchConstructor.searchInvitation,this.searchContainer.append(this.searchResultsContainer),this.searchInput=this.searchContainer.querySelector("input.custom-search-result"),this.searchContainer.querySelector("form").addEventListener("submit",e=>{e.preventDefault(),this.performSearch()}),e){const t=document.createElement("div");t.className="custom-script-summary-close",t.innerHTML=SVGIcons.chevronUp,this.searchContainer.prepend(t),t.addEventListener("click",()=>this.trigger("dissmiss")),this.searchInput.addEventListener("keyup",e=>{"Escape"===e.key&&(e.preventDefault(),e.stopImmediatePropagation(),this.trigger("dissmiss"))})}return this.searchContainer.querySelector("a.custom-search-submit").addEventListener("click",()=>this.performSearch()),this.setupClearBtn(),this.searchContainer}setupClearBtn(){const e=this.searchContainer.querySelector(".custom-clear-search");this.clearBtnToggle=new ClassToggler("hidden",e),this.clearBtnToggle.invert=!0,e.addEventListener("click",e=>{e.preventDefault(),this.clearSearch()}),this.searchInput.addEventListener("input",e=>{var t=!!this.searchInput.value||!!this.searchResultsContainer.children.length;this.clearBtnToggle.state=t})}clearSearch(){this.searchInput.value="",this.searchResultsContainer.innerHTML=SearchConstructor.searchInvitation,this.clearBtnToggle.state=!1,this.searchInput.focus(),this.trigger("clear")}performSearch(e){this.searchContainer&&(e&&(this.searchInput.value=e),(e=this.searchInput.value)?(this.searchContainer.scrollIntoView({behavior:"smooth"}),e=this.interpretQuery(e),this.trigger("searchStart",e),this.searchResultsContainer.innerHTML=`
            <div class='custom-search-result custom-loading'>
                <div style="height: 2rem;width: 65%;"></div>
                <div style="height: 1.6rem;width: 79%;"></div>
            </div>`.repeat(2),this.getSearchResponseHTML(e).then(e=>{this.searchResultsContainer&&(this.searchResultsContainer.innerHTML="",this.searchResultsContainer.append(...e),this.clearBtnToggle.state=!0),this.trigger("searchEnd")})):this.clearSearch())}interpretQuery(e){let t=e.replace(/"/g,"");let n=(e=e.toLowerCase()).match(/"([^"]+)"/g),s=e.match(/-\w+/g);return s&&s.forEach(e=>{t.replace("-"+e,"")}),t=t.trim(),n=n&&n.map(e=>e.slice(1,-1)),s=s&&s.map(e=>e.slice(1)),{query:t,rawQuery:e,mustContain:n,musntContain:s}}getSearchResponseHTML(n){return __awaiter(this,void 0,void 0,function*(){const e=yield this.searchRequest(n);if(e.length)return e.map(t=>{const e=document.createElement("a");return e.innerHTML=`
                <h5>${t.highlight["snippet.header"]||t.details.header}</h5>
                <h6>${t.highlight["snippet.subheader"]||t.details.subheader}</h6>
                <p>${t.highlight["snippet.content"]||t.details.content}</p>`,e.href=function(e){var t={f1:e.context.lesson,f2:e.context.screen,f3:e.context.slideshow};if(Object.values(t).every(e=>e)){const n=[t.f1.id,t.f2.id,t.f3.order_number];if(n.every(e=>e))return[WNL_LESSON_LINK,...n].join("/")}return e.id?SearchConstructor.WNL_DYNAMIC_SLIDES+e.id:"#"}(t),e.target="_blank",e.className="custom-search-result",e.addEventListener("click",e=>{e.preventDefault(),this.app.tabOpener.openSlide({currentTab:-2,lessonID:t.context.lesson.id,screenID:t.context.screen.id,slide:t.context.slideshow.order_number})}),e});const t=document.createElement("p");return t.innerHTML=`Nie znaleziono frazy <em>${n.rawQuery}</em> :(`,t.style.padding="0.5rem",[t]})}searchRequest(i){return new Promise((s,e)=>{GM_xmlhttpRequest({url:this.getSearchURL(i.query),method:"GET",responseType:"json",onload:({response:e})=>{const t=Object.entries(e),n=t.filter(e=>e[0].match(/^[0-9]+$/)).map(e=>e[1]);e=n.map(e=>({highlight:e.scout_metadata.highlight,details:e.snippet,context:e.context,id:e.id}));s(this.filterSearch(e,i))},onerror:e})})}filterSearch(s,i){return __awaiter(this,void 0,void 0,function*(){let e=s;const t=(e,t)=>t.map(t=>Object.values(e.highlight).some(e=>e.some(e=>this.stripHTMLTags(e).includes(t))));var n;return i.mustContain&&(e=s.filter(e=>t(e,i.mustContain).every(e=>e))),(e=i.musntContain?e.filter(e=>!t(e,i.musntContain).some(e=>e)):e).sort((n=e=>e.context.screen.id===this.app.presentationMetadata.screenID,(e,t)=>n(e)&&!n(t)?-1:1)),(yield this.getTagsAsResults(i)).concat(e)})}getTagsAsResults(t){return __awaiter(this,void 0,void 0,function*(){if(!this.app.notesCollection)return[];const n=this.app.notesCollection.tags,e=yield this.app.notesCollection.getAllTagsWithName(t.query);return e.map(t=>{var e=n.find(e=>e.name===t.content);return{highlight:{"snippet.content":[`<div title='${t.content}'
                         style='background:${e.color};color:${getForegroundColor(e.color)}'
                         class='custom-tag'>${t.content}</div>`]},details:{header:t.presentationTitle,subheader:t.slideTitle},context:{screen:{id:t.screenid},lesson:{id:t.lessonID,name:t.presentationTitle},slideshow:{order_number:t.slide}}}})})}stripHTMLTags(e){return e.toLowerCase().replace(/<[^>]+>/g,"")}}SearchConstructor.searchMenu=`
        <form class="custom-search-input-container">
            <div>
                <input class="custom-search-result" placeholder="Szukaj...">
                <a href='#' class="custom-clear-search hidden">${SVGIcons.removeCircle}</a>
            </div>
            <a class='custom-search-submit'>${SVGIcons.search}</a>
        </form>
        `,SearchConstructor.searchInvitation=`
        <p class="custom-search-invitation">
            <span class='custom-script-heading'>
                ${SVGIcons.search}
                <span>Zacznij wyszukiwanie</span>
            </span>
        </p>`,SearchConstructor.WNL_DYNAMIC_SLIDES="https://lek.wiecejnizlek.pl/app/dynamic/slides/",function(e){let l=[{keys:["ArrowUp"],callback:function(){if(!document.body.querySelector(".fullscreen-mode .wnl-comments")){let e=document.body.querySelector(".present .iv-image-fullscreen");e&&e.click()}}},{keys:["ArrowDown","q","0","Escape"],callback:function(){if(!document.body.querySelector(".fullscreen-mode .wnl-comments")){let e=document.body.querySelector(".wnl-screen .iv-container-fullscreen .iv-close");e&&e.click(),(e=document.body.querySelector(".wnl-screen .image-gallery-wrapper .iv-close"))&&e.click()}}},{keys:["q","0","Escape"],callback:t},{keys:["q","0","Escape"],callback:()=>{Toggles.optionsBtn.state=!1,Toggles.search.state=!1,Toggles.summary.state=!1}},{keys:["m"],callback:()=>function e(t){o=void 0===t?!o:t;toggleBodyClass("custom-script-hide-cursor",!o);o||document.body.addEventListener("mousemove",()=>e(!0),{once:!0})}()},{keys:["o"],callback:()=>Toggles.optionsBtn.toggle()},{keys:["s"],callback:()=>Toggles.optionsBtn.flash(3e3)},{keys:["?","/"],callback:()=>Toggles.search.toggle()},{keys:["l"],callback:()=>Toggles.summary.toggle()},{keys:["Enter"],callback:()=>{const e=document.querySelector(".o-quizQuestionReferenceModal__verify span");e&&e.click()}}];function n(t){var n=t.target.nodeName;if(!("INPUT"===n||"TEXTAREA"===n||t.ctrlKey||t.altKey||t.metaKey)){l.forEach(e=>{e.keys.includes(t.key)&&e.callback(t)});n=t.keyCode;if(48<=n&&n<=57||96<=n&&n<=105){n=t.key;let e=document.querySelectorAll(".m-imageFullscreenWrapper");const i=document.querySelector(".o-referenceModal .quizQuestion");if(i){var s=parseInt(n)-1;const a=i.querySelectorAll(".quizAnswer");if(s>=a.length)return void!void 0;a[s].click()}else if(0<e.length){s=".m-imageFullscreenWrapper .a-icon.sub-id-"+n;const o=document.querySelector(s);o&&o.click()}else{s=".present .a-icon.sub-id-"+n;const r=document.querySelector(s);r&&r.click(),setTimeout(()=>{e=document.querySelectorAll(".m-imageFullscreenWrapper");let s=1;e.forEach(e=>{const t=e.querySelector(".a-icon"),n=(t.classList.add("sub-id-"+s),document.createElement("span"));n.innerText=s.toString(),n.className="image-fullscreen-index",t.appendChild(n),s++})},300)}}}}function s(e){let n=1;e.forEach(t=>{if("childList"===t.type&&t.addedNodes&&0<t.addedNodes.length){let e=t.addedNodes[0];e.className&&e.className.includes("m-referenceTrigger")&&(i(e,n),n++)}})}function i(e,t){if(!e.className.includes("sub-id-")){const n=document.createElement("sub");n.innerText=t.toString(),n.className="small",e.classList.add("sub-id-"+t),e.appendChild(n)}}function a(e){const t={top:e,left:0,behavior:GM_getValue("option_smoothScroll")?"smooth":"auto"},n=[document.querySelector(".present .present"),document.querySelector(".m-modal__content"),document.querySelector(".wnl-comments")];n.forEach(e=>{e&&e.scrollBy(t)})}function t(){let e=document.body.querySelector(".a-icon.m-modal__header__close");e&&e.click()}e.registerShortcut=function(e){l.push(e)},isMobile()||document.addEventListener("fullscreenchange",e=>{document.fullscreenElement||(document.querySelector(".o-referenceModal")?(t(),toggleFullscreen()):Toggles.search.state?(Toggles.search.state=!1,toggleFullscreen()):Toggles.summary.state&&(Toggles.summary.state=!1,toggleFullscreen()))}),e.setupControl=function(e){const t=document.querySelectorAll(".slides .stack");t.length&&(t.forEach(e=>{let t=1;const n=e.querySelectorAll(".a-icon");n.forEach(e=>i(e,t++))}),(e=e).slideObserver=new MutationObserver(s),e.slideObserver.observe(document.querySelector("div.slides"),{childList:!0,subtree:!0}),document.body.addEventListener("keydown",e=>(" "!==e.key&&"l"!==e.key||e.stopImmediatePropagation(),"ArrowUp"===e.key?(a(-60),!1):"ArrowDown"===e.key||" "===e.key?(a(60),!1):void 0)),document.body.addEventListener("keyup",n))},e.disableControl=function(){document.body.removeEventListener("keyup",n)};let o=!0}(Keyboard=Keyboard||{});const slideshowOptionsBtn=`
    <a class="custom-options-btn custom-script-slideshow-btn wnl-rounded-button">
        <div class="a-icon -x-small" title="Opcje">
            ${SVGIcons.chevronUp}
        </div>
    </a>`,slideshowOptions=`
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
    </a>`;function addSlideOptions(e){const t=document.querySelector(".wnl-rounded-button.bookmark");if(t){var n=e.searchInSlideshow.getSearchContainer(!0);e.searchInSlideshow.addEventListener("dissmiss",()=>Toggles.search.state=!1),e.searchInSlideshow.addEventListener("searchEnd",()=>e.searchInSlideshow.searchInput.focus()),document.querySelector(".order-number-container").after(n);const s=document.createElement("div"),i=(s.innerHTML=slideshowOptionsBtn,document.createElement("div"));i.className="custom-script-hidden custom-script-additional-options",i.innerHTML=slideshowOptions,s.append(i),t.after(s),i.prepend(t),s.querySelector(".custom-options-btn").addEventListener("click",()=>Toggles.optionsBtn.toggle()),s.querySelector(".custom-search-btn").addEventListener("click",()=>{Toggles.optionsBtn.state=!1,Toggles.search.toggle()}),s.querySelector(".custom-zoom-up-btn").addEventListener("click",()=>{e.options&&e.options.setValue("percentIncrease",e=>e+5)}),s.querySelector(".custom-zoom-down-btn").addEventListener("click",()=>{e.options&&e.options.setValue("percentIncrease",e=>e-5)})}}function addSummary(e){const t=document.createElement("div"),n=(t.className="custom-script-summary custom-script-hidden",document.createElement("div"));n.className="custom-script-summary-close",n.innerHTML=SVGIcons.chevronUp,t.prepend(n),n.addEventListener("click",()=>Toggles.summary.state=!1),e.slideshowChapters.render(t),document.querySelector(".order-number-container").after(t)}function addChapterInfo(e){addPageNumberContainer(),addSummary(e),e.slideshowChapters.addEventListener("activeChange",()=>updateChapterProgress(e)),e.slideshowChapters.setCurrentPage(e.slideNumber)}function updateChapterProgress(e){return __awaiter(this,void 0,void 0,function*(){const t=document.querySelector(".custom-script-page-number-container");if(t){const n=e.slideshowChapters.getProgress();if(n){let e;for(;e=n.pop(),n.length&&e.actualLength<5;);const s=t.querySelector(".current-number"),i=(s.innerText=e.current.toString(),t.querySelector(".n-of-pages"));i.innerText=e.actualLength.toString()}}})}function addPageNumberContainer(){const t=["custom-script-page-number-container","current-number","","n-of-pages"].map(e=>{const t=document.createElement("span");return t.className=e,t});t[2].innerText="/";for(let e=1;e<=3;e++)t[0].appendChild(t[e]);return document.querySelector(".order-number-container").after(t[0]),t[0].addEventListener("click",()=>Toggles.summary.toggle()),t[0]}class App extends CustomEventEmmiter{constructor(){super(...arguments),this._loaded=!1,this.isAwaiting=!1}get loaded(){return this._loaded}get slideNumber(){return this.presentationMetadata.slideNumber}set slideNumber(e){this.presentationMetadata.slideNumber=e}onLoaded(){this.slideshowChapters=this.presentationMetadata.slideshowChapters,this.options.addSettings(getOptions(this)),this.notesRendering=new NotesRendering(this),this.tools.addSettings(getToolsConfig(this)),(this.appDiv||(this.appDiv=document.querySelector(".wnl-app-layout.wnl-course-layout"),this.appDiv))&&(this.presentationMetadata.observe(),this.presentationMetadata.addEventListener("slideChange",e=>this.trigger("slideChange",e)),this.tabOpener=new TabOpener(this),this.setBackground(),this.searchInSlideshow=new SearchConstructor(this),this.searchInBottomContainer=new SearchConstructor(this),this.lessonView=document.querySelector(".wnl-lesson-view"),null!==this.lessonView&&this.addBottomContainer(),GM_getValue("option_keyboardControl")&&Keyboard.setupControl(this),addChapterInfo(this),addSlideOptions(this),this.addEventListener("slideChange",()=>this.updateTabTitle()),this._loaded=!0,this.trigger("loaded"),this.presentationMetadata.addEventListener("screenidChange",e=>this.checkUnloaded()),unsafeWindow.addEventListener("beforeunload",e=>{this.onUnload()}))}setBackground(){var e={image:"image-custom-background",white:"white-custom-background",black:"dark-custom-background"},t=this.options.getValue("changeTheme");if("default"!==t){const n=Object.values(e),s=document.querySelector(n.map(e=>"."+e).join(","));null!==s&&(s.classList.remove(...n),s.classList.add(e[t]))}}addBottomContainer(){this.bottomContainer=document.createElement("div"),this.bottomContainer.className="custom-script-bottom-container",this.addSliderContainer(),this.bottomContainer.append(this.searchInBottomContainer.getSearchContainer(!1)),this.addToolsContainer(),this.addSettingsContainer(),this.lessonView.append(this.bottomContainer)}addTagListContainer(){const e=document.createElement("div");e.style.order="-1",e.className="custom-tagListContainer",e.innerHTML=`
            <span class='custom-heading'>
                ${SVGIcons.tags}
                <span class='metadata'>tagi</span>
            </span>
            <div class=custom-tagList></div>`,this.bottomContainer.append(e)}setupObserveSidenav(){function n(e){if(e)for(const t of e)if(t.classList&&t.classList.contains("wnl-sidenav-slot"))return t}this.sidenavObserver||(this.sidenavObserver=new MutationObserver(e=>{for(const t of e)n(t.addedNodes)&&this.trigger("sidenavOpened",!0),n(t.removedNodes)&&this.trigger("sidenavOpened",!1)}),this.sidenavObserver.observe(this.appDiv,{childList:!0}),this.addEventListener("unloaded",()=>this.sidenavObserver.disconnect()))}updateTabTitle(){if(this.options.getValue("changeTitle")&&this.presentationMetadata){let e,t=(e=(e=this.presentationMetadata.presentationName)&&e.match(/\w/)?e+" - ":"",this.presentationMetadata.slideTitle);t=t&&t.match(/\w/)?t+" - ":"";var n=this.originalTitle||"LEK - Kurs - Więcej niż LEK";document.title=t+e+n}}addSliderContainer(){var e=document.querySelector("input.custom-script-font-size-input");if(!e){const t=document.createElement("div");t.innerHTML=zoomSliderHTML,t.className="custom-script-zoom-slider-container",this.bottomContainer.appendChild(t),t.querySelector("input.custom-script-font-size-input").addEventListener("input",e=>document.querySelector(".custom-script-font-size-label").innerText=e.target.value+"%"),t.querySelector(".custom-script-font-size-input-increase").addEventListener("click",()=>{this.options.setValue("percentIncrease",e=>e+5)}),t.querySelector(".custom-script-font-size-input-decrease").addEventListener("click",()=>{this.options.setValue("percentIncrease",e=>e-5)})}}addToolsContainer(){var e=document.querySelector(".custom-script-tools-container");if(!e){const t=document.createElement("div");t.classList.add("custom-script-tools-container"),t.innerHTML=`
            <span class='custom-heading'>
                ${SVGIcons.tools}
                <span class="metadata">narzędzia</span>
            </span>
            <div></div>`,this.bottomContainer.appendChild(t),t.append(this.tools.render())}}addSettingsContainer(){var e=document.querySelector(".custom-script-settings-container");if(!e){const t=document.createElement("div"),n=(t.classList.add("custom-script-settings-container"),t.innerHTML=`
            <span class='custom-heading'>
                ${SVGIcons.gear}
                <span class="metadata">ustawienia</span>
            </span>
            <div></div>`,this.bottomContainer.appendChild(t),t.append(this.options.render()),this.options.getSetting("percentIncrease"));n.lowerLimit=60,n.upperLimit=200}}init(){this.options=new Settings(this),this.tools=new Settings(this),this.awaitLoad(),this.appDiv=document.querySelector(".wnl-app-layout.wnl-course-layout"),this.presentationMetadata=new PresentationMetadata(this)}awaitLoad(){let e;this.isAwaiting=!0,e=setInterval(()=>{if(document.querySelector(".custom-script-page-number-container"))return this.isAwaiting=!1,void clearInterval(e);document.querySelector(".order-number-container")&&(this.isAwaiting=!1,clearInterval(e),this.onLoaded())},300)}checkUnloaded(){var e=document.querySelector(".custom-script-page-number-container");this.isAwaiting||e||(this.onUnload(),this.awaitLoad())}onUnload(){this._loaded=!1,this.trigger("unloaded"),this.options&&this.options.getValue("changeTitle")&&(document.title=this.originalTitle),this.currentSlideNotes&&this.currentSlideNotes.commitChanges().then(()=>{this.notesCollection=void 0,this.currentSlideNotes=void 0}),this.presentationMetadata.removeAllListeners("slideChange"),this.slideObserver&&this.slideObserver.disconnect()}}!function(){"use strict";try{__SENTRY__.hub.getClient().getOptions().enabled=!1}catch(e){}if(unsafeWindow.top==unsafeWindow.self){const e=new App;e.init(),console.log({app:e})}}();
!function(){const t=document.createElement("style");t.innerHTML=`:root {
    --uniform-font-size: 0.93em;
    --scaled-font-size: 110%;
}

html {
    scroll-behavior: smooth;
}

.custom-script-bottom-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-top: 1rem;
    gap: 1rem;
}

.custom-script-bottom-container>div {
    border: 1px solid rgb(239, 240, 243);
    padding: 15px;
    flex-grow: 1;
    flex-basis: 45%;
}

.questionsList__paginationContainer {
    /* position: absolute!important; */
    top: 0;
    left: 0;
    z-index: 1000;
    background: white;
}

.custom-script-increase-font-size .sl-block-content span[style*='21px'] {
    font-size: 0.75em !important;
}

.custom-script-option-container {
    padding: 5px 15px;
}

.custom-script-option-container:hover {
    background-color: #f6f6f6
}

a.custom-script-option {
    color: #0c1726
}

.custom-script-increase-annotations article.content.-styleguide p {
    font-size: var(--scaled-font-size);
    line-height: 150%;
}

.custom-script-increase-font-size .sl-block-content p {
    font-size: var(--scaled-font-size) !important;
}

.custom-script-uniform-font-size .sl-block-content :not(h1, h2, h3, h1 *, h2 *, h3 *, sub) {
    font-size: var(--uniform-font-size) !important;
}

@media screen and (orientation:landscape) {
    section.stack.present section {
        overflow-y: auto;
        overflow-x: hidden;
        padding-bottom: 1em;
    }
}

@media screen and (max-width: 980px) {

    .custom-notes-view-btn,
    .custom-tags-view-btn {
        display: none !important;
    }

    div.custom-tag:not(.editing) .custom-remove,
    div.custom-tag:not(.editing) .custom-change-color {
        width: 16px;
    }

    .custom-script-bottom-container>div {
        flex-basis: 100%;
    }
}

@media screen and (orientation: landscape) {
    .reveal.reveal-viewport.image-custom-background {
        background-size: max(var(--scaled-font-size),100%);
        background-position-y: min(100%, calc(200% - var(--scaled-font-size)));
    }
}

@media screen and (min-width: 980px) {
    .fullscreen .reveal.reveal-viewport.image-custom-background {
        background-position-y: max(100%,var(--scaled-font-size));
        background-size: 120%;
    }
}

@media screen and (orientation: portrait) and (max-width: 980px) {
    .slides {
        height: 259vh !important;
    }

    .stack.present section.present {
        display: flex !important;
        align-items: center;
        flex-direction: column;
        gap: 3rem;
        justify-content: center;
    }

    .reveal-scope .reveal .sl-block {
        position: unset !important;
    }
}

.custom-script-increase-font-size .wnl-reference {
    margin-left: 0.5em
}

.custom-script-increase-font-size .wnl-reference svg,
.custom-script-uniform-font-size .wnl-reference svg {
    transform: scale(1.6) !important;
}

sub.small {
    margin-left: 0.5rem !important;
    font-size: 1.5rem !important;
}

.m-imageFullscreenWrapper {
    max-height: 80vh;
    text-align: center;
}

.m-imageFullscreenWrapper img {
    max-height: 80vh;
    margin: auto !important;
}

.image-fullscreen-index {
    margin: 0 0.3rem;
    color: #8b8b8b;
    padding: 0;
    font-size: 0.8rem;
}

.custom-script-setting {
    padding: 0.3rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.custom-script-setting svg {
    flex-shrink: 0;
}

.custom-script-setting * {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    margin-right: 0 !important;
}

.custom-setting-divider {
    padding: 0.5rem;
}

.custom-setting-divider>div {
    border-bottom: solid 1px #eff0f3;
}

.custom-script-page-number-container {
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

body.custom-script-hide-cursor {
    cursor: none;
}

.custom-script-hidden {
    visibility: hidden;
    top: -70vh !important;
}

.custom-script-summary-close {
    text-align: center;
    cursor: pointer;
    background: #ffffff8c;
    margin: 0.2rem;
    border-radius: 5px;
    height: 16px;
}

.custom-script-summary-link-container ul {
    margin-left: 1rem;
}

.custom-script-summary-link-container:not(.active) ul {
    display: none;
}

.custom-script-summary-link-container.active>a {
    font-weight: 700;
}

.custom-script-summary {
    left: 10px;
}

.slideshow-container .custom-script-search {
    right: 10px;
}

.custom-script-summary,
.slideshow-container .custom-script-search,
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

.custom-script-search {
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.custom-script-search>.custom-search-results {
    height: 100%;
    overflow-y: auto;
    max-height: 70vh;
}

p.custom-search-invitation {
    display: flex;
    height: 100%;
    opacity: 0.6;
    justify-content: center;
    align-items: center;
    padding: 0.5rem;
}

.custom-search-input-container {
    display: flex;
    align-items: center;
    gap: 0.2rem;
}

.custom-search-result.custom-loading {
    opacity: 0.6;
}

.custom-search-result.custom-loading:nth-child(2) {
    opacity: 0.3;
}

.custom-search-result.custom-loading>div {
    background: linear-gradient(314deg, #707070, #ffffff);
    background-size: 400% 400%;
    margin: 0.4rem 0;
    border-radius: 5px;
    animation: LoadingParagraph 4s ease infinite;
}

@keyframes LoadingParagraph {
    0% {
        background-position: 0% 50%
    }

    50% {
        background-position: 100% 50%
    }

    100% {
        background-position: 0% 50%
    }
}

a.custom-clear-search {
    position: absolute;
    display: flex;
    right: 4px;
    color: #555;
}

.custom-search-input-container a.custom-search-submit {
    display: flex;
    padding: 0 0.4rem;
}

.custom-search-input-container div {
    display: flex;
    align-items: center;
    flex-grow: 1;
    position: relative;
}

.custom-search-input-container input {
    width: 100%;
    border-radius: 0;
    border: 0;
    background: #eff0f3;
}

.slideshow-container .custom-search-input-container input {
    border-radius: 5px;
    background: white;
    border: solid 1px #666;
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
    flex-shrink: 0;
}

.custom-script-bottom-container .custom-search-result {
    background: #eff0f3;
}

.custom-search-result em {
    font-weight: 900;
    padding-right: 0.2rem;
}

.custom-tagList {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
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

a.custom-options-btn.active svg {
    transform: none;
}

.custom-script-font-size-label {
    margin: 0 0.5rem;
    height: 16px;
    font-size: 24px;
    vertical-align: top;
    width: 4.3rem;
    display: inline-block;
    text-align: center;
}

.custom-script-font-size-input-increase,
.custom-script-font-size-input-decrease {
    vertical-align: sub;
}

.custom-script-font-size-input,
.custom-script-setting input[type=range] {
    -webkit-appearance: none;
    appearance: none;
    margin-right: 0.9em;
    outline: none;
    height: 0.6rem;
    background: #96dbdf !important;
    border-radius: 5px;
    vertical-align: middle;
}

.custom-script-font-size-input::-webkit-slider-thumb,
.custom-script-setting input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
    width: 0.8rem;
    height: 0.8rem;
    background: var(--color-primary-text);
    border-radius: 0.4rem;
}

.custom-script-font-size-input::-moz-range-thumb {
    cursor: pointer;
    width: 0.8rem;
    height: 0.8rem;
    background: var(--color-primary-text);
    border-radius: 0.4rem;
}

.custom-notes-btns-container {
    flex-direction: row;
    align-items: flex-start;
    flex-wrap: wrap-reverse;
    display: none !important;
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
    z-index: 12 !important;
}

.custom-notes-btns-container .wnl-rounded-button {
    color: black !important;
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

.custom-script-notes-column .custom-note .custom-note-move {
    display: none;
}

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
    font-size: 1.6rem !important;
    background: #feffcc;
    position: absolute;
    border: solid 2px #b1b18e;
    padding: 0.5rem 35px 0.5rem 0.5rem !important;
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
.custom-tag form {
    display: none;
}

.custom-note.editing form,
.custom-tag.editing form {
    display: block;
}

.custom-note.editing .custom-note-content,
.custom-tag.editing .custom-tag-content {
    display: none;
}

.custom-note textarea,
.custom-tag input {
    appearance: none;
    border: none;
    width: 100% !important;
    height: 100% !important;
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

.custom-notes-overlay a.custom-note-remove,
a.custom-note-move {
    position: absolute !important;
    right: 4px;
    color: black !important;
    width: 25px;
    height: 25px;
    transition: color 0.5s;
}

.custom-notes-overlay a.custom-note-remove svg,
a.custom-note-move svg {
    width: 25px;
    height: 25px;
}

a.custom-note-remove:hover {
    color: red !important;
}

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
.inactive.custom-notes-additional-btns>.wnl-rounded-button {
    width: 0;
    margin: 5px 0;
}

.custom-new-tag.custom-tag:only-child {
    display: none;
}

.custom-while-active {
    display: none !important;
}

.active .custom-while-active.a-icon {
    display: inline-flex !important;
}

.active .custom-while-inactive {
    display: none !important;
}

.custom-script-use-notes.custom-script-notes-visible .custom-notes-overlay {
    display: block !important;
}

.custom-script-use-notes .custom-notes-btns-container,
.custom-script-use-notes.custom-script-tags-visible div.custom-tags-container {
    display: flex !important;
}

.custom-main-nav-container>a svg {
    transition: transform 0.5s;
    transform: rotateX(180deg);
}

.custom-main-nav-container>a {
    display: flex;
    padding: 15px;
    width: 100%;
    gap: 0.4rem;
    text-align: center;
    align-items: center;
    font-size: 11px;
}

.custom-main-nav-container.active>a svg {
    transform: none;
}

.custom-main-nav-container>div {
    transition: height 0.6s;
    height: 0;
    overflow: hidden;
}

.custom-main-nav-container.active>div {
    height: 100%;
    overflow: auto;
}

.custom-main-nav-container.active {
    height: 100%;
}

.custom-main-nav-container {
    transition: height 0.6s;
    height: 3.3rem;
    padding-bottom: 3.3rem;
}

span.custom-heading {
    margin-bottom: 0.9rem;
    display: flex;
    gap: 0.4rem;
}

.custom-script-hideBottomSearch .custom-script-bottom-container .custom-script-search,
.custom-script-hideTools .custom-script-tools-container,
.custom-script-hideTags .custom-tagListContainer,
.custom-script-hide-chat .wnl-chat-toggle {
    display: none !important;
}

.custom-script-hide-chat .wnl-course-content.wnl-column {
    max-width: initial !important;
}

.custom-script-invert-images img.iv-large-image,
.logo-mobile {
    filter: invert(1) hue-rotate(180deg) saturate(1.4);
}

.custom-script-slide-nav-chat .navigate-right.wnl-slideshow-control,
.custom-script-slide-nav-chat .navigate-left.wnl-slideshow-control {
    opacity: 0.2;
    transition: opacity 0.4s;
}

.custom-script-slide-nav-chat .navigate-right.wnl-slideshow-control:hover,
.custom-script-slide-nav-chat .navigate-left.wnl-slideshow-control:hover {
    opacity: 1;
}`,document.head.append(t)}();
// ==UserScript==
// @name         WnL customization (beta)
// @namespace    http://tampermonkey.net/
// @version      1.10.6b
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
