(function () {
    'use strict';

    const h = 'test'
    console.log('userscript loaded!')
    
    const slider = `<div style="margin-top: 2em;">
    <label style="margin-right: 0.9em;">POWIĘKSZENIE</label>
    <input class="custom-script-font-size-input" type="range" size="3" maxlength="3" min="70" class="" max="200" step="5" style="height: 0.8em;margin-right: 0.9em;">
    <a class="button is-primary is-small">-</a>
    <label class="custom-script-font-size-label">120%</label>
    <a class="button is-primary is-small">+</a>
    </div>`

    const sidebarSettings = `<span class="item-wrapper heading" style="padding: 15px;">Ustawienia</span>`
    function onRemove(element, callback) {
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
        let background = document.querySelector(".image-custom-background")
        if (background !== null) {
            background.classList.remove("image-custom-background")
            background.classList.add("white-custom-background")
        }

        const lessonView = document.querySelector('.wnl-lesson-view')
        if (lessonView !== null) {
            console.log({ lessonView })
            const sliderContainer = document.createElement('div')
            sliderContainer.innerHTML = slider
            lessonView.appendChild(sliderContainer)
            sliderContainer.querySelector('input.custom-script-font-size-input')
                .addEventListener('input', e =>
                    (document.querySelector('label.custom-script-font-size-label') as HTMLElement).innerText = `${(e.target as HTMLInputElement).value}%`
                )
        }

        let sidebar = document.querySelector('aside.sidenav-aside.course-sidenav')
        sidebarSettingsContainer = document.createElement('div')
        if (sidebar !== null) sidebar.prepend(sidebarSettingsContainer)
        else {
            const sidebarToggle = document.querySelector('.wnl-navbar-item.wnl-navbar-sidenav-toggle')
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

    setTimeout(() => {
        let loaderOverlay = document.querySelector('.app__overlayLoader')
        if (loaderOverlay !== null) {
            console.log('overlay detected')
            onRemove(loaderOverlay, onLoaded)
        }
    }, 1000)

    console.log('end!')
})();