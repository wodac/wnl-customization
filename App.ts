///<reference path="globals.d.ts" />
///<reference path="utils/enums.ts" />
///<reference path="utils/common.ts" />
///<reference path="utils/PresentationMetadata.ts" />
///<reference path="utils/CustomEventEmmiter.ts" />
///<reference path="utils/TabOpener.ts" />
///<reference path="utils/options.ts" />
///<reference path="utils/options2.ts" />
///<reference path="utils/Settings.ts" />
///<reference path="utils/tools.ts" />
///<reference path="utils/Keyboard.ts" />
///<reference path="utils/slideshowOptions.ts" />

type AppEvents = {
    loaded: {}
    unloaded: {}
    slideChange: number
}

class App extends CustomEventEmmiter<AppEvents> {
    appDiv: Element
    lessonView: Element
    options: Settings
    tools: Settings
    metadata: SlideshowChapterMetadata[]
    tabOpener: TabOpener
    search: SearchConstructor
    notesCollection: Notes.Collections.Presentation
    currentSlideNotes: Notes.Collections.Slide
    notesRendering: NotesRendering
    slideObserver: MutationObserver
    presentationMetadata: PresentationMetadata
    slideshowChapters: SlideshowChapters
    breakTimer: BreakTimer
    originalTitle: any

    public get slideNumber(): number {
        return this.presentationMetadata.slideNumber
    }
    public set slideNumber(value: number) {
        this.presentationMetadata.slideNumber = value
    }

    onLoaded() {
        this.slideshowChapters = this.presentationMetadata.slideshowChapters
        
        this.options.addSettings(optionsGen(this))
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

        this.search = new SearchConstructor(this)

        this.lessonView = document.querySelector(SELECTORS.lessonView)
        if (this.lessonView !== null) {
            this.addSliderContainer()
            this.addSettingsContainer()
            this.addToolsContainer()
        }

        if (GM_getValue(`option_keyboardControl`)) Keyboard.setupControl(this)

        addChapterInfo(this);

        addSlideOptions(this)

        if (this.tools && this.tools.getValue('useNotes')) {
            this.notesRendering.loadNotes()
            this.addEventListener('slideChange', current => this.notesRendering.renderNotes(current))
        }

        this.addEventListener('slideChange', () => this.updateTabTitle())
        
        this.trigger('loaded')

        unsafeWindow.addEventListener('beforeunload', ev => {
            this.onUnload()
        })
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
        this.lessonView.appendChild(sliderContainer);
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
            <span class="metadata" style="display: block;margin-bottom: 15px;">narzędzia</span>
            <div></div>`;
        this.lessonView.appendChild(toolsContainer);
        toolsContainer.append(this.tools.render())
    }

    addSettingsContainer() {
        const test = document.querySelector(`.${CLASS_NAMES.settingsContainer}`)
        if (test) return
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add(CLASS_NAMES.settingsContainer);
        optionsContainer.innerHTML = `
            <span class="metadata" style="display: block;margin-bottom: 15px;">ustawienia</span>
            <div></div>`;
        this.lessonView.appendChild(optionsContainer);
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
        if (this.appDiv) this.presentationMetadata.addEventListener('screenidChange', this.checkUnloaded)
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
        //console.log('unloaded??')
        const testExtensionLoaded = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`)
        if (!this.isAwaiting && !testExtensionLoaded) {
            //console.log('unloaded!!!')
            this.onUnload()
            this.awaitLoad()
        }
    }

    onUnload() {
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