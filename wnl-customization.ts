///<reference path="packageMetadata.ts" />
///<reference path="globals.d.ts" />
///<reference path="utils/enums.ts" />
///<reference path="utils/common.ts" />
///<reference path="utils/tools.ts" />
///<reference path="utils/keyboard.ts" />
///<reference path="utils/slideshowOptions.ts" />
///<reference path="style.ts" />
(function () {
    'use strict';
    //@ts-ignore
    __SENTRY__.hub.getClient().getOptions().enabled = false;

    function onLoaded() {
        if (!appDiv) {
            appDiv = document.querySelector(SELECTORS.appDiv)
            if (appDiv) {
                onAttributeChange(appDiv, 'screenid', checkUnloaded)
                presentationMetadata.screenID = parseInt(appDiv.attributes.getNamedItem('screenid').value)
                presentationMetadata.lessonID = getCurrentLessonID()
                //console.log({ screenid: presentationMetadata.screenID })
                if (tools && tools.state.useNotes.value) {
                    loadNotes();
                }
            }
        }

        let background = document.querySelector(SELECTORS.background)
        if (background !== null) {
            background.classList.remove("image-custom-background")
            background.classList.add("white-custom-background")
        }

        const lessonView = document.querySelector(SELECTORS.lessonView)
        if (lessonView !== null) {
            const mainHeaderElem = document.querySelector('.o-lesson__title__left__header') as HTMLElement
            if (mainHeaderElem !== null) presentationMetadata.name = mainHeaderElem.innerText

            addSliderContainer()
            addSettingsContainer()
            addToolsContainer()
        }

        if (GM_getValue(`option_keyboardControl`)) Keyboard.setupControl()

        addChapterInfo();

        addSlideOptions()

        toRunOnLoaded.forEach(cb => cb())

        GM_getTabs(tabsObject => {
            console.log({ tabsObject })
            const tabs = Object.values(tabsObject)
            let maxIndex = 0
            if (tabs) {
                tabs.forEach(tab => {
                    if (tab && tab.index > maxIndex) maxIndex = tab.index
                })
                maxIndex++
            }
            thisTabIndex = maxIndex
            console.log({ thisTabIndex })
            GM_saveTab({ index: maxIndex })
        })
        GM_setValue('openInTab', {
            lessonID: presentationMetadata.lessonID,
            screenID: presentationMetadata.screenID,
            slide: presentationMetadata.currentSlideNumber,
            currentTab: -1
        })
        GM_addValueChangeListener('openInTab', (name, oldVal, toOpen, remote) => {
            console.log('GM_ValueChangeListener', name, oldVal, toOpen, remote)
            openSlideInTab(toOpen);
        })

        unsafeWindow.addEventListener('beforeunload', ev => {
            onUnload()
        })
    }

    function addSliderContainer() {
        const test = document.querySelector(`input.${CLASS_NAMES.fontSizeInput}`)
        if (test) return
        const lessonView = document.querySelector(SELECTORS.lessonView)
        const sliderContainer = document.createElement('div');
        sliderContainer.innerHTML = zoomSliderHTML;
        lessonView.appendChild(sliderContainer);
        sliderContainer.querySelector(`input.${CLASS_NAMES.fontSizeInput}`)
            .addEventListener('input', e => (document.querySelector(`.${CLASS_NAMES.fontSizeLabel}`) as HTMLElement).innerText = `${(e.target as HTMLInputElement).value}%`
            );
        (sliderContainer.querySelector(`.${CLASS_NAMES.fontSizeInput}-increase`) as HTMLAnchorElement)
            .addEventListener('click', () => {
                options.setOptionState(state => { return { value: state.value + 5 }; }, 'percentIncrease');
            });
        (sliderContainer.querySelector(`.${CLASS_NAMES.fontSizeInput}-decrease`) as HTMLAnchorElement)
            .addEventListener('click', () => {
                options.setOptionState(state => { return { value: state.value - 5 }; }, 'percentIncrease');
            });
    }

    function addToolsContainer() {
        const test = document.querySelector(`.${CLASS_NAMES.toolsContainer}`)
        if (test) return
        const lessonView = document.querySelector(SELECTORS.lessonView)
        const toolsContainer = document.createElement('div');
        toolsContainer.classList.add(CLASS_NAMES.toolsContainer);
        toolsContainer.innerHTML = `
            <span class="metadata" style="display: block;margin-bottom: 15px;">narzędzia</span>
            <div></div>`;
        lessonView.appendChild(toolsContainer);
        tools.rerender()
    }

    function addSettingsContainer() {
        const test = document.querySelector(`.${CLASS_NAMES.settingsContainer}`)
        if (test) return
        const lessonView = document.querySelector(SELECTORS.lessonView)
        const sidebarSettingsContainer = document.createElement('div');
        sidebarSettingsContainer.classList.add(CLASS_NAMES.settingsContainer);
        sidebarSettingsContainer.innerHTML = `
            <span class="metadata" style="display: block;margin-bottom: 15px;">ustawienia</span>
            <div></div>`;
        lessonView.appendChild(sidebarSettingsContainer);
        options.rerender();
    }

    let isAwaiting = false
    awaitLoad()
    let appDiv = document.querySelector(SELECTORS.appDiv)
    if (appDiv) onAttributeChange(appDiv, 'screenid', checkUnloaded)

    function awaitLoad() {
        let checkLoadedInterval: NodeJS.Timer
        isAwaiting = true
        checkLoadedInterval = setInterval(() => {
            const testExtensionLoaded = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`)
            if (testExtensionLoaded) {
                isAwaiting = false
                clearInterval(checkLoadedInterval)
                return
            }
            const testSlideshowLoaded = document.querySelector('.order-number-container')
            if (testSlideshowLoaded) {
                isAwaiting = false
                clearInterval(checkLoadedInterval)
                onLoaded()
            }
        }, 300)
    }

    function checkUnloaded() {
        //console.log('unloaded??')
        const testExtensionLoaded = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`)
        if (!isAwaiting && !testExtensionLoaded) {
            //console.log('unloaded!!!')
            onUnload()
            awaitLoad()
        }
    }

    function onUnload() {
        for (const key in presentationMetadata) {
            presentationMetadata[key] = undefined
        }
        if (options && options.state.changeTitle.value) {
            const { originalTitle } = options.state.changeTitle
            document.title = originalTitle
        }
        if (currentSlideNotes) {
            currentSlideNotes.commitChanges().then(() => {
                notesCollection = undefined
                currentSlideNotes = undefined
            })
        }
        if (slideNumberObserver) slideNumberObserver.disconnect()
        if (slideObserver) slideObserver.disconnect()
        if (BreakTimer.timer) clearTimeout(BreakTimer.timer)
    }

})();