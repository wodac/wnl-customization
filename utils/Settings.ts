///<reference path="CustomEventEmmiter.ts" />
///<reference path="../globals.d.ts" />

type SettingEvents<T> = {
    change: {
        value: T
        oldValue: T
        remote: boolean
    }
    input: {}
    rendered: {}
    tmMenuClicked: {}
    disabled: boolean
}

enum SettingType {
    Checkbox, Percent, Integer, Button
}

interface SettingInit<T> {
    icon?: {
        html?: string
        emoji?: string
    }
    name: string
    desc: string
    key?: string
    defaultValue?: T
    isInRange?: (value: T) => boolean
    type: SettingType
    onrender?: (this: SettingElement<T>) => any
    onclick?: (this: SettingElement<T>) => any
    onchange?: (this: SettingElement<T>, event: SettingEvents<T>["change"]) => any
}

class Setting<T> extends CustomEventEmmiter<SettingEvents<T>> {
    name: string
    private _value: T
    type: SettingType
    isInRange: (value: T) => boolean

    constructor(public options: SettingInit<T>, public parent?: Settings) {
        super()
        this.name = options.name
        this.type = options.type

        if (this.type !== SettingType.Button) {
            GM_addValueChangeListener(this.name, (name, oldValue, value, remote) => {
                if (this._value === value) return
                this._value = value
                this.trigger('change', { oldValue, remote, value })
            })
            this._value = GM_getValue(this.name, options.defaultValue)
            if (options.isInRange) this.isInRange = options.isInRange
        }
    }

    public get value(): T {
        return this._value
    }
    public set value(value: T) {
        if (this.type === SettingType.Button || this._value === value) return
        if (this.isInRange && !this.isInRange(value)) return
        const oldValue = this._value
        this._value = value
        GM_setValue(this.name, value)
        this.trigger('change', { value, oldValue, remote: false })
    }

}

abstract class SettingElement<T> extends Setting<T> {
    abstract element: HTMLElement
    private _disabled: boolean
    // abstract input?: HTMLInputElement
    tmHandle: any
    abstract render(): HTMLElement
    abstract renderSimple(): string

    constructor(options: SettingInit<T>, parent?: Settings) {
        super(options, parent)
        if (options.onchange) this.addEventListener('change', options.onchange)
        if (options.onrender) this.addEventListener('rendered', options.onrender)
        if (options.onclick) this.addEventListener('tmMenuClicked', options.onclick)
    }

    getIconHTML() {
        if (this.options.icon) {
            if (this.options.icon.html) {
                return this.options.icon.html
            } else if (this.options.icon.emoji) {
                return `<span class='custom-script-emoji'>${this.options.icon.emoji}</span>`
            }
        }
        return ''
    }

    getIconEmoji() {
        if (this.options.icon && this.options.icon.emoji) {
            return this.options.icon.emoji + ' '
        }
        return ''
    }

    removeFromTMMenu() {
        GM_unregisterMenuCommand(this.tmHandle)
    }

    set disabled(val: boolean) {
        if (this._disabled === val) return
        this._disabled = val
        if (val) this.removeFromTMMenu()
        if (this.element) {
            if (val) this.element.style.display = 'none'
            else this.element.style.display = ''
        }
        this.trigger('disabled', val)
    }

    addToTMMenu() {
        if (this._disabled) return
        this.tmHandle = GM_registerMenuCommand(
            this.renderSimple(),
            () => this.trigger('tmMenuClicked'),
            this.options.key
        )
    }
}

interface CheckboxSettingInit extends SettingInit<boolean> {
    type: SettingType.Checkbox
}

interface PercentSettingInit extends SettingInit<number> {
    type: SettingType.Percent
}

interface IntegerSettingInit extends SettingInit<number> {
    type: SettingType.Integer
}

interface ButtonSettingInit extends SettingInit<undefined> {
    type: SettingType.Button
}

class CheckboxSetting extends SettingElement<boolean> {
    element: HTMLElement
    input: HTMLInputElement

    constructor(options: CheckboxSettingInit, parent?: Settings) {
        super(options, parent)
        this.addEventListener('tmMenuClicked', () => {
            this.value = !this.value
        })
    }

    static getCheckboxEmoji = isOn => isOn ? "☑️" : "🔲"

    getHTML() {
        return `
        <input type='checkbox' id='custom-input-${this.name}' name='${this.name}' />
        ${this.getIconHTML()}
        <label for='custom-input-${this.name}'>${this.options.desc}</label>`
    }

    render() {
        this.element = document.createElement('div')
        this.element.innerHTML = this.getHTML()
        this.element.classList.add('custom-script-setting')
        this.input = this.element.querySelector('input')
        this.input.checked = this.value
        this.addEventListener('change', ({ value }) => this.input.checked = value)
        this.input.addEventListener('change', (ev) => this.value = this.input.checked)
        this.trigger('rendered')
        return this.element
    }

    renderSimple() {
        return CheckboxSetting.getCheckboxEmoji(this.value) + ' ' +
                this.getIconEmoji() + this.options.desc
    }
}

class ButtonSetting extends SettingElement<boolean> {
    element: HTMLElement
    btn: HTMLAnchorElement

    constructor(options: CheckboxSettingInit, parent: Settings) {
        super(options, parent)
    }

    static getCheckboxEmoji = isOn => isOn ? "☑️" : "🔲"

    getHTML() {
        let inner = this.getIconHTML()
        inner += this.options.desc
        return `<a name='${this.name}'>${inner}</a>`
    }

    render() {
        this.element = document.createElement('div')
        this.element.innerHTML = this.getHTML()
        this.element.classList.add('custom-script-setting')
        this.btn = this.element.querySelector('a')
        this.btn.addEventListener('click', () => this.trigger('tmMenuClicked'))
        this.trigger('rendered')
        return this.element
    }

    renderSimple() {
        return this.getIconEmoji() + this.options.desc
    }
}

class NumberSetting extends SettingElement<number> {
    element: HTMLElement
    input: HTMLInputElement

    constructor(options: PercentSettingInit | IntegerSettingInit, parent: Settings) {
        super(options, parent)
        this.addEventListener('tmMenuClicked', () => {
            const isPercent = options.type === SettingType.Percent
            this.value = parseInt(
                prompt(`Podaj wartość ${isPercent ? "procentową " : ''
                    }dla ustawienia (obecnie ${this.value}${isPercent ? '%' : ''
                    }):\n${this.options.desc}`)
            )
        })
    }

    set upperLimit(ul: number) {
        this.input && (this.input.max = ul.toString())
    }

    set lowerLimit(ll: number) {
        this.input && (this.input.min = ll.toString())
    }

    getHTML() {
        return `
        ${this.getIconHTML()}
        <label>${this.options.desc}</label>
        <input type='${this.type === SettingType.Integer ? 'number' : 'range'
            }' name='${this.name}' />`
    }

    render() {
        this.element = document.createElement('div')
        this.element.innerHTML = this.getHTML()
        this.element.classList.add('custom-script-setting')
        this.input = this.element.querySelector('input')
        this.input.value = this.value.toString()
        if (this.type === SettingType.Percent) {
            const valueEl = document.createElement('span')
            valueEl.classList.add('custom-range-val')
            valueEl.innerText = `${this.value}%`
            const btns = [ SVGIcons.minusCircle, SVGIcons.plusCircle ]
            const btnElems = btns.map(icon => {
                const el = document.createElement('a')
                el.innerHTML = icon
                return el
            })
            this.input.before(btnElems[0])
            this.input.after(btnElems[1], valueEl)
            btnElems.forEach((btn, i) => {
                btn.addEventListener('click', (ev) => {
                    ev.preventDefault()
                    const delta = Math.ceil(this.value * 0.05)
                    this.value = this.value + (i ? delta : -delta)
                })
            })
            this.addEventListener('change', ({value}) => valueEl.innerText = `${value}%`)
            this.input.addEventListener('input', () => valueEl.innerText = `${this.input.value}%`)
        }
        this.addEventListener('change', ({ value }) => this.input.value = value.toString())
        this.input.addEventListener('change', (ev) => this.value = parseInt(this.input.value))
        // this.input.addEventListener('input', (ev) => this.trigger('input'))
        this.trigger('rendered')
        return this.element
    }

    renderSimple() {
        const percentSymb = this.type === SettingType.Percent ? '%' : ''
        return this.getIconEmoji() + this.options.desc + ` (${this.value}${percentSymb})`
    }
}

type SettingsEvents = {
    rendered: {}
    change: {}
}

type ValueChanger<T> = (old: T) => T

class Settings extends CustomEventEmmiter<SettingsEvents> {
    addSettings(settings: (SettingElement<any> | SettingInit<any>)[]) {
        settings.forEach(sett => this.addSetting(sett))
    }
    settings: SettingElement<any>[] = []
    element: HTMLDivElement
    constructor(public app: App) {
        super()
    }

    addSetting<T>(setting: SettingElement<T> | SettingInit<T>) {
        let sett: SettingElement<any>
        if (setting instanceof SettingElement) {
            setting.parent = this
            sett = setting
        } else if (setting.type === SettingType.Checkbox) {
            sett = new CheckboxSetting((setting as any), this)
        } else if (setting.type === SettingType.Button) {
            sett = new ButtonSetting((setting as any), this)
        } else if (setting.type === SettingType.Percent || setting.type === SettingType.Integer) {
            sett = new NumberSetting((setting as any), this)
        }
        if (!sett) return
        this.settings.push(sett)
        this.app.addEventListener('loaded',
            () => sett.trigger('change', {
                value: sett.value,
                oldValue: sett.options.defaultValue,
                remote: false
            })
        )
        sett.addEventListener('change', () => {
            this.renderInTMMenu()
        })
    }

    setValue<T>(name: string, value: T | ValueChanger<T>) {
        let toSave: T
        if (typeof value === "function") toSave = (value as ValueChanger<T>)(this.getValue(name))
        else toSave = value
        GM_setValue(name, value)
    }

    getValue(name: string) {
        return GM_getValue(name)
    }

    getSetting(name: string) {
        return this.settings.find(s => s.name === name)
    }

    renderInTMMenu() {
        this.settings.forEach(setting => {
            setting.removeFromTMMenu()
            setting.addToTMMenu()
        })
    }

    render() {
        this.element = document.createElement('div')
        this.element.append(...this.settings.map(setting => setting.render()))
        return this.element
    }
}