
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
            options.setOptionState(state => { return { value: state.value + 5 } }, 'percentIncrease')
        }
    })
    slideOptionsContainer.querySelector('.custom-zoom-down-btn').addEventListener('click', () => {
        if (options) {
            options.setOptionState(state => { return { value: state.value - 5 } }, 'percentIncrease')
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
    summaryContainer = document.createElement('div')
    summaryContainer.className = 'custom-script-summary custom-script-hidden'
    summaryContainer.innerHTML = linksHTML
    const closeBtn = document.createElement('div')
    closeBtn.className = 'custom-script-summary-close'
    closeBtn.innerHTML = svgIcons.chevronUp
    summaryContainer.prepend(closeBtn)
    closeBtn.addEventListener('click', () => toggleSummary(false))
    document.querySelector('.order-number-container').after(summaryContainer)
    const links = summaryContainer.querySelectorAll('a.custom-script-summary-link') as NodeListOf<HTMLAnchorElement>
    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault()
            const { startPage } = link.dataset
            goToPage(parseInt(startPage))
            return false
        })
    })
}

function addChapterInfo() {
    getMetadata(metadata => {
        console.log({ metadata });
        if (!metadata)
            return;

        addPageNumberContainer();
        addSummary(metadata);

        observeSlideNumber(page => onSlideChanged(page, metadata));
        const slideNumberSpan = document.querySelector('.order-number-container') as HTMLSpanElement;
        onSlideChanged(parseInt(slideNumberSpan.innerText), metadata);
    });
}

function onSlideChanged(current: number, metadata: SlideshowChapterMetadata[]) {
    const pageNumberContainer: HTMLSpanElement = document.querySelector('.custom-script-page-number-container')
    const getChapterIndex = page => {
        const i = metadata.findIndex(m => m.startPage > page) - 1;
        return i >= 0 ? i : metadata.length - 1;
    };
    const chapterIndex = getChapterIndex(current)
    const chapterMetadata = metadata[chapterIndex]
    const relativeCurrent = current - chapterMetadata.startPage + 1
    const chapterLength = chapterMetadata.chapterLength
    const relativeCurrentContainer = pageNumberContainer.querySelector('.current-number') as HTMLSpanElement
    relativeCurrentContainer.innerText = relativeCurrent.toString()
    const chapterLengthContainer = pageNumberContainer.querySelector('.n-of-pages') as HTMLSpanElement
    chapterLengthContainer.innerText = chapterLength.toString()
    if (summaryContainer) {
        summaryContainer.querySelectorAll('a').forEach(a => a.classList.remove('is-active'))
        const active = summaryContainer.querySelector(`[data-index="${chapterIndex}"]`)
        active.classList.add('is-active')
    }
}

function addPageNumberContainer(): HTMLSpanElement {
    const classNames = ['custom-script-page-number-container', 'current-number', 'number-divider', 'n-of-pages']
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

function openMenu() {
    const menuBtn = document.querySelector('.topNavContainer__beforeLogo.topNavContainer__megaMenuMobileEntryPoint') as HTMLElement
    if (menuBtn) menuBtn.click()
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
    const wrappers = list.filter(el => el.nodeName === 'DIV') as HTMLElement[]
    if (wrappers.length === 0) {
        cb(false)
        return
    }
    const linksMetadata = getMetadataFromLinks(wrappers)
    cb(linksMetadata)
}

function getMetadataFromLinks(wrappers: HTMLElement[]): SlideshowChapterMetadata[] {     
    const links = wrappers.map(div => div.querySelector('a'))   
    const getLength = (t: string) => parseInt(t.slice(1, -1))
    return links.map( (a, i) => {
        if (!a.href)
            return {}
        const chapterLength = getLength((a.querySelector('span span.sidenav-item-meta') as HTMLSpanElement).innerText)
        if (chapterLength > 50) {
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
