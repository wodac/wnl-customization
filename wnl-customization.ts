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
            console.log({ lessonView })
            const sliderContainer = document.createElement('div')
            sliderContainer.innerHTML = zoomSliderHTML
            lessonView.appendChild(sliderContainer)
            sliderContainer.querySelector('input.custom-script-font-size-input')
                .addEventListener('input', e =>
                    (document.querySelector('label.custom-script-font-size-label') as HTMLElement).innerText = `${(e.target as HTMLInputElement).value}%`
                )
        }

        let sidebar = document.querySelector(SELECTORS.sidebar)
        sidebarSettingsContainer = document.createElement('div')
        if (sidebar !== null) sidebar.prepend(sidebarSettingsContainer)
        else {
            const sidebarToggle = document.querySelector(SELECTORS.menuBtn)
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', event => {
                    sidebar = document.querySelector('aside.sidenav-aside.course-sidenav')
                    if (sidebar) sidebar.prepend(sidebarSettingsContainer)
                })
            }
        }

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
        const testElement = document.querySelector('input.custom-script-font-size-input')
        if (!isAwaiting && !testElement) {
            console.log('unloaded!!!')
            awaitLoad()
        }
    }

})();