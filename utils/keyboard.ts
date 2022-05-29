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
        keys: ['ArrowUp'],
        callback: showImage
    },
    {
        keys: ['q', '0', 'Escape'],
        callback: hideModal
    },
    {
        keys: ['m'],
        callback: () => toggleMouseVisibility()
    },
    {
        keys: ['o', 's'],
        callback: () => toggleOptions()
    },
    {
        keys: ['?', '/'],
        callback: () => toggleSearch()
    },
    {
        keys: ['l'],
        callback: () => toggleSummary()
    },
    {
        keys: ['Enter'],
        callback: () => {
            const quizVerifyBtn = document.querySelector('.o-quizQuestionReferenceModal__verify span') as HTMLElement
            if (quizVerifyBtn) quizVerifyBtn.click()
        }
    }
]
function registerKeyboardShortcut(shortcut: KeyboardShortcut) {
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
    // let quizVerifyBtn: HTMLElement
    // switch (event.key) {
    //     case 'ArrowUp':
    //         showImage()
    //         break

    //     case 'ArrowDown':
    //         hideImage()
    //         break

    //     case 'q':
    //     case '0':
    //         hideModal()
    //         break

    //     case 'm':
    //         toggleMouseVisibility()
    //         break

    //     case 'o':
    //     case 's':
    //         toggleOptions()
    //         break

    //     case '?':
    //     case '/':
    //         toggleSearch()
    //         break

    //     case 'l':
    //         toggleSummary()
    //         break

    //     case 'Escape':
    //         hideModal()
    //         break

    //     case 'Enter':
    //         quizVerifyBtn = document.querySelector('.o-quizQuestionReferenceModal__verify span')
    //         if (quizVerifyBtn) quizVerifyBtn.click()
    //         break
    // }
    const charCode = event.keyCode
    if ((charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105)) numericKeyPressed(event.key)
}
function setupKeyboardControl() {
    const slides = document.querySelectorAll('.slides .stack')
    if (!slides.length) return
    slides.forEach(slide => {
        let counter = 1
        const icons = slide.querySelectorAll('.a-icon')
        icons.forEach(icon => addSubToRef(icon, counter++))
    })
    observeSlides(addSubsToRefs)

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

function observeSlides(cb: MutationCallback) {
    console.log('observeSlides')
    slideObserver = new MutationObserver(cb)
    slideObserver.observe(document.querySelector('div.slides'), {
        childList: true,
        subtree: true
    });
}

function observeSlideNumber(cb: (page: number) => any) {
    console.log('observe slide number')
    const appDiv = document.querySelector(SELECTORS.appDiv)
    slideNumberObserver = onAttributeChange(appDiv, 'slide', value => cb(parseInt(value)))
}

function addSubsToRefs(mutations: MutationRecord[]) {
    console.log('mutation observed')
    let counter = 1
    mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes && mutation.addedNodes.length > 0) {
            console.log('node added')
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

function updateTabTitle() {
    let currentTitleHeader = document.querySelector('.present .sl-block-content h2')
    if (currentTitleHeader !== null) currentSlideTitle = currentTitleHeader.textContent
    
    if (GM_getValue('option_changeTitle')) {
        let mainTitle: string
        mainTitle = presentationName && presentationName.match(/\w/) ? `${presentationName} - ` : ''

        const slideTitle = currentSlideTitle && currentSlideTitle.match(/\w/) ? `${currentSlideTitle} - ` : ''

        const originalTitle = options ? options.state.changeTitle.originalTitle : 'LEK - Kurs - Więcej niż LEK'
        document.title = slideTitle + mainTitle + originalTitle
    }
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
        console.log({ selector, icon })
        if (icon) icon.click()
    } else {
        const selector = `.present .a-icon.sub-id-${key}`
        const icon = document.querySelector(selector) as HTMLElement
        console.log({ selector, icon })
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
    console.log({ mouseVisible, visible })
    toggleBodyClass(BODY_CLASS_NAMES.hideCursor, !mouseVisible)
    if (!mouseVisible) document.body.addEventListener('mousemove', () => toggleMouseVisibility(true), { once: true })
}