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

type AppEvents = {
    loaded: {}
    unloaded: {}
    slideChange: number
    sidenavOpened: boolean
}

class App extends CustomEventEmmiter<AppEvents> {
    appDiv: Element
    lessonView: Element
    options: Settings
    tools: Settings
    metadata: SlideshowChapterMetadata[]
    tabOpener: TabOpener
    searchInSlideshow: SearchConstructor
    searchInBottomContainer: SearchConstructor
    notesCollection: Notes.Collections.Presentation
    currentSlideNotes: Notes.Collections.Slide
    notesRendering: NotesRendering
    slideObserver: MutationObserver
    presentationMetadata: PresentationMetadata
    slideshowChapters: SlideshowChapters
    breakTimer: BreakTimer
    courseSidebar: CourseSidebar
    originalTitle: string
    private _loaded = false
    sidenavObserver: MutationObserver
    bottomContainer: HTMLDivElement
    
    public get loaded(): boolean {
        return this._loaded
    }
    public get slideNumber(): number {
        return this.presentationMetadata.slideNumber
    }
    public set slideNumber(value: number) {
        this.presentationMetadata.slideNumber = value
    }

    onLoaded() {
        this.slideshowChapters = this.presentationMetadata.slideshowChapters

        this.options.addSettings(getOptions(this))
        this.notesRendering = new NotesRendering(this)
        this.tools.addSettings(getToolsConfig(this))

        if (!this.appDiv) {
            this.appDiv = document.querySelector(SELECTORS.appDiv)
            if (!this.appDiv) return
        }

        this.presentationMetadata.observe()
        this.presentationMetadata.addEventListener('slideChange', slide => this.trigger('slideChange', slide))
        this.tabOpener = new TabOpener(this)

        let background = document.querySelector(SELECTORS.background)
        if (background !== null) {
            background.classList.remove("image-custom-background")
            background.classList.add("white-custom-background")
        }

        this.searchInSlideshow = new SearchConstructor(this)
        this.searchInBottomContainer = new SearchConstructor(this)

        this.lessonView = document.querySelector(SELECTORS.lessonView)
        if (this.lessonView !== null) {
            this.addBottomContainer()
        }

        if (GM_getValue(`option_keyboardControl`)) Keyboard.setupControl(this)

        addChapterInfo(this);

        addSlideOptions(this)

        // if (this.tools && this.tools.getValue('useNotes')) {
        //     this.notesRendering.loadNotes()
        //     this.addEventListener('slideChange', current => this.notesRendering.renderNotes(current))
        // }

        this.addEventListener('slideChange', () => this.updateTabTitle())

        this._loaded = true
        this.trigger('loaded')

        this.presentationMetadata.addEventListener('screenidChange', screenid => this.checkUnloaded())
        unsafeWindow.addEventListener('beforeunload', ev => {
            this.onUnload()
        })
    }

    private addBottomContainer() {
        this.bottomContainer = document.createElement('div')
        this.bottomContainer.className = CLASS_NAMES.bottomContainer
        this.addSliderContainer()
        // this.addTagListContainer()
        this.bottomContainer.append(this.searchInBottomContainer.getSearchContainer(false))
        this.addToolsContainer()
        this.addSettingsContainer()
        this.lessonView.append(this.bottomContainer)
    }

    addTagListContainer() {
        const tagListContainer = document.createElement('div')
        tagListContainer.style.order = '-1'
        tagListContainer.className = CLASS_NAMES.tagListContainer
        tagListContainer.innerHTML = `
            <span class='custom-heading'>
                ${SVGIcons.tags}
                <span class='metadata'>tagi</span>
            </span>
            <div class=${CLASS_NAMES.tagList}></div>`
        this.bottomContainer.append(tagListContainer)
    }

    setupObserveSidenav() {
        if (this.sidenavObserver) return
        function findSideNav(nodeList: NodeList) {
            if (nodeList) {
                for (const node of nodeList) {
                    if ((node as HTMLElement).classList && 
                        (node as HTMLElement).classList.contains('wnl-sidenav-slot')) {
                        return node
                    }
                }
            }
        }
        this.sidenavObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (findSideNav(mutation.addedNodes)) this.trigger('sidenavOpened', true)
                if (findSideNav(mutation.removedNodes)) this.trigger('sidenavOpened', false)
            }
        })
        this.sidenavObserver.observe(this.appDiv, { childList: true })
        this.addEventListener('unloaded', () => this.sidenavObserver.disconnect())
    }

    updateTabTitle() {
        if (GM_getValue('option_changeTitle') && this.presentationMetadata) {
            let mainTitle: string
            mainTitle = this.presentationMetadata.presentationName
            mainTitle = mainTitle && mainTitle.match(/\w/) ? `${mainTitle} - ` : ''

            let slideTitle = this.presentationMetadata.slideTitle
            slideTitle = slideTitle && slideTitle.match(/\w/) ? `${slideTitle} - ` : ''

            const originalTitle = this.originalTitle || 'LEK - Kurs - Więcej niż LEK'
            document.title = slideTitle + mainTitle + originalTitle
        }
    }

    addSliderContainer() {
        const test = document.querySelector(`input.${CLASS_NAMES.fontSizeInput}`)
        if (test) return
        const sliderContainer = document.createElement('div');
        sliderContainer.innerHTML = zoomSliderHTML;
        sliderContainer.className = CLASS_NAMES.zoomSliderContainer
        this.bottomContainer.appendChild(sliderContainer);
        sliderContainer.querySelector(`input.${CLASS_NAMES.fontSizeInput}`)
            .addEventListener('input', e => (document.querySelector(`.${CLASS_NAMES.fontSizeLabel}`) as HTMLElement).innerText = `${(e.target as HTMLInputElement).value}%`
            );
        (sliderContainer.querySelector(`.${CLASS_NAMES.fontSizeInput}-increase`) as HTMLAnchorElement)
            .addEventListener('click', () => {
                this.options.setValue('percentIncrease', (state: number) => state + 5);
            });
        (sliderContainer.querySelector(`.${CLASS_NAMES.fontSizeInput}-decrease`) as HTMLAnchorElement)
            .addEventListener('click', () => {
                this.options.setValue('percentIncrease', (state: number) => state - 5);
            });
    }

    addToolsContainer() {
        const test = document.querySelector(`.${CLASS_NAMES.toolsContainer}`)
        if (test) return
        const toolsContainer = document.createElement('div');
        toolsContainer.classList.add(CLASS_NAMES.toolsContainer);
        toolsContainer.innerHTML = `
            <span class='custom-heading'>
                ${SVGIcons.tools}
                <span class="metadata">narzędzia</span>
            </span>
            <div></div>`;
        this.bottomContainer.appendChild(toolsContainer);
        toolsContainer.append(this.tools.render())
    }

    addSettingsContainer() {
        const test = document.querySelector(`.${CLASS_NAMES.settingsContainer}`)
        if (test) return
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add(CLASS_NAMES.settingsContainer);
        optionsContainer.innerHTML = `
            <span class='custom-heading'>
                ${SVGIcons.gear}
                <span class="metadata">ustawienia</span>
            </span>
            <div></div>`;
        this.bottomContainer.appendChild(optionsContainer);
        optionsContainer.append(this.options.render())
        const pIncr = this.options.getSetting('percentIncrease') as NumberSetting
        pIncr.lowerLimit = 60
        pIncr.upperLimit = 200
    }

    private isAwaiting = false
    init() {
        this.options = new Settings(this)
        this.tools = new Settings(this)
        this.awaitLoad()
        this.appDiv = document.querySelector(SELECTORS.appDiv)
        this.presentationMetadata = new PresentationMetadata(this)
    }

    awaitLoad() {
        let checkLoadedInterval: NodeJS.Timer
        this.isAwaiting = true
        checkLoadedInterval = setInterval(() => {
            const testExtensionLoaded = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`)
            if (testExtensionLoaded) {
                this.isAwaiting = false
                clearInterval(checkLoadedInterval)
                return
            }
            const testSlideshowLoaded = document.querySelector('.order-number-container')
            if (testSlideshowLoaded) {
                this.isAwaiting = false
                clearInterval(checkLoadedInterval)
                this.onLoaded()
            }
        }, 300)
    }

    checkUnloaded() {
        const testExtensionLoaded = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`)
        if (!this.isAwaiting && !testExtensionLoaded) {
            this.onUnload()
            this.awaitLoad()
        }
    }

    onUnload() {
        this._loaded = false
        this.trigger('unloaded')
        if (this.options && this.options.getValue('changeTitle')) {
            document.title = this.originalTitle
        }
        if (this.currentSlideNotes) {
            this.currentSlideNotes.commitChanges().then(() => {
                this.notesCollection = undefined
                this.currentSlideNotes = undefined
            })
        }
        this.presentationMetadata.removeAllListeners('slideChange')
        if (this.slideObserver) this.slideObserver.disconnect()
    }
}