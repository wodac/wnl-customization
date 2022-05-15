(function () {
    'use strict';


    function onAttributeChange(element: Node, attributeName: string, callback: () => any) {
        const obs = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'screenid') callback()
                // console.log({mutation})
            }
        });
        obs.observe(element, {
            attributes: true
        });
        return obs
    }

    function onLoaded() {
        console.log('loaded')

        if (!appDiv) {
            appDiv = document.querySelector(SELECTORS.appDiv)
            if (appDiv) onAttributeChange(appDiv, 'screenid', checkUnloaded)
        }

        let background = document.querySelector(SELECTORS.background)
        if (background !== null) {
            background.classList.remove("image-custom-background")
            background.classList.add("white-custom-background")
        }

        const lessonView = document.querySelector(SELECTORS.lessonView)
        if (lessonView !== null) {
            addSliderContainer()
            addSettingsContainer()
            addToolsContainer()
        }

        if (GM_getValue(`option_keyboardControl`)) setupKeyboardControl()

        addChapterInfo();

        addSlideOptions()

        toRunOnLoaded.forEach(cb => cb())
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
        console.log('unloaded??')
        const testExtensionLoaded = document.querySelector(`.${CLASS_NAMES.pageNumberContainer}`)
        if (!isAwaiting && !testExtensionLoaded) {
            console.log('unloaded!!!')
            awaitLoad()
        }
    }

})();