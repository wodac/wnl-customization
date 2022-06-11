///<reference path="common.ts" />
///<reference path="Keyboard.ts" />
///<reference path="Settings.ts" />
const optionsGen: (app: App) => SettingInit<any>[] = (app) => [
    {
        name: "increaseFontSize",
        type: SettingType.Checkbox,
        desc: "Zwiększ wielkość czcionki",
        icon: {
            emoji: "🔎",
            html: SVGIcons.zoomIn
        },
        onchange: function (state) {
            if (state.value) {
                this.parent.setValue("uniformFontSize", false)
            }
            toggleBodyClass(BODY_CLASS_NAMES.increaseFontSize, state.value)
        },
        defaultValue: true,
        key: 'f'
    },
    {
        name: "increaseAnnotations",
        icon: {  
            emoji: "📄",
            html: SVGIcons.fileRichText
        }, 
        desc: "Zwiększ wielkość czcionki w przypisach",
        type: SettingType.Checkbox,
        onchange: state => toggleBodyClass(BODY_CLASS_NAMES.increaseAnnotations, state.value),
        defaultValue: false,
        key: 'a'
    },
    {
        name: "hideChat",
        icon: {  
            emoji: "💬",
            html: SVGIcons.chat
        }, 
        desc: "Ukryj czat",
        type: SettingType.Checkbox,
        onchange: state => toggleBodyClass(BODY_CLASS_NAMES.hideChat, state.value),
        defaultValue: false,
        key: 'c'
    },
    {
        name: "smoothScroll",
        icon: {  
            emoji: "↕️",
            html: SVGIcons.chevronExpand
        }, 
        desc: "Płynne przewijanie strzałkami",
        type: SettingType.Checkbox,
        defaultValue: false,
        key: 's'
    },
    {
        name: "keyboardControl",
        icon: {  
            emoji: "⌨️",
            html: SVGIcons.keyboard
        }, 
        desc: "Sterowanie klawiaturą",
        type: SettingType.Checkbox,
        onchange: state => {
            if (state.value) {
                Keyboard.setupControl(app)
            }
            else {
                document.querySelectorAll('sub.small').forEach(sub => sub.remove())
                Keyboard.disableControl()
                if (app.slideObserver) app.slideObserver.disconnect()
            }
        },
        defaultValue: true,
        key: 'k'
    },
    {
        name: "changeTitle",
        icon: {  
            emoji: "🆎",
            html: SVGIcons.capitalT
        }, 
        desc: "Zmień tytuł karty",
        type: SettingType.Checkbox,
        onchange: state => {
            if (!state.value) {
                if (app.originalTitle) unsafeWindow.document.title = app.originalTitle
            }
            app.updateTabTitle()
        },
        onrender: () => {
            app.originalTitle = unsafeWindow.document.title
        },
        defaultValue: false,
        key: 't'
    },
    {
        name: "uniformFontSize",
        icon: {  
            emoji: "🔤",
            html: SVGIcons.type
        }, 
        desc: "Ujednolicona wielkość czcionki",
        type: SettingType.Checkbox,
        onchange: function (state) {
            if (state.value) {
                this.parent.setValue("increaseFontSize", false)
            }
            toggleBodyClass(BODY_CLASS_NAMES.uniformFontSize, state.value)
        },
        defaultValue: false,
        key: 'u'
    },
    {
        name: "invertImages",
        icon: {  
            emoji: "🔃",
            html: SVGIcons.pallete
        }, 
        desc: "Odwróć kolory obrazów",
        type: SettingType.Checkbox,
        defaultValue: false,
        onchange: state => toggleBodyClass(BODY_CLASS_NAMES.invertImages, state.value),
        key: 'i'
    },
    {
        name: "percentIncrease",
        type: SettingType.Percent,
        icon: {  
            emoji: "➕",
            html: SVGIcons.zoomIn
        }, 
        desc: "Zmień powiększenie",
        isInRange: nextValue => nextValue !== NaN && nextValue > 10 && nextValue < 300,
        defaultValue: 110,
        onchange: state => {
            updateFontSize(state.value)
            const rangeInput = document.querySelector(`input.${CLASS_NAMES.fontSizeInput}`) as HTMLInputElement
            const rangeLabel = document.querySelector(`.${CLASS_NAMES.fontSizeLabel}`) as HTMLLabelElement
            if (rangeInput) {
                rangeInput.value = state.value
                rangeInput.title = state.value
            }
            if (rangeLabel) rangeLabel.innerText = `${state.value}%`
        },
        onrender: function () {
            const rangeInput = document.querySelector(`input.${CLASS_NAMES.fontSizeInput}`) as HTMLInputElement
            const rangeLabel = document.querySelector(`.${CLASS_NAMES.fontSizeLabel}`) as HTMLLabelElement
            if (rangeInput) {
                rangeInput.value = this.value.toString()
                rangeLabel.innerText = `${this.value}%`
                rangeInput.addEventListener('change', event => {
                    const value = parseInt(rangeInput.value)
                    this.value = value
                })
                const oninput = (): void => {
                    const value = rangeInput.value
                    updateFontSize(parseInt(value))
                }
                rangeInput.addEventListener('input', oninput)
                this.addEventListener('input', oninput)
            }
            const increaseBy = (n: number) => {
                this.value += n
            }
            Keyboard.registerShortcut({
                keys: ['-'],
                callback: () => increaseBy(-5)
            })
            Keyboard.registerShortcut({
                keys: ['+', '='],
                callback: () => increaseBy(5)
            })
        },
        key: 'p'
    }
]