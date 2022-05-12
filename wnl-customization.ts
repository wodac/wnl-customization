// ==UserScript==
// @name         WnL customization
// @namespace    http://tampermonkey.net/
// @version      1.9.8
// @description  NIEOFICJALNY asystent WnL
// @author       wodac
// @updateURL    https://github.com/wodac/wnl-customization/raw/modular/dist/wnl-customization.user.js
// @match        https://lek.wiecejnizlek.pl/app/*
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

// import { ParsedSearchResult, SearchResults, SlideshowChapterMetadata } from "./interfaces";
// import './globals'
// import './style'

(function() {
    'use strict';

    const h = 'test'
    console.log('userscript loaded!')
    // Your code here...


    const slider = `<div style="margin-top: 2em;">
    <label style="margin-right: 0.9em;">POWIĘKSZENIE</label>
    <input class="custom-script-font-size-input" type="range" size="3" maxlength="3" min="70" class="" max="200" step="5" style="height: 0.8em;margin-right: 0.9em;">
    <a class="button is-primary is-small">-</a>
    <label class="custom-script-font-size-label">120%</label>
    <a class="button is-primary is-small">+</a>
    </div>`

    const sidebarSettings = `<span class="item-wrapper heading" style="padding: 15px;">Ustawienia</span>`
function onRemove(element, callback) {
  const parent = element.parentNode;
  if (!parent) throw new Error("The node must already be attached");

  const obs = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const el of mutation.removedNodes) {
        if (el === element) {
          obs.disconnect();
          callback();
        }
      }
    }
  });
  obs.observe(parent, {
    childList: true,
  });
}

    function onLoaded() {
        console.log('loaded')
        let background = document.querySelector(".image-custom-background")
        if (background !== null) {
            background.classList.remove("image-custom-background")
            background.classList.add("white-custom-background")
        }

        const lessonView = document.querySelector('.wnl-lesson-view')
        if (lessonView !== null) {
            console.log({lessonView})
            const sliderContainer = document.createElement('div')
            sliderContainer.innerHTML = slider
            lessonView.appendChild(sliderContainer)
            sliderContainer.querySelector('input.custom-script-font-size-input')
                .addEventListener('input', e => 
                    (document.querySelector('label.custom-script-font-size-label') as HTMLElement).innerText = `${(e.target as HTMLInputElement).value}%`
                )
        }

        let sidebar = document.querySelector('aside.sidenav-aside.course-sidenav')
        sidebarSettingsContainer = document.createElement('div')
        if (sidebar !== null) sidebar.prepend(sidebarSettingsContainer)
        else {
            const sidebarToggle = document.querySelector('.wnl-navbar-item.wnl-navbar-sidenav-toggle')
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', event => {
                    sidebar = document.querySelector('aside.sidenav-aside.course-sidenav')
                    if (sidebar) sidebar.prepend(sidebarSettingsContainer)
                })
            }
        }

        if (GM_getValue(`option_keyboardControl`)) setupKeyboardControl()

        getMetadata(metadata => {
            console.log({ metadata })
            if (!metadata) return
            const pageNumberContainer = addPageNumberContainer()
            addSummary(metadata)
            const getChapterIndex = page => {
                const i = metadata.findIndex(m => m.startPage > page) - 1
                return i >=0 ? i : metadata.length - 1
            }
            const slideChanged = current => {
                const chapterIndex = getChapterIndex(current)
                const chapterMetadata = metadata[chapterIndex]
                const relativeCurrent = current - chapterMetadata.startPage + 1
                const chapterLength = chapterMetadata.chapterLength
                const relativeCurrentContainer = pageNumberContainer.querySelector('.current-number') as HTMLSpanElement;
                relativeCurrentContainer.innerText = relativeCurrent.toString()
                const chapterLengthContainer = pageNumberContainer.querySelector('.n-of-pages') as HTMLSpanElement
                chapterLengthContainer.innerText = chapterLength.toString()
                if (summaryContainer) {
                    summaryContainer.querySelectorAll('a').forEach(a => a.classList.remove('is-active'))
                    const active = summaryContainer.querySelector(`[data-index="${chapterIndex}"]`)
                    active.classList.add('is-active')
                }
            }
            observeSlideNumber(slideChanged)
            const slideNumberSpan = document.querySelector('.order-number-container') as HTMLSpanElement
            slideChanged( parseInt(slideNumberSpan.innerText) )
        })

        addSlideOptions()

        toRunOnLoaded.forEach(cb => cb())
    }

    setTimeout(() => {
        let loaderOverlay = document.querySelector('.app__overlayLoader')
        if (loaderOverlay !== null) {
            console.log('overlay detected')
            onRemove(loaderOverlay, onLoaded)
        }
    }, 1000)

    console.log('end!')
})();

