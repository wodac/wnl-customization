(function () {
    'use strict';


    function onRemove(element: Node, callback: () => any) {
        const parent = element.parentNode;
        if (!parent) throw new Error("The node must already be attached");

        const obs = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const el of mutation.removedNodes) {
                    if (el === element) {
                        obs.disconnect();
                        callback();
                    }
                }
            }
        });
        obs.observe(parent, {
            childList: true,
        });
    }

    function onLoaded() {
        console.log('loaded')
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

    let checkLoadedInterval: NodeJS.Timer
    checkLoadedInterval = setInterval(() => {
        const lessonView = document.querySelector(SELECTORS.lessonView)
        if (lessonView) {
            clearInterval(checkLoadedInterval)
            onLoaded()
            return
        }
        // const loaderOverlay = document.querySelector('.app__overlayLoader')
        // if (loaderOverlay !== null) {
        //     console.log('overlay detected')
        //     onRemove(loaderOverlay, onLoaded)
        // }
    }, 100)

    console.log('end!')
})();