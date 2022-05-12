function Options (options, sidebarSettingsContainer) {
    const document = unsafeWindow.document
    this.state = Object.fromEntries(
        options.map(
            option => [option.name, { ...option, value: option.defaultValue, handle: null }]
        )
    )

    this._rerenderSidebar = function () {
        if (sidebarSettingsContainer) {
            const optionDivs = sidebarSettingsContainer.querySelectorAll('div.custom-script-option-container')
            optionDivs.forEach(el => el.remove())
            Object.values(this.state).forEach(
                option => sidebarSettingsContainer.appendChild( this._getSidebarOption(option) )
            )
        }
    }

    this._getSidebarOption = function (option) {
        const optionContainer = document.createElement('div')
        optionContainer.classList.add('custom-script-option-container')
        const getOption = desc => `<a class="custom-script-option" href="#">${desc}</a>`
        const desc = typeof option.desc === 'function' ? option.desc.apply(this, [option, this.state]) : option.desc
        optionContainer.innerHTML = getOption(desc)
        const optionLink = optionContainer.querySelector('a')
        optionLink.addEventListener('click', event => {
            event.preventDefault()
            this._runCallback(option)
        })
        return optionContainer
    }

    this.rerender = function () {
        let rerender = name => {
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
        Object.keys(this.state).forEach( rerender )
        this._rerenderSidebar()
    }

    this._runCallback = function (option) {
        const result = option.callback.apply(this, [option, this.state])
        if (typeof result === 'object') this.setOptionState({ name: option.name, ...result })
    }

    this.setOptionState = function (state, name) {
        if (typeof state === 'function') {
            const result = state.apply( this, [this.state[name]] )
            this._setOptionState({ ...this.state[name], ...result })
        }
        else this._setOptionState(state)
    }
    this._setOptionState = function (state) {
        const name = state.name
        this.state[name] = { ...this.state[state.name], ...state }
        this.storeState(name)
        this.state[name].update.apply(this, [state, this.state])
        this.rerender()
    }

    this.storeState = function (optionName: string) {
        const saveOptionState = name => GM_setValue(`option_${name}` as keyof StoredValueType, this.state[name].value)
        if (typeof optionName === 'string') {
            saveOptionState(optionName)
            return
        }
        Object.keys(this.state).forEach( saveOptionState )
    }

    this.restoreState = function (optionName: string) {
        const restoreOptionState = (name: string) => {
            this.state[name].value = GM_getValue(`option_${name}` as keyof StoredValueType, this.state[name].value)
        }
        if (typeof optionName === 'string') {
            restoreOptionState(optionName)
            return
        }
        Object.keys(this.state).forEach( restoreOptionState )
    }

    this._runOnAllOptions = function (functionName: string) {
        Object.keys(this.state).forEach( optionName => {
            const option = this.state[optionName]
            const callback = option[functionName]
            if (typeof callback === 'function') callback.apply(this, [option, this.state])
        } )
    }

    this.update = function () { this._runOnAllOptions('update') }
    this.init = function () {
        this._runOnAllOptions('init')
        this._rerenderSidebar()
    }

    this.rerender = this.rerender.bind(this)
    this._runCallback = this._runCallback.bind(this)
    this._getSidebarOption = this._getSidebarOption.bind(this)
    this._rerenderSidebar = this._rerenderSidebar.bind(this)
    this.restoreState = this.restoreState.bind(this)
    this.storeState = this.storeState.bind(this)
    this.setOptionState = this.setOptionState.bind(this)
    this._setOptionState = this._setOptionState.bind(this)
    this._runOnAllOptions = this._runOnAllOptions.bind(this)
    this.update = this.update.bind(this)
    this.init = this.init.bind(this)

    this.restoreState()
    this.init()
    this.update()
    this.storeState()
    this.rerender()
    // options.forEach(option => { if (option.type === 'boolean') this.setOption[option.name](option.defaultValue) })
}

const getCheckbox = isOn => isOn ? "☑️ " : "🔲 "

    options = new Options([
        {
            name: "increaseFontSize",
            desc: state => getCheckbox(state.value) + "🔎 Zwiększ wielkość czcionki",
            callback: function (state) {
                if (!state.value) {
                    this.setOptionState({
                        name: "uniformFontSize",
                        value: false
                    })
                }
                return { value: !state.value }
            },
            update: state => toggleBodyClass("custom-script-increase-font-size", state.value),
            defaultValue: true,
            key: 'f'
        },
        {
            name: "increaseAnnotations",
            desc: state => getCheckbox(state.value) + "📄 Zwiększ wielkość czcionki w przypisach",
            callback: function (state) {
                return { value: !state.value }
            },
            update: state => toggleBodyClass("custom-script-increase-annotations", state.value),
            defaultValue: false,
            key: 'a'
        },
        {
            name: "smoothScroll",
            desc: state => getCheckbox(state.value) + "↕️ Płynne przewijanie strzałkami",
            callback: function (state) {
                return { value: !state.value }
            },
            update: () => null,
            defaultValue: false,
            key: 'a'
        },
        {
            name: "keyboardControl",
            desc: state => getCheckbox(state.value) + "⌨️ Sterowanie klawiaturą",
            callback: function (state) {
                return { value: !state.value }
            },
            update: state => {
                if (state.value) {
                    setupKeyboardControl()
                }
                else {
                    document.querySelectorAll('sub.small').forEach(sub => sub.remove())
                    document.body.removeEventListener('keyup', shortcutListener)
                    if (slideObserver) slideObserver.disconnect()
                }
            },
            defaultValue: true,
            key: 'a'
        },
        {
            name: "changeTitle",
            desc: state => getCheckbox(state.value) + "🆎 Zmień tytuł karty",
            callback: function (state) {
                return { ...state, value: !state.value }
            },
            update: state => {
                console.log('changeTitle update', {state})
                unsafeWindow.document.title = (state.value && state.newTitle) ? state.newTitle : state.originalTitle
            },
            init: state => {
                state.originalTitle = unsafeWindow.document.title
                let headerElem = document.querySelector('.o-lesson__title__left__header') as HTMLElement
                console.log({ headerElem })
                if (headerElem !== null) state.newTitle = headerElem.innerText
                console.log({ newTitle: state.newTitle })
                if (state.originalTitle && state.newTitle) unsafeWindow.document.title = state.value ? state.newTitle : state.originalTitle
            },
            defaultValue: false,
            key: 'a'
        },
        {
            name: "uniformFontSize",
            desc: state => getCheckbox(state.value) + "🔤 Ujednolicona wielkość czcionki",
            callback: function (state) {
                if (!state.value) {
                    this.setOptionState({
                        name: "increaseFontSize",
                        value: false
                    })
                }
                return { value: !state.value }
            },
            update: state => toggleBodyClass("custom-script-uniform-font-size", state.value),
            defaultValue: false,
            key: 'u'
        },
        {
            name: "invertImages",
            desc: state => getCheckbox(state.value) + "🔃 Odwróć kolory obrazów",
            callback: function (state) {
                return { value: !state.value }
            },
            defaultValue: false,
            update: state => toggleBodyClass("custom-script-invert-images", state.value),
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
                const rangeInput = document.querySelector('input.custom-script-font-size-input') as HTMLInputElement
                const rangeLabel = document.querySelector('label.custom-script-font-size-label') as HTMLLabelElement
                if (rangeInput) rangeInput.value = state.value
                if (rangeLabel) rangeLabel.innerText = `${state.value}%`
            },
            init: function (state) {
                function _toRun() {
                    const rangeInput = document.querySelector('input.custom-script-font-size-input') as HTMLInputElement
                    const rangeLabel = document.querySelector('label.custom-script-font-size-label') as HTMLLabelElement
                    if (rangeInput) {
                        rangeInput.value = state.value
                        rangeLabel.innerText = `${state.value}%`
                        rangeInput.addEventListener('change', event => {
                            const value = rangeInput.value
                            this.setOptionState({ name: "percentIncrease", value })
                        })
                        rangeInput.addEventListener('input', event => {
                            const value = rangeInput.value
                            updateFontSize(parseInt(value))
                        })
                    }
                }
                const toRun = _toRun.bind(this)
                toRunOnLoaded.push(toRun)
            },
            key: 'p'
        }
    ], sidebarSettingsContainer)