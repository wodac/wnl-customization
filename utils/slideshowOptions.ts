///<reference path="common.ts" />
///<reference path="ChapterMetadata.ts" />
///<reference path="../App.ts" />
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
    slideOptionsContainer.querySelector('.custom-options-btn').addEventListener('click', () => Toggles.optionsBtn.toggle())
    slideOptionsContainer.querySelector('.custom-search-btn').addEventListener('click', () => {
        Toggles.optionsBtn.state = false
        Toggles.search.toggle()
    })
    slideOptionsContainer.querySelector('.custom-zoom-up-btn').addEventListener('click', () => {
        if (app.options) {
            app.options.setValue('percentIncrease', (v: number) => v + 5)
        }
    })
    slideOptionsContainer.querySelector('.custom-zoom-down-btn').addEventListener('click', () => {
        if (app.options) {
            app.options.setValue('percentIncrease', (v: number) => v - 5)
        }
    })
}

function addSummary(app: App) {
    const summaryContainer = document.createElement('div')
    summaryContainer.className = 'custom-script-summary custom-script-hidden'
    const closeBtn = document.createElement('div')
    closeBtn.className = 'custom-script-summary-close'
    closeBtn.innerHTML = SVGIcons.chevronUp
    summaryContainer.prepend(closeBtn)
    closeBtn.addEventListener('click', () => Toggles.summary.state = false)
    app.slideshowChapters.render(summaryContainer)
    document.querySelector('.order-number-container').after(summaryContainer)
}

function addChapterInfo(app: App) {
    addPageNumberContainer();
    addSummary(app);

    app.slideshowChapters.addEventListener('activeChange', () => updateChapterProgress(app));
    app.slideshowChapters.setCurrentPage(app.slideNumber)
}

async function updateChapterProgress(app: App) {
    const pageNumberContainer: HTMLSpanElement = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`)
    if (!pageNumberContainer) return
    const chapterPath = app.slideshowChapters.getProgress()
    if (chapterPath) {
        let progress: ChapterProgress
        do {
            progress = chapterPath.pop()
        } while (chapterPath.length && progress.actualLength < 5)
        const relativeCurrentContainer = pageNumberContainer.querySelector(`.${CLASS_NAMES.currentChapterPage}`) as HTMLSpanElement
        relativeCurrentContainer.innerText = progress.current.toString()
        const chapterLengthContainer = pageNumberContainer.querySelector(`.${CLASS_NAMES.chapterLength}`) as HTMLSpanElement
        chapterLengthContainer.innerText = progress.actualLength.toString()
    }
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
    spans[0].addEventListener('click', () => Toggles.summary.toggle())
    return spans[0]
}