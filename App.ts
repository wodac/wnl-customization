///<reference path="globals.d.ts" />
///<reference path="utils/enums.ts" />
///<reference path="utils/common.ts" />
///<reference path="utils/PresentationMetadata.ts" />
///<reference path="utils/CustomEventEmmiter.ts" />
///<reference path="utils/TabOpener.ts" />
///<reference path="utils/tools.ts" />
///<reference path="utils/Keyboard.ts" />
///<reference path="utils/slideshowOptions.ts" />

type AppEvents = {
    loaded: {}
    unloaded: {}
}

class App extends CustomEventEmmiter<AppEvents> {
    appDiv: Element
    lessonView: Element
    options: Options
    tools: Options
    metadata: SlideshowChapterMetadata[]
    tabOpener: TabOpener
    search: SearchConstructor
    notesCollection: Notes.Collections.Presentation
    currentSlideNotes: Notes.Collections.Slide
    notesRendering: NotesRendering
    slideObserver: MutationObserver

    onLoaded() {
        this.options = new Options(getOptionsConfig(this), `.${CLASS_NAMES.settingsContainer}`)
        this.notesRendering = new NotesRendering(this)
        this.tools = new Options(getToolsConfig(this), `.${CLASS_NAMES.toolsContainer}`)

        presentationMetadata.observe()
        this.tabOpener = new TabOpener()

        if (!this.appDiv) {
            this.appDiv = document.querySelector(SELECTORS.appDiv)
        }

        if (this.appDiv) {
            presentationMetadata.addEventListener('screenidChange', this.checkUnloaded)
        }

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

        if (this.tools && this.tools.state.useNotes.value) {
            this.notesRendering.loadNotes()
        }
        
        this.trigger('loaded')

        unsafeWindow.addEventListener('beforeunload', ev => {
            this.onUnload()
        })
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
                this.options.setOptionState(state => { return { value: state.value + 5 }; }, 'percentIncrease');
            });
        (sliderContainer.querySelector(`.${CLASS_NAMES.fontSizeInput}-decrease`) as HTMLAnchorElement)
            .addEventListener('click', () => {
                this.options.setOptionState(state => { return { value: state.value - 5 }; }, 'percentIncrease');
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
        this.tools.rerender()
    }

    addSettingsContainer() {
        const test = document.querySelector(`.${CLASS_NAMES.settingsContainer}`)
        if (test) return
        const sidebarSettingsContainer = document.createElement('div');
        sidebarSettingsContainer.classList.add(CLASS_NAMES.settingsContainer);
        sidebarSettingsContainer.innerHTML = `
            <span class="metadata" style="display: block;margin-bottom: 15px;">ustawienia</span>
            <div></div>`;
        this.lessonView.appendChild(sidebarSettingsContainer);
        this.options.rerender();
    }

    private isAwaiting = false
    init() {
        this.awaitLoad()
        this.appDiv = document.querySelector(SELECTORS.appDiv)
        if (this.appDiv) presentationMetadata.addEventListener('screenidChange', this.checkUnloaded)
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
        if (this.options && this.options.state.changeTitle.value) {
            const { originalTitle } = this.options.state.changeTitle
            document.title = originalTitle
        }
        if (this.currentSlideNotes) {
            this.currentSlideNotes.commitChanges().then(() => {
                this.notesCollection = undefined
                this.currentSlideNotes = undefined
            })
        }
        presentationMetadata.removeAllListeners('slideChange')
        if (this.slideObserver) this.slideObserver.disconnect()
        if (BreakTimer.timer) clearTimeout(BreakTimer.timer)
    }
}