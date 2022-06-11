///<reference path="common.ts" />
///<reference path="Keyboard.ts" />
interface OptionState<T> extends OptionConstructorOption<any> {
    value: T
    [k: string]: any
}

interface OptionConstructorOption<Name extends keyof OptionsTypes> {
    name: Name
    desc: string | ((state: OptionsTypes[Name]) => string)
    type?: "button" | string
    callback?: (state: OptionsTypes[Name]) => (Partial<OptionsTypes[Name]> | void)
    update?: (this: Options, state: OptionsTypes[Name]) => any
    init?: (this: Options, state: OptionsTypes[Name]) => any
    defaultValue?: OptionsTypes[Name]["value"]
    key?: string
    [k: string]: any
}

class Options {
    state: OptionsTypes
    settingsContainerSelector: string

    constructor(options: OptionConstructorOption<any>[], settingsContainerSelector: string) {
        const document = unsafeWindow.document
        this.state = Object.fromEntries(
            options.map(
                option => [option.name, { ...option, value: option.defaultValue, handle: null }]
            )
        )
        this.settingsContainerSelector = settingsContainerSelector

        this.restoreState()
        this.init()
        this.update()
        this.storeState()
        this.rerender()
    }

    get settingsContainer() {
        return document.querySelector(this.settingsContainerSelector)
    }

    _rerenderSettings() {
       //console.log('trying to render sidebar', this.settingsContainer)
        if (this.settingsContainer) {
           //console.log('rendering sidebar', this.settingsContainer)
            const optionDivs = this.settingsContainer.querySelectorAll(`div.${CLASS_NAMES.optionContainer}`)
            optionDivs.forEach(el => el.remove())
            Object.values(this.state).forEach(
                option => this.settingsContainer.appendChild(this._getSettingsOption(option))
            )
        }
    }

    _getSettingsOption(option: OptionState<any>) {
        const optionContainer = document.createElement('div')
        optionContainer.classList.add(CLASS_NAMES.optionContainer)
        const getOption = (desc: string) => `<a class="custom-script-option" href="#">${desc}</a>`
        const desc = typeof option.desc === 'function' ? option.desc.apply(this, [option, this.state]) : option.desc
        optionContainer.innerHTML = getOption(desc)
        const optionLink = optionContainer.querySelector('a')
        optionLink.addEventListener('click', event => {
            event.preventDefault()
            this._runCallback(option)
        })
        return optionContainer
    }

    rerender() {
        let rerender = (name: string) => {
            const state = this.state[name]
            GM_unregisterMenuCommand(state.handle)
            const desc = typeof state.desc === 'function' ? state.desc(state) : state.desc
            this.state[name].handle = GM_registerMenuCommand(
                desc,
                () => this._runCallback(state),
                state.key
            )
        }
        rerender = rerender.bind(this)
        Object.keys(this.state).forEach(rerender)
        this._rerenderSettings()
    }

    _runCallback(option) {
        const result = option.callback.apply(this, [option, this.state])
        if (typeof result === 'object') this.setOptionState({ name: option.name, ...result })
    }

    setOptionState<Name extends keyof OptionsTypes>(
        state: Partial<OptionState<OptionsTypes[Name]['value']>> | 
            ((this: Options, state: OptionState<OptionsTypes[Name]['value']>) => Partial<OptionState<OptionsTypes[Name]['value']>>), 
        name?: Name) 
    {
        if (!name) name = state.name
        if (typeof state === 'function') {
            const result = state.apply(this, [this.state[name]])
            this._setOptionState({ ...this.state[name], ...result })
        }
        else this._setOptionState({ ...state, name })
    }
    _setOptionState(state: Partial<OptionState<any>>) {
        const name = state.name
        this.state[name] = { ...this.state[state.name], ...state }
        this.storeState(name)
        const updateCb = this.state[name].update
        if (updateCb) updateCb.apply(this, [state, this.state])
        this.rerender()
    }

    storeState(optionName?: string) {
        const saveOptionState = name => GM_setValue(`option_${name}` as keyof StoredValueType, this.state[name].value)
        if (typeof optionName === 'string') {
            saveOptionState(optionName)
            return
        }
        Object.keys(this.state).forEach(saveOptionState)
    }

    restoreState(optionName?: string) {
        const restoreOptionState = (name: string) => {
            this.state[name].value = GM_getValue(`option_${name}` as keyof StoredValueType, this.state[name].value)
        }
        if (typeof optionName === 'string') {
            restoreOptionState(optionName)
            return
        }
        Object.keys(this.state).forEach(restoreOptionState)
    }

    _runOnAllOptions(functionName: string) {
        Object.keys(this.state).forEach(optionName => {
            const option = this.state[optionName]
            const callback = option[functionName]
            if (typeof callback === 'function') callback.apply(this, [option, this.state])
        })
    }

    update() { this._runOnAllOptions('update') }
    init() {
        this._runOnAllOptions('init')
        this._rerenderSettings()
    }

    // options.forEach(option => { if (option.type === 'boolean') this.setOption[option.name](option.defaultValue) })
}

const getCheckboxEmoji = isOn => isOn ? "☑️ " : "🔲 "
interface ChangeTitle extends OptionState<boolean> {
    originalTitle: string
}

interface PercentIncrease extends OptionState<number> {
    increaseBy: (n: number) => number
}

type OptionsTypes = {
    changeTitle: ChangeTitle
    increaseFontSize: OptionState<boolean>
    increaseAnnotations: OptionState<boolean>
    percentIncrease: PercentIncrease
    invertImages: OptionState<boolean>
    uniformFontSize: OptionState<boolean>
    keyboardControl: OptionState<boolean>
    smoothScroll: OptionState<boolean>
    suggestBreak: OptionState<boolean>
    useNotes: OptionState<boolean>
}

const getOptionsConfig: (app: App) => OptionConstructorOption<any>[] = app => [
    {
        name: "increaseFontSize",
        desc: state => getCheckboxEmoji(state.value) + "🔎 Zwiększ wielkość czcionki",
        callback: function (state) {
            if (!state.value) {
                this.setOptionState({
                    name: "uniformFontSize",
                    value: false
                })
            }
            return { value: !state.value }
        },
        update: state => toggleBodyClass(BODY_CLASS_NAMES.increaseFontSize, state.value),
        defaultValue: true,
        key: 'f'
    },
    {
        name: "increaseAnnotations",
        desc: state => getCheckboxEmoji(state.value) + "📄 Zwiększ wielkość czcionki w przypisach",
        callback: function (state) {
            return { value: !state.value }
        },
        update: state => toggleBodyClass(BODY_CLASS_NAMES.increaseAnnotations, state.value),
        defaultValue: false,
        key: 'a'
    },
    {
        name: "hideChat",
        desc: state => getCheckboxEmoji(state.value) + "💬 Ukryj czat",
        callback: function (state) {
            return { value: !state.value }
        },
        update: state => toggleBodyClass(BODY_CLASS_NAMES.hideChat, state.value),
        defaultValue: false,
        key: 'c'
    },
    {
        name: "smoothScroll",
        desc: state => getCheckboxEmoji(state.value) + "↕️ Płynne przewijanie strzałkami",
        callback: function (state) {
            return { value: !state.value }
        },
        update: () => null,
        defaultValue: false,
        key: 's'
    },
    {
        name: "keyboardControl",
        desc: state => getCheckboxEmoji(state.value) + "⌨️ Sterowanie klawiaturą",
        callback: function (state) {
            return { value: !state.value }
        },
        update: state => {
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
        desc: state => getCheckboxEmoji(state.value) + "🆎 Zmień tytuł karty",
        callback: function (state) {
            return { ...state, value: !state.value }
        },
        update: state => {
           //console.log('changeTitle update', { state })
            if (!state.value) {
                if (state.originalTitle) unsafeWindow.document.title = state.originalTitle
                // unsafeWindow.removeEventListener('popstate', updateTabTitle)
            }
            app.updateTabTitle()
        },
        init: state => {
            state.originalTitle = unsafeWindow.document.title
            // unsafeWindow.addEventListener('popstate', updateTabTitle);
        },
        defaultValue: false,
        key: 't'
    },
    {
        name: "uniformFontSize",
        desc: state => getCheckboxEmoji(state.value) + "🔤 Ujednolicona wielkość czcionki",
        callback: function (state) {
            if (!state.value) {
                this.setOptionState({
                    name: "increaseFontSize",
                    value: false
                })
            }
            return { value: !state.value }
        },
        update: state => toggleBodyClass(BODY_CLASS_NAMES.uniformFontSize, state.value),
        defaultValue: false,
        key: 'u'
    },
    {
        name: "invertImages",
        desc: state => getCheckboxEmoji(state.value) + "🔃 Odwróć kolory obrazów",
        callback: function (state) {
            return { value: !state.value }
        },
        defaultValue: false,
        update: state => toggleBodyClass(BODY_CLASS_NAMES.invertImages, state.value),
        key: 'i'
    },
    {
        name: "percentIncrease",
        type: "button",
        desc: state => `➕ Zmień powiększenie (${state.value}%)`,
        callback: (state) => {
            const input = prompt(`Określ powiększenie czcionki (w %, obecnie ${state.value}%):`, state.value)
            if (typeof input === "string") {
                let nextValue = parseInt(input, 10)
                if (nextValue !== NaN && nextValue > 10 && nextValue < 300) {
                    return { value: nextValue }
                }
            }
        },
        defaultValue: 110,
        update: state => {
            updateFontSize(state.value)
            const rangeInput = document.querySelector(`input.${CLASS_NAMES.fontSizeInput}`) as HTMLInputElement
            const rangeLabel = document.querySelector(`.${CLASS_NAMES.fontSizeLabel}`) as HTMLLabelElement
            if (rangeInput) {
                rangeInput.value = state.value
                rangeInput.title = state.value
            }
            if (rangeLabel) rangeLabel.innerText = `${state.value}%`
        },
        init: function (state) {
            function _toRun(this: Options) {
                const rangeInput = document.querySelector(`input.${CLASS_NAMES.fontSizeInput}`) as HTMLInputElement
                const rangeLabel = document.querySelector(`.${CLASS_NAMES.fontSizeLabel}`) as HTMLLabelElement
                if (rangeInput) {
                    rangeInput.value = state.value
                    rangeLabel.innerText = `${state.value}%`
                    rangeInput.addEventListener('change', event => {
                        const value = parseInt(rangeInput.value)
                        this.setOptionState({ name: "percentIncrease", value })
                    })
                    rangeInput.addEventListener('input', event => {
                        const value = rangeInput.value
                        updateFontSize(parseInt(value))
                    })
                }
                state.increaseBy = (n: number) => {
                    const current = this.state.percentIncrease.value
                    this.setOptionState({ value: current + n }, 'percentIncrease')
                }
                Keyboard.registerShortcut({
                    keys: ['-'],
                    callback: () => state.increaseBy(-5)
                })
                Keyboard.registerShortcut({
                    keys: ['+', '='],
                    callback: () => state.increaseBy(5)
                })
            }
            const toRun = _toRun.bind(this)
            app.addEventListener('loaded',toRun)
        },
        key: 'p'
    }
]
