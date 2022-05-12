// ==UserScript==
// @name         WnL customization
// @namespace    http://tampermonkey.net/
// @version      1.9.6
// @description  NIEOFICJALNY asystent WnL
// @author       wodac
// @updateURL    https://github.com/wodac/wnl-customization/raw/modular/dist/wnl-customization.js
// @require      https://github.com/wodac/wnl-customization/raw/modular/dist/style.user.js
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
    const getUniformFontSize = fontSize => (fontSize - 100) * 0.01 + 0.93
    const root = unsafeWindow.document.querySelector(":root") as HTMLElement
    const updateFontSize = (fontSize: number) => {
        root.style.setProperty("--uniform-font-size", `${getUniformFontSize(fontSize)}em`)
        root.style.setProperty("--scaled-font-size", `${fontSize}%`)
    }
    const getSearchURL = (q: string) => `https://lek.wiecejnizlek.pl/papi/v2/slides/.search?q=${encodeURIComponent(q)}&include=context,sections,slideshows.screens.lesson`
    const WNL_DYNAMIC_SLIDES = 'https://lek.wiecejnizlek.pl/app/dynamic/slides/'

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

    const slideshowOptionsBtn = `
    <a class="custom-options-btn custom-script-slideshow-btn wnl-rounded-button" style="top: 10px;">
        <div class="a-icon -x-small" title="Opcje">
            ${svgIcons.chevronUp}
        </div>
    </a>`

    const slideshowOptions = `
    <a class="custom-search-btn custom-script-slideshow-btn wnl-rounded-button" style="top: 110px;">
        <div class="a-icon -x-small" title="Szukaj" style="margin: 0;padding: 0;">
            ${svgIcons.search}
        </div>
        <span class="custom-btn-caption">SZUKAJ</span>
    </a>
    <a class="custom-zoom-up-btn custom-script-slideshow-btn wnl-rounded-button" style="top: 160px;">
        <div class="a-icon -x-small" title="Powiększ">
            ${svgIcons.zoomIn}
        </div>
    </a>
    <a class="custom-zoom-down-btn custom-script-slideshow-btn wnl-rounded-button" style="top: 210px;">
        <div class="a-icon -x-small" title="Powiększ">
            ${svgIcons.zoomOut}
        </div>
    </a>`

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

    const document = unsafeWindow.document

    function openMenu() {
        const menuBtn = document.querySelector('.topNavContainer__beforeLogo.topNavContainer__megaMenuMobileEntryPoint') as HTMLElement
        if (menuBtn) menuBtn.click()
    }

    let slideOptionsContainer, additionalOptionsContainer
    function addSlideOptions() {
        const bookmarkBtn = document.querySelector('.wnl-rounded-button.bookmark')
        if (!bookmarkBtn) return
        addSearchContainer()
        slideOptionsContainer = document.createElement('div')
        slideOptionsContainer.innerHTML = slideshowOptionsBtn
        additionalOptionsContainer = document.createElement('div')
        additionalOptionsContainer.className = 'custom-script-hidden custom-script-additional-options'
        additionalOptionsContainer.innerHTML = slideshowOptions
        slideOptionsContainer.append(additionalOptionsContainer)
        bookmarkBtn.after(slideOptionsContainer)
        additionalOptionsContainer.prepend(bookmarkBtn)
        slideOptionsContainer.querySelector('.custom-options-btn').addEventListener('click', () => toggleOptions())
        slideOptionsContainer.querySelector('.custom-search-btn').addEventListener('click', () => {
            toggleOptions(false)
            toggleSearch(true)
        })
        slideOptionsContainer.querySelector('.custom-zoom-up-btn').addEventListener('click', () => {
            if (options) {
                options.setOptionState(state => { return { value: state.value+5 } }, 'percentIncrease')
            }
        })
        slideOptionsContainer.querySelector('.custom-zoom-down-btn').addEventListener('click', () => {
            if (options) {
                options.setOptionState(state => { return { value: state.value-5 } }, 'percentIncrease')
            }
        })
    }

    function getMetadata(cb: (metadata: SlideshowChapterMetadata[] | false) => any, menuOpened?: boolean) {
        const menu = document.querySelector('aside.sidenav-aside')
        if (!menu) {
            if (menuOpened) {
                cb(false)
                return
            }
            openMenu()
            setTimeout(() => getMetadata(cb, true), 100)
            return
        }
        const active = menu.querySelector('.item-wrapper.is-active')
        if (!active) {
            cb(false)
            return
        }
        const listParent = active.parentElement
        if (!listParent) {
            cb(false)
            return
        }
        const list = Array.from(listParent.children)
        if (menuOpened) (document.querySelector('.topNavContainer__close') as HTMLElement).click()
        if (list.length === 0) {
            cb(false)
            return
        }
        const wrappers = list.filter(el => el.nodeName === 'DIV')
        if (wrappers.length === 0) {
            cb(false)
            return
        }
        const links = wrappers.map(div => div.querySelector('a'))
        const getLength = (t: string) => parseInt( t.slice(1, -1) )
        const linksMetadata = links.map(a => {
            if (!a.href) return {}
            return {
                href: a.href,
                name: (a.querySelector('span span') as HTMLSpanElement).innerText,
                chapterLength: getLength((a.querySelector('span span.sidenav-item-meta') as HTMLSpanElement).innerText),
                startPage: parseInt( a.href.split('/').pop() )
            }
        })
        cb(linksMetadata)
    }

    function addPageNumberContainer(): HTMLSpanElement {
        const classNames = [ 'custom-script-page-number-container', 'current-number', 'number-divider', 'n-of-pages' ]
        const spans = classNames.map(name => {
            const span = document.createElement('span')
            span.className = name
            return span
        })
        spans[2].innerText = '/'
        for (let i = 1; i <= 3; i++) {
            spans[0].appendChild(spans[i])
        }
        document.querySelector('.order-number-container').after(spans[0])
        spans[0].addEventListener('click', () => toggleSummary())
        return spans[0]
    }

    function searchRequest(q: string): Promise<ParsedSearchResult[]> {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                url: getSearchURL(q),
                method: 'GET',
                responseType: "json",
                onload: ({ response }: { response: SearchResults }) => {
                    const entries = Object.entries(response)
                    const results = entries.filter( el => el[0].match(/^[0-9]+$/) ).map(el => el[1])
                    const parsed = results.map(el => {
                        return {
                            highlight: el.scout_metadata.highlight,
                            details: el.snippet,
                            context: el.context,
                            id: el.id
                        }
                    })
                    resolve(parsed)
                },
                onerror: reject
            })
        })
    }
    async function getSearchResponseHTML(q: string): Promise<string> {
        const response = await searchRequest(q)
        return response.map(el => `
            <a href='${WNL_DYNAMIC_SLIDES+el.id}' target='_blank' class='custom-search-result'>
                <h5>${el.highlight['snippet.header'] || el.details.header}</h5>
                <h6>${el.highlight['snippet.subheader'] || el.details.subheader}</h6>
                <p>${el.highlight['snippet.content'] || el.details.content}</p>
            </a>
            `).join('')
    }
    function performSearch() {
        if (!searchContainer) return
        const q = (searchContainer.querySelector('input.custom-search-result') as HTMLInputElement).value
        getSearchResponseHTML(q).then(resp => {
            if (searchResultsContainer) searchResultsContainer.innerHTML = resp
            toggleSearch(true)
        })
    }


    let searchContainer: HTMLDivElement, searchResultsContainer: HTMLDivElement
    function addSearchContainer() {
        searchContainer = document.createElement('div')
        searchContainer.className = 'custom-script-search custom-script-hidden'
        searchContainer.innerHTML = `
            <input class="custom-search-result" style="width: 80%;display: inline-block;">
            <a class='custom-search-submit' style="font-size: 1.2rem;padding:0.1rem;">${svgIcons.search}</a>
            `
        const closeBtn = document.createElement('div')
        closeBtn.className = 'custom-script-summary-close'
        closeBtn.innerHTML = svgIcons.chevronUp
        searchContainer.prepend(closeBtn)
        closeBtn.addEventListener('click', () => toggleSearch(false))
        searchResultsContainer = document.createElement('div')
        searchContainer.append(searchResultsContainer)
        document.querySelector('.order-number-container').after(searchContainer)
        searchContainer.querySelector('input.custom-search-result').addEventListener('change', () => performSearch())
        searchContainer.querySelector('a.custom-search-submit').addEventListener('click', () => performSearch())
    }

    let summaryContainer: HTMLDivElement
    function addSummary(metadata) {
        const linksHTML = metadata.map((e, i) =>
           `<a class='custom-script-summary-link' href='${e.href}'
               data-start-page=${e.startPage} data-index=${i}>
                   <span>${e.name} </span>
                   <span class='small'>(${e.chapterLength})</span>
           </a>`
        ).join('')
        summaryContainer = document.createElement('div')
        summaryContainer.className = 'custom-script-summary custom-script-hidden'
        summaryContainer.innerHTML = linksHTML
        const closeBtn = document.createElement('div')
        closeBtn.className = 'custom-script-summary-close'
        closeBtn.innerHTML = svgIcons.chevronUp
        summaryContainer.prepend(closeBtn)
        closeBtn.addEventListener('click', () => toggleSummary(false))
        document.querySelector('.order-number-container').after(summaryContainer)
    }

    function toggleSearch(visible?: boolean) {
        if (!searchContainer) return
        if (typeof visible === 'undefined') visible = searchContainer.className.includes('custom-script-hidden')
        if (visible) {
            searchContainer.classList.remove('custom-script-hidden')
            setTimeout(() => (searchContainer.querySelector('input.custom-search-result') as HTMLInputElement).focus(), 100)
        }
        else searchContainer.classList.add('custom-script-hidden')
    }

    function toggleSummary(visible?: boolean) {
        if (!summaryContainer) return
        if (typeof visible === 'undefined') visible = summaryContainer.className.includes('custom-script-hidden')
        if (visible) summaryContainer.classList.remove('custom-script-hidden')
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

    function toggleBodyClass(className, isOn) {
        let body = document.body
        if (isOn) body.classList.add(className)
        else body.classList.remove(className)
    }

    let slideObserver
    function observeSlides(cb) {
        console.log('observeSlides')
        slideObserver = new MutationObserver(cb)
        slideObserver.observe(document.querySelector('div.slides'), {
            childList: true,
            subtree: true
        });
    }

    let slideNumberObserver
    function observeSlideNumber(cb) {
        console.log('observe slide number')
        const slideNumberSpan = document.querySelector('.order-number-container') as HTMLSpanElement
        slideNumberObserver = new MutationObserver(() => {
            const number = parseInt(slideNumberSpan.innerText)
            cb(number)
        })
        slideNumberObserver.observe(slideNumberSpan, {
            subtree: true,
            characterData: true
        });
    }

    function addSubsToIcons(mutations) {
        console.log('mutation observed')
        let counter = 1
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes && mutation.addedNodes.length > 0) {
                console.log('node added')
                let icon = mutation.addedNodes[0]
                if (icon.className.includes('a-icon')) {
                    processIcon(icon, counter)
                    counter++
                }
            }
        })
    }

    function processIcon(icon, counter) {
        const genSub = (counter) => {
            const sub = document.createElement('sub')
            sub.innerText = counter
            sub.className = `small`
            return sub
        }
        icon.classList.add(`sub-id-${counter}`)
        icon.appendChild(genSub(counter))
        console.log('icon added')
    }

    function scrollView(y) {
        const behavior = GM_getValue(`option_smoothScroll`) ? 'smooth' : 'auto'
        const options = { top: y, left: 0, behavior } as ScrollToOptions
        const views = [
            document.querySelector('.present .present'),
            document.querySelector('.m-modal__content'),
            document.querySelector('.wnl-comments')
        ]
        views.forEach(view => {
            if (view) view.scrollBy(options)
        })
    }

    function updateTabTitle() {
        let currentTitleHeader = document.querySelector('.present .sl-block-content h2')
        console.log({ currentTitleHeader })
        if (currentTitleHeader !== null && GM_getValue('option_changeTitle')) {
            let currentTitle = currentTitleHeader.textContent
            console.log({ currentTitle })
            if (currentTitle && currentTitle.length) {
                document.title = `${currentTitle} - Więcej niż LEK`
            }
        }
    }

    function showImage() {
        if (document.body.querySelector('.fullscreen-mode .wnl-comments')) return
        let fullscreenBtn = document.body.querySelector('.present .iv-image-fullscreen') as HTMLElement
        if (fullscreenBtn) fullscreenBtn.click()
    }
    function hideImage() {
        if (document.body.querySelector('.fullscreen-mode .wnl-comments')) return
        let exitBtn = document.body.querySelector('.wnl-screen .iv-container-fullscreen .iv-close') as HTMLElement
        if (exitBtn) exitBtn.click()
        exitBtn = document.body.querySelector('.wnl-screen .image-gallery-wrapper .iv-close') as HTMLElement
        if (exitBtn) exitBtn.click()
    }
    function hideModal() {
        let exitBtn = document.body.querySelector(`.a-icon.m-modal__header__close`) as HTMLElement
        if (exitBtn) exitBtn.click()
    }

    function numericKeyPressed(key) {
        let annotationImages = document.querySelectorAll('.m-imageFullscreenWrapper')
        const quiz = document.querySelector('.o-referenceModal .quizQuestion')
        if (quiz) {
            const index = parseInt(key) - 1
            const answers = quiz.querySelectorAll('.quizAnswer') as NodeListOf<HTMLElement>
            if (index >= answers.length) return
            answers[index].click()
            return
        }
        if (annotationImages.length > 0) {
            const selector = `.m-imageFullscreenWrapper .a-icon.sub-id-${key}`
            const icon = document.querySelector(selector) as HTMLElement
            console.log({selector, icon})
            if (icon) icon.click()
        } else {
            const selector = `.present .a-icon.sub-id-${key}`
            const icon = document.querySelector(selector) as HTMLElement
            console.log({selector, icon})
            if (icon) icon.click()
            setTimeout(() => {
                annotationImages = document.querySelectorAll('.m-imageFullscreenWrapper')
                let counter = 1
                annotationImages.forEach(image => {
                    const btn = image.querySelector('.a-icon')
                    btn.classList.add(`sub-id-${counter}`)
                    const index = document.createElement('span')
                    index.innerText = counter.toString()
                    index.className = 'image-fullscreen-index'
                    btn.appendChild(index)
                    counter++
                })
            }, 300)
        }
    }
    let mouseVisible = true
    function toggleMouseVisibility(visible?: boolean) {
        mouseVisible = typeof visible === 'undefined' ? !mouseVisible : visible
        console.log({ mouseVisible, visible })
        toggleBodyClass('custom-script-hide-cursor', !mouseVisible)
        if (!mouseVisible) document.body.addEventListener('mousemove', () => toggleMouseVisibility(true), { once: true })
    }
    function shortcutListener (event: KeyboardEvent) {
        if ((event.target as HTMLElement).nodeName === 'INPUT' || event.ctrlKey || event.altKey || event.metaKey) {
            return
        }
        let quizVerifyBtn
        switch (event.key) {
            case 'ArrowUp':
                showImage()
            break

            case 'ArrowDown':
                hideImage()
            break

            case 'q':
            case '0':
                hideModal()
            break

            case 'm':
                toggleMouseVisibility()
            break

            case 'o':
            case 's':
                toggleOptions()
            break

            case '?':
            case '/':
                toggleSearch()
            break

            case 't':
                toggleSummary()
            break

            case 'Escape':
                event.preventDefault()
                event.stopPropagation()
                hideModal()
            break

            case 'Enter':
                quizVerifyBtn = document.querySelector('.o-quizQuestionReferenceModal__verify span')
                if (quizVerifyBtn) quizVerifyBtn.click()
            break

            case '+':
            case '=':
                if (options) {
                    options.setOptionState(state => { return { value: state.value+5 } }, 'percentIncrease')
                }
                break

            case '-':
                if (options) {
                    options.setOptionState(state => { return { value: state.value-5 } }, 'percentIncrease')
                }
                break
        }
        const charCode = event.keyCode
        if ((charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105)) numericKeyPressed(event.key)
    }
    function setupKeyboardControl () {
        const slides = document.querySelectorAll('.slides .stack')
        if (!slides.length) return
        slides.forEach(slide => {
            let counter = 1
            const icons = slide.querySelectorAll('.a-icon')
            icons.forEach(icon => processIcon(icon, counter++))
        })
        observeSlides(addSubsToIcons)

        document.body.addEventListener('click', updateTabTitle)
        document.body.addEventListener('keyup', updateTabTitle)
        document.body.addEventListener('keydown', event => {
            if (event.key === 'ArrowUp') {
                scrollView(-60)
                return false
            }
            if (event.key === 'ArrowDown') {
                scrollView(60)
                return false
            }
        })
        document.body.addEventListener('keyup', shortcutListener)
    }

    let toRunOnLoaded = []
    let sidebarSettingsContainer = null
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
        // test search request
        getSearchResponseHTML("amiodaron als").then(console.log)

        toRunOnLoaded.forEach(cb => cb())
    }

    setTimeout(() => {
        let loaderOverlay = document.querySelector('.app__overlayLoader')
        if (loaderOverlay !== null) {
            console.log('overlay detected')
            onRemove(loaderOverlay, onLoaded)
        }
    }, 1000)

    function Options (options) {
        const document = unsafeWindow.document
        this.state = Object.fromEntries(
            options.map(
                option => [option.name, { ...option, value: option.defaultValue, handle: null }]
            )
        )

        this._rerenderSidebar = function () {
            if (sidebarSettingsContainer) {
                const optionDivs = sidebarSettingsContainer.querySelectorAll('div.custom-script-option-container')
                optionDivs.forEach(el => el.remove())
                Object.values(this.state).forEach(
                    option => sidebarSettingsContainer.appendChild( this._getSidebarOption(option) )
                )
            }
        }

        this._getSidebarOption = function (option) {
            const optionContainer = document.createElement('div')
            optionContainer.classList.add('custom-script-option-container')
            const getOption = desc => `<a class="custom-script-option" href="#">${desc}</a>`
            const desc = typeof option.desc === 'function' ? option.desc.apply(this, [option, this.state]) : option.desc
            optionContainer.innerHTML = getOption(desc)
            const optionLink = optionContainer.querySelector('a')
            optionLink.addEventListener('click', event => {
                event.preventDefault()
                this._runCallback(option)
            })
            return optionContainer
        }

        this.rerender = function () {
            let rerender = name => {
                const state = this.state[name]
                GM_unregisterMenuCommand(state.handle)
                const desc = typeof state.desc === 'function' ? state.desc(state) : state.desc
                this.state[name].handle = GM_registerMenuCommand(
                    desc,
                    () => this._runCallback(state),
                    state.key
                )
            }
            rerender = rerender.bind(this)
            Object.keys(this.state).forEach( rerender )
            this._rerenderSidebar()
        }

        this._runCallback = function (option) {
            const result = option.callback.apply(this, [option, this.state])
            if (typeof result === 'object') this.setOptionState({ name: option.name, ...result })
        }

        this.setOptionState = function (state, name) {
            if (typeof state === 'function') {
                const result = state.apply( this, [this.state[name]] )
                this._setOptionState({ ...this.state[name], ...result })
            }
            else this._setOptionState(state)
        }
        this._setOptionState = function (state) {
            const name = state.name
            this.state[name] = { ...this.state[state.name], ...state }
            this.storeState(name)
            this.state[name].update.apply(this, [state, this.state])
            this.rerender()
        }

        this.storeState = function (optionName: string) {
            const saveOptionState = name => GM_setValue(`option_${name}` as keyof StoredValueType, this.state[name].value)
            if (typeof optionName === 'string') {
                saveOptionState(optionName)
                return
            }
            Object.keys(this.state).forEach( saveOptionState )
        }

        this.restoreState = function (optionName: string) {
            const restoreOptionState = (name: string) => {
                this.state[name].value = GM_getValue(`option_${name}` as keyof StoredValueType, this.state[name].value)
            }
            if (typeof optionName === 'string') {
                restoreOptionState(optionName)
                return
            }
            Object.keys(this.state).forEach( restoreOptionState )
        }

        this._runOnAllOptions = function (functionName: string) {
            Object.keys(this.state).forEach( optionName => {
                const option = this.state[optionName]
                const callback = option[functionName]
                if (typeof callback === 'function') callback.apply(this, [option, this.state])
            } )
        }

        this.update = function () { this._runOnAllOptions('update') }
        this.init = function () {
            toRunOnLoaded.push(() => {
                this._runOnAllOptions('init')
                this._rerenderSidebar()
            })
        }

        this.rerender = this.rerender.bind(this)
        this._runCallback = this._runCallback.bind(this)
        this._getSidebarOption = this._getSidebarOption.bind(this)
        this._rerenderSidebar = this._rerenderSidebar.bind(this)
        this.restoreState = this.restoreState.bind(this)
        this.storeState = this.storeState.bind(this)
        this.setOptionState = this.setOptionState.bind(this)
        this._setOptionState = this._setOptionState.bind(this)
        this._runOnAllOptions = this._runOnAllOptions.bind(this)
        this.update = this.update.bind(this)
        this.init = this.init.bind(this)

        this.restoreState()
        this.init()
        this.update()
        this.storeState()
        this.rerender()
        // options.forEach(option => { if (option.type === 'boolean') this.setOption[option.name](option.defaultValue) })
    }

    const getCheckbox = isOn => isOn ? "☑️ " : "🔲 "

    var options = new Options([
        {
            name: "increaseFontSize",
            desc: state => getCheckbox(state.value) + "🔎 Zwiększ wielkość czcionki",
            callback: function (state) {
                if (!state.value) {
                    this.setOptionState({
                        name: "uniformFontSize",
                        value: false
                    })
                }
                return { value: !state.value }
            },
            update: state => toggleBodyClass("custom-script-increase-font-size", state.value),
            defaultValue: true,
            key: 'f'
        },
        {
            name: "increaseAnnotations",
            desc: state => getCheckbox(state.value) + "📄 Zwiększ wielkość czcionki w przypisach",
            callback: function (state) {
                return { value: !state.value }
            },
            update: state => toggleBodyClass("custom-script-increase-annotations", state.value),
            defaultValue: false,
            key: 'a'
        },
        {
            name: "smoothScroll",
            desc: state => getCheckbox(state.value) + "↕️ Płynne przewijanie strzałkami",
            callback: function (state) {
                return { value: !state.value }
            },
            update: () => null,
            defaultValue: false,
            key: 'a'
        },
        {
            name: "keyboardControl",
            desc: state => getCheckbox(state.value) + "⌨️ Sterowanie klawiaturą",
            callback: function (state) {
                return { value: !state.value }
            },
            update: state => {
                if (state.value) {
                    setupKeyboardControl()
                }
                else {
                    document.querySelectorAll('sub.small').forEach(sub => sub.remove())
                    document.body.removeEventListener('keyup', shortcutListener)
                    if (slideObserver) slideObserver.disconnect()
                }
            },
            defaultValue: true,
            key: 'a'
        },
        {
            name: "changeTitle",
            desc: state => getCheckbox(state.value) + "🆎 Zmień tytuł karty",
            callback: function (state) {
                return { ...state, value: !state.value }
            },
            update: state => {
                console.log('changeTitle update', {state})
                unsafeWindow.document.title = (state.value && state.newTitle) ? state.newTitle : state.originalTitle
            },
            init: state => {
                state.originalTitle = unsafeWindow.document.title
                let headerElem = document.querySelector('.o-lesson__title__left__header') as HTMLElement
                console.log({ headerElem })
                if (headerElem !== null) state.newTitle = headerElem.innerText
                console.log({ newTitle: state.newTitle })
                if (state.originalTitle && state.newTitle) unsafeWindow.document.title = state.value ? state.newTitle : state.originalTitle
            },
            defaultValue: false,
            key: 'a'
        },
        {
            name: "uniformFontSize",
            desc: state => getCheckbox(state.value) + "🔤 Ujednolicona wielkość czcionki",
            callback: function (state) {
                if (!state.value) {
                    this.setOptionState({
                        name: "increaseFontSize",
                        value: false
                    })
                }
                return { value: !state.value }
            },
            update: state => toggleBodyClass("custom-script-uniform-font-size", state.value),
            defaultValue: false,
            key: 'u'
        },
        {
            name: "invertImages",
            desc: state => getCheckbox(state.value) + "🔃 Odwróć kolory obrazów",
            callback: function (state) {
                return { value: !state.value }
            },
            defaultValue: false,
            update: state => toggleBodyClass("custom-script-invert-images", state.value),
            key: 'i'
        },
        {
            name: "percentIncrease",
            type: "button",
            desc: state => `➕ Zmień powiększenie (${state.value}%)`,
            callback: (state) => {
                const input = prompt(`Określ powiększenie czcionki (w %, obecnie ${state.value}%):`, state.value)
                if (typeof input === "string") {
                    let nextValue = parseInt(input, 10)
                    if (nextValue !== NaN && nextValue > 10 && nextValue < 300) {
                        return { value: nextValue }
                    }
                }
            },
            defaultValue: 110,
            update: state => {
                updateFontSize(state.value)
                const rangeInput = document.querySelector('input.custom-script-font-size-input') as HTMLInputElement
                const rangeLabel = document.querySelector('label.custom-script-font-size-label') as HTMLLabelElement
                if (rangeInput) rangeInput.value = state.value
                if (rangeLabel) rangeLabel.innerText = `${state.value}%`
            },
            init: function (state) {
                function _toRun() {
                    const rangeInput = document.querySelector('input.custom-script-font-size-input') as HTMLInputElement
                    const rangeLabel = document.querySelector('label.custom-script-font-size-label') as HTMLLabelElement
                    if (rangeInput) {
                        rangeInput.value = state.value
                        rangeLabel.innerText = `${state.value}%`
                        rangeInput.addEventListener('change', event => {
                            const value = rangeInput.value
                            this.setOptionState({ name: "percentIncrease", value })
                        })
                        rangeInput.addEventListener('input', event => {
                            const value = rangeInput.value
                            updateFontSize(parseInt(value))
                        })
                    }
                }
                const toRun = _toRun.bind(this)
                toRunOnLoaded.push(toRun)
            },
            key: 'p'
        }
    ])
    console.log('end!')
})();

