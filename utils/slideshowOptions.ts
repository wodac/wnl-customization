
const slideshowOptionsBtn = `
    <a class="custom-options-btn custom-script-slideshow-btn wnl-rounded-button">
        <div class="a-icon -x-small" title="Opcje">
            ${SVGIcons.chevronUp}
        </div>
    </a>`

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
    </a>`

function addSlideOptions(app: App) {
    const bookmarkBtn = document.querySelector('.wnl-rounded-button.bookmark')
    if (!bookmarkBtn) return
    app.search.addSearchContainer()
    const slideOptionsContainer = document.createElement('div')
    slideOptionsContainer.innerHTML = slideshowOptionsBtn
    const additionalOptionsContainer = document.createElement('div')
    additionalOptionsContainer.className = 'custom-script-hidden custom-script-additional-options'
    additionalOptionsContainer.innerHTML = slideshowOptions
    slideOptionsContainer.append(additionalOptionsContainer)
    bookmarkBtn.after(slideOptionsContainer)
    additionalOptionsContainer.prepend(bookmarkBtn)
    slideOptionsContainer.querySelector('.custom-options-btn').addEventListener('click', () => Toggles.optionsActive.toggle())
    slideOptionsContainer.querySelector('.custom-search-btn').addEventListener('click', () => {
        Toggles.optionsActive.state = false
        Toggles.searchHidden.toggle()
    })
    slideOptionsContainer.querySelector('.custom-zoom-up-btn').addEventListener('click', () => {
        if (app.options) {
            app.options.state.percentIncrease.increaseBy(5)
        }
    })
    slideOptionsContainer.querySelector('.custom-zoom-down-btn').addEventListener('click', () => {
        if (app.options) {
            app.options.state.percentIncrease.increaseBy(-5)
        }
    })
}

function addSummary(metadata: SlideshowChapterMetadata[]) {
    const linksHTML = metadata.map((e, i) =>
        `<a class='custom-script-summary-link' href='${e.href}'
           data-start-page=${e.startPage} data-index=${i}>
               <span>${e.name} </span>
               <span class='small'>(${e.chapterLength})</span>
       </a>`
    ).join('')
    const summaryContainer = document.createElement('div')
    summaryContainer.className = 'custom-script-summary custom-script-hidden'
    summaryContainer.innerHTML = linksHTML
    const closeBtn = document.createElement('div')
    closeBtn.className = 'custom-script-summary-close'
    closeBtn.innerHTML = SVGIcons.chevronUp
    summaryContainer.prepend(closeBtn)
    closeBtn.addEventListener('click', () => Toggles.summaryHidden.state = true)
    document.querySelector('.order-number-container').after(summaryContainer)
    const links = summaryContainer.querySelectorAll('a.custom-script-summary-link') as NodeListOf<HTMLAnchorElement>
    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault()
            const { startPage } = link.dataset
            presentationMetadata.slideNumber = parseInt(startPage)
            return false
        })
    })
}

function addChapterInfo(app: App) {
    getMetadata(metadata => {
       //console.log({ metadata });
        if (!metadata)
            return;

        app.metadata = metadata

        addPageNumberContainer();
        addSummary(metadata);

        presentationMetadata.addEventListener('slideChange', page => onSlideChanged(page, metadata, app));
        const slideNumberSpan = document.querySelector('.order-number-container') as HTMLSpanElement;
        onSlideChanged(parseInt(slideNumberSpan.innerText), metadata, app);
    });
}

function onSlideChanged(current: number, metadata: SlideshowChapterMetadata[], app: App) {
    if (current === NaN) return
    const pageNumberContainer: HTMLSpanElement = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`)
    const getChapterIndex = page => {
        const i = metadata.findIndex(m => m.startPage > page) - 1;
        return i >= 0 ? i : metadata.length - 1;
    };
    const chapterIndex = getChapterIndex(current)
    const chapterMetadata = metadata[chapterIndex]
    const relativeCurrent = current - chapterMetadata.startPage + 1
    const chapterLength = chapterMetadata.chapterLength
    const relativeCurrentContainer = pageNumberContainer.querySelector(`.${CLASS_NAMES.currentChapterPage}`) as HTMLSpanElement
    relativeCurrentContainer.innerText = relativeCurrent.toString()
    const chapterLengthContainer = pageNumberContainer.querySelector(`.${CLASS_NAMES.chapterLength}`) as HTMLSpanElement
    chapterLengthContainer.innerText = chapterLength.toString()
    const summaryContainer = document.querySelector('custom-script-summary')
    if (summaryContainer) {
        summaryContainer.querySelectorAll('a').forEach(a => a.classList.remove('is-active'))
        const active = summaryContainer.querySelector(`[data-index="${chapterIndex}"]`)
        active.classList.add('is-active')
        if (!summaryContainer.className.includes('custom-script-hidden')) {
            active.scrollIntoView({ behavior: "smooth" })
        }
    }
    updateTabTitle()
    app.notesRendering.renderNotes(current)
}

function addPageNumberContainer(): HTMLSpanElement {
    const classNames = [CLASS_NAMES.pageNumberContainer, CLASS_NAMES.currentChapterPage, '', CLASS_NAMES.chapterLength]
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
    spans[0].addEventListener('click', () => Toggles.summaryHidden.toggle())
    return spans[0]
}

function openMenu() {
    const menuBtn = document.querySelector(SELECTORS.menuBtn) as HTMLElement
    if (menuBtn) {
        menuBtn.click()
        return true
    }
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
    if (menuOpened) closeMenu()
    if (list.length === 0) {
        cb(false)
        return
    }
    const wrappers = list.filter(el => el.nodeName === 'DIV') as HTMLElement[]
    if (wrappers.length === 0) {
        cb(false)
        return
    }
    const linksMetadata = getMetadataFromLinks(wrappers)
    cb(linksMetadata)
}

function closeMenu() {
    (document.querySelector('.topNavContainer__close') as HTMLElement).click()
}

function getMetadataFromLinks(wrappers: HTMLElement[]): SlideshowChapterMetadata[] {
    const links = wrappers.map(div => div.querySelector('a'))
    const getLength = (t: string) => parseInt(t.slice(1, -1))
    return links.map((a, i) => {
        if (!a.href)
            return {}
        const chapterLength = getLength((a.querySelector('span span.sidenav-item-meta') as HTMLSpanElement).innerText)
        if (chapterLength > 75) {
            const subwrappers: NodeListOf<HTMLDivElement> = wrappers[i].querySelectorAll('div')
            if (subwrappers.length) {
                return getMetadataFromLinks(Array.from(subwrappers))
            }
        }
        return {
            href: a.href,
            name: (a.querySelector('span span') as HTMLSpanElement).innerText,
            chapterLength,
            startPage: parseInt(a.href.split('/').pop())
        }
    }).flat(1)
}
