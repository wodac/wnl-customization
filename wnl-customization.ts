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
        const sidebarSettingsContainer = document.createElement('div')
        sidebarSettingsContainer.classList.add(CLASS_NAMES.settingsContainer)
        sidebarSettingsContainer.innerHTML = `
            <span class="metadata" style="display: block;margin-bottom: 15px;">ustawienia</span>
            <div></div>`
        if (lessonView !== null) {
            console.log({ lessonView })
            const sliderContainer = document.createElement('div')
            sliderContainer.innerHTML = zoomSliderHTML
            lessonView.appendChild(sliderContainer)
            lessonView.appendChild(sidebarSettingsContainer)
            options.rerender()
            sliderContainer.querySelector(`input.${CLASS_NAMES.fontSizeInput}`)
                .addEventListener('input', e =>
                    (document.querySelector(`.${CLASS_NAMES.fontSizeLabel}`) as HTMLElement).innerText = `${(e.target as HTMLInputElement).value}%`
                );
            (sliderContainer.querySelector(`.${CLASS_NAMES.fontSizeInput}-increase`) as HTMLAnchorElement)
                    .addEventListener('click', () => {
                        options.setOptionState(state => { return { value: state.value + 5 } }, 'percentIncrease')
                    });
            (sliderContainer.querySelector(`.${CLASS_NAMES.fontSizeInput}-decrease`) as HTMLAnchorElement)
                    .addEventListener('click', () => {
                        options.setOptionState(state => { return { value: state.value - 5 } }, 'percentIncrease')
                    })
        }

        // let sidebar = document.querySelector(SELECTORS.sidebar)
        // if (sidebar !== null) sidebar.prepend(sidebarSettingsContainer)
        // else {
        //     const sidebarToggle = document.querySelector(SELECTORS.menuBtn)
        //     if (sidebarToggle) {
        //         sidebarToggle.addEventListener('click', event => {
        //             sidebar = document.querySelector('aside.sidenav-aside.course-sidenav')
        //             if (sidebar) sidebar.prepend(sidebarSettingsContainer)
        //         })
        //     }
        // }

        if (GM_getValue(`option_keyboardControl`)) setupKeyboardControl()

        addChapterInfo();

        addSlideOptions()

        toRunOnLoaded.forEach(cb => cb())
    }

    let isAwaiting = false
    awaitLoad()
    let appDiv = document.querySelector(SELECTORS.appDiv)
    if (appDiv) onAttributeChange(appDiv, 'screenid', checkUnloaded)

    function awaitLoad() {
        let checkLoadedInterval: NodeJS.Timer
        isAwaiting = true
        checkLoadedInterval = setInterval(() => {
            const testElement = document.querySelector('.order-number-container')
            if (testElement) {
                isAwaiting = false
                clearInterval(checkLoadedInterval)
                onLoaded()
            }
        }, 300)
    }

    function checkUnloaded() {
        console.log('unloaded??')
        const testElement = document.querySelector(`input.${CLASS_NAMES.fontSizeInput}`)
        if (!isAwaiting && !testElement) {
            console.log('unloaded!!!')
            awaitLoad()
        }
    }

})();