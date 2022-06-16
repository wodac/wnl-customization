///<reference path="CustomEventEmmiter.ts" />
///<reference path="../globals.d.ts" />

type SettingEvents<T> = {
    change: {
        value: T
        oldValue: T
        remote: boolean
    }
    input: { value: T }
    rendered: {}
    tmMenuClicked: {}
    disabled: boolean
}

enum SettingType {
    Checkbox, Percent, Integer, Button, Divider, Enum
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
    enum?: EnumOption<T extends string ? T : string>[]
    isInRange?: (value: T) => boolean
    type: SettingType
    onrender?: (this: SettingElement<T>) => any
    onclick?: (this: SettingElement<T>) => any
    onchange?: (this: SettingElement<T>, event: SettingEvents<T>["change"]) => any
}

type SettingInitAny = SettingInit<boolean> | SettingInit<number> | SettingInit<undefined> | DividerInit | EnumSettingInit<any, string>

class Setting<T> extends CustomEventEmmiter<SettingEvents<T>> {
    name: string
    private _value: T
    type: SettingType
    isInRange: (value: T) => boolean

    constructor(public options: SettingInit<T>, public parent?: Settings) {
        super()
        this.name = options.name
        this.type = options.type

        if (this.type !== SettingType.Button && this.type !== SettingType.Divider) {
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
        if (this.isInRange && !this.isInRange(value)) {
            this.trigger('change', { value: this._value, oldValue: this._value, remote: false })
            return
        }
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

type EnumOption<Keys extends string> = {
        value: Keys
        desc: string
    }

interface EnumSettingInit<T extends EnumOption<Keys extends string ? Keys : string>, Keys extends string> 
extends SettingInit<Keys> {
    type: SettingType.Enum
    enum: T[]
}

interface DividerInit {
    type: SettingType.Divider
}

class DividerSetting extends SettingElement<undefined> {
    element: HTMLElement
    static index = 0

    private readonly index = DividerSetting.index++

    constructor(parent: Settings) {
        super({
            name: '_divider',
            desc: 'Divider',
            type: SettingType.Divider
        }, parent)
    }

    render() {
        this.element = document.createElement('div')
        this.element.className = 'custom-setting-divider'
        this.element.innerHTML = `<div></div>`
        return this.element
    }

    renderSimple() {
        return '-'.repeat(15+this.index)
    }
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
        const isPercent = this.type === SettingType.Percent
        if (isPercent) {
            return `
                ${this.getIconHTML()}
                <label>${this.options.desc}</label>
                <div>
                    <a>${SVGIcons.minusCircle}</a>
                    <input type='range' name='${this.name}' />
                    <a>${SVGIcons.plusCircle}</a>
                    <span class='custom-range-val'></span>
                </div>`
        } else {
            return `
                ${this.getIconHTML()}
                <label>${this.options.desc}</label>
                <input type='number' name='${this.name}' />`
        }
    }

    render() {
        this.element = document.createElement('div')
        this.element.innerHTML = this.getHTML()
        this.element.classList.add('custom-script-setting')
        this.input = this.element.querySelector('input')
        this.input.value = this.value.toString()
        if (this.type === SettingType.Percent) {
            this.element.style.flexWrap = 'wrap'
            const valueEl = this.element.querySelector('span')
            valueEl.innerText = `${this.value}%`
            const btnElems = this.element.querySelectorAll('a')
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
        this.input.addEventListener('change', (ev) => this.value = this.parse(this.input.value))
        this.input.addEventListener(
            'input', 
            (ev) => this.trigger('input', { value: this.parse(this.input.value) })
        )
        this.trigger('rendered')
        return this.element
    }

    parse(value: string): number {
        return parseFloat(value.replace(',', '.'))
    }

    renderSimple() {
        const percentSymb = this.type === SettingType.Percent ? '%' : ''
        return this.getIconEmoji() + this.options.desc + ` (${this.value}${percentSymb})`
    }
}

class EnumSetting<Key extends string> 
extends SettingElement<Key> {
    element: HTMLElement
    select: HTMLSelectElement
    keys: (Key extends string ? Key : string)[]

    constructor(options: SettingInit<Key>, parent: Settings) {
        super(options, parent)
        this.keys = this.options.enum.map(opt => opt.value)
        this.addEventListener('tmMenuClicked', () => {
            const currentIndex = this.keys.findIndex(key => {
                return key === this.value
            }) + 1
            this.value = this.keys[currentIndex >= this.keys.length ? 0 : currentIndex] as Key
        })
    }

    getHTML() {
        return `
            ${this.getIconHTML()}
            <label>${this.options.desc}</label>
            <div>
                <select name='${this.name}'>
                    ${this.options.enum.map(opt => {
                        return `<option value='${opt.value}' 
                        ${opt.value === 'default' ? 'default' : ''}>
                        ${opt.desc}</option>`
                    }).join('')}
                </select>
            </div>`
    }

    render() {
        this.element = document.createElement('div')
        this.element.innerHTML = this.getHTML()
        this.element.classList.add('custom-script-setting')
        this.select = this.element.querySelector('select')
        this.select.value = this.value
        this.addEventListener('change', ({ value }) => this.select.value = value.toString())
        this.select.addEventListener('change', (ev) => this.value = this.select.value as Key)
        // this.select.addEventListener(
        //     'input', 
        //     (ev) => this.trigger('input', { value: this.select.value as Key })
        // )
        this.trigger('rendered')
        return this.element
    }

    renderSimple() {
        return this.getIconEmoji() + this.options.desc + ` (${
            this.options.enum.find(opt => opt.value === this.value).desc
        })`
    }
}

type SettingsEvents = {
    rendered: {}
    change: {}
}

type ValueChanger<T> = (old: T) => T

class Settings extends CustomEventEmmiter<SettingsEvents> {
    addSettings(settings: (SettingElement<any> | SettingInitAny)[]) {
        settings.forEach(sett => this.addSetting(sett))
    }
    settings: SettingElement<any>[] = []
    element: HTMLDivElement
    constructor(public app: App) {
        super()
    }

    addSetting<T>(setting: SettingElement<T> | SettingInitAny) {
        let sett: SettingElement<any>
        if (setting instanceof SettingElement) {
            setting.parent = this
            sett = setting
        } else if (setting.type === SettingType.Checkbox) {
            sett = new CheckboxSetting((setting as any), this)
        } else if (setting.type === SettingType.Button) {
            sett = new ButtonSetting((setting as any), this)
        } else if (setting.type === SettingType.Divider) {
            sett = new DividerSetting(this)
        } else if (setting.type === SettingType.Percent || setting.type === SettingType.Integer) {
            sett = new NumberSetting((setting as any), this)
        } else if (setting.type === SettingType.Enum) {
            sett = new EnumSetting((setting as EnumSettingInit<any, string>), this)
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
        GM_setValue(name, toSave)
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
