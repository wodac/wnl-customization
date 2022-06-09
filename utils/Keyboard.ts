///<reference path="common.ts" />
///<reference path="Search.ts" />
namespace Keyboard {
    type KeyboardShortcut = {
        keys: string[]
        callback: (event: KeyboardEvent) => any
    }

    let keyboardShortcuts: KeyboardShortcut[] = [
        {
            keys: ['ArrowUp'],
            callback: showImage
        },
        {
            keys: ['ArrowDown', 'q', '0', 'Escape'],
            callback: hideImage
        },
        {
            keys: ['q', '0', 'Escape'],
            callback: hideModal
        },
        {
            keys: ['q', '0', 'Escape'],
            callback: () => {
                Toggles.optionsActive.state = false
                Toggles.searchHidden.state = true
                Toggles.summaryHidden.state = true
            }
        },
        {
            keys: ['m'],
            callback: () => toggleMouseVisibility()
        },
        {
            keys: ['o', 's'],
            callback: () => Toggles.optionsActive.toggle()
        },
        {
            keys: ['?', '/'],
            callback: () => Toggles.searchHidden.toggle()
        },
        {
            keys: ['l'],
            callback: () => Toggles.summaryHidden.toggle()
        },
        {
            keys: ['Enter'],
            callback: () => {
                const quizVerifyBtn = document.querySelector('.o-quizQuestionReferenceModal__verify span') as HTMLElement
                if (quizVerifyBtn) quizVerifyBtn.click()
            }
        }
    ]
    export function registerShortcut(shortcut: KeyboardShortcut) {
        keyboardShortcuts.push(shortcut)
    }
    function shortcutListener(event: KeyboardEvent) {
        const tagName = (event.target as HTMLElement).nodeName
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || event.ctrlKey || event.altKey || event.metaKey) {
            return
        }
        keyboardShortcuts.forEach(shortcut => {
            if (shortcut.keys.includes(event.key)) shortcut.callback(event)
        })
        const charCode = event.keyCode
        if ((charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105)) numericKeyPressed(event.key)
    }
    document.addEventListener('fullscreenchange', ev => {
        if (!document.fullscreenElement) {
            if (document.querySelector('.o-referenceModal')) {
                hideModal()
                toggleFullscreen()
            } else if (!Toggles.searchHidden.state) {
                Toggles.searchHidden.state = true
                toggleFullscreen()
            } else if (!Toggles.summaryHidden.state) {
                Toggles.summaryHidden.state = true
                toggleFullscreen()
            }
        }
    })
    export function setupControl(app: App) {
        const slides = document.querySelectorAll('.slides .stack')
        if (!slides.length) return
        slides.forEach(slide => {
            let counter = 1
            const icons = slide.querySelectorAll('.a-icon')
            icons.forEach(icon => addSubToRef(icon, counter++))
        })
        observeSlides(app, addSubsToRefs)

        // document.body.addEventListener('click', updateTabTitle)
        // document.body.addEventListener('keyup', updateTabTitle)
        document.body.addEventListener('keydown', event => {
            if (event.key === ' ' || event.key === 'l') {
                // event.preventDefault()
                event.stopImmediatePropagation()
            }
            if (event.key === 'ArrowUp') {
                scrollView(-60)
                return false
            }
            if (event.key === 'ArrowDown' || event.key === ' ') {
                scrollView(60)
                return false
            }
        })
        document.body.addEventListener('keyup', shortcutListener)
    }

    export function disableControl() {
        document.body.removeEventListener('keyup', shortcutListener)
    }

    function observeSlides(app: App, cb: MutationCallback) {
        //console.log('observeSlides')
        app.slideObserver = new MutationObserver(cb)
        app.slideObserver.observe(document.querySelector('div.slides'), {
            childList: true,
            subtree: true
        });
    }

    function addSubsToRefs(mutations: MutationRecord[]) {
        //console.log('mutation observed')
        let counter = 1
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes && mutation.addedNodes.length > 0) {
                //console.log('node added')
                let ref = mutation.addedNodes[0] as HTMLElement
                if (ref.className && ref.className.includes('m-referenceTrigger')) {
                    addSubToRef(ref, counter)
                    counter++
                }
            }
        })
    }


    function addSubToRef(ref: Element, counter: number) {
        const sub = document.createElement('sub')
        sub.innerText = counter.toString()
        sub.className = `small`
        ref.classList.add(`sub-id-${counter}`)
        ref.appendChild(sub)
    }

    function scrollView(y: number) {
        const behavior = GM_getValue(`option_smoothScroll`) ? 'smooth' : 'auto'
        const options = { top: y, left: 0, behavior } as ScrollToOptions
        const views = [
            document.querySelector(SELECTORS.currentSlideContainer),
            document.querySelector('.m-modal__content'),
            document.querySelector('.wnl-comments')
        ]
        views.forEach(view => {
            if (view) view.scrollBy(options)
        })
    }

    function showImage() {
        if (document.body.querySelector('.fullscreen-mode .wnl-comments')) return
        let fullscreenBtn = document.body.querySelector('.present .iv-image-fullscreen') as HTMLElement
        if (fullscreenBtn) fullscreenBtn.click()
    }
    function hideImage() {
        if (document.body.querySelector('.fullscreen-mode .wnl-comments')) return
        let exitBtn = document.body.querySelector('.wnl-screen .iv-container-fullscreen .iv-close') as HTMLElement
        if (exitBtn) exitBtn.click()
        exitBtn = document.body.querySelector('.wnl-screen .image-gallery-wrapper .iv-close') as HTMLElement
        if (exitBtn) exitBtn.click()
    }
    function hideModal() {
        let exitBtn = document.body.querySelector(`.a-icon.m-modal__header__close`) as HTMLElement
        if (exitBtn) exitBtn.click()
    }

    function numericKeyPressed(key: string) {
        let annotationImages = document.querySelectorAll('.m-imageFullscreenWrapper')
        const quiz = document.querySelector('.o-referenceModal .quizQuestion')
        if (quiz) {
            const index = parseInt(key) - 1
            const answers = quiz.querySelectorAll('.quizAnswer') as NodeListOf<HTMLElement>
            if (index >= answers.length) return
            answers[index].click()
            return
        }
        if (annotationImages.length > 0) {
            const selector = `.m-imageFullscreenWrapper .a-icon.sub-id-${key}`
            const icon = document.querySelector(selector) as HTMLElement
            //console.log({ selector, icon })
            if (icon) icon.click()
        } else {
            const selector = `.present .a-icon.sub-id-${key}`
            const icon = document.querySelector(selector) as HTMLElement
            //console.log({ selector, icon })
            if (icon) icon.click()
            setTimeout(() => {
                annotationImages = document.querySelectorAll('.m-imageFullscreenWrapper')
                let counter = 1
                annotationImages.forEach(image => {
                    const btn = image.querySelector('.a-icon')
                    btn.classList.add(`sub-id-${counter}`)
                    const index = document.createElement('span')
                    index.innerText = counter.toString()
                    index.className = 'image-fullscreen-index'
                    btn.appendChild(index)
                    counter++
                })
            }, 300)
        }
    }

    let mouseVisible = true
    function toggleMouseVisibility(visible?: boolean) {
        mouseVisible = typeof visible === 'undefined' ? !mouseVisible : visible
        //console.log({ mouseVisible, visible })
        toggleBodyClass(BODY_CLASS_NAMES.hideCursor, !mouseVisible)
        if (!mouseVisible) document.body.addEventListener('mousemove', () => toggleMouseVisibility(true), { once: true })
    }
}