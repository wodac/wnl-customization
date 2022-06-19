///<reference path="common.ts" />
///<reference path="Keyboard.ts" />
///<reference path="Settings.ts" />
///<reference path="CourseSidebar.ts" />
///<reference path="../App.ts" />

type Themes = 'default' | 'white' | 'black' | 'image' | 'custom'

type ThemeEnum = EnumOption<Themes>

const mouseTimer = new ResettingTimer(5000)

const getOptions: (app: App) => (SettingInitAny)[] = (app) => [
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
                rangeInput.value = state.value.toString()
                rangeInput.title = state.value.toString()
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
    },
    {
        type: SettingType.Divider
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
        name: "hideSlideNav",
        icon: {
            emoji: "↔️",
            html: SVGIcons.code
        },
        desc: "Ukryj strzałki nawigacji na slajdach",
        type: SettingType.Checkbox,
        defaultValue: isMobile(),
        onchange: state => toggleBodyClass(BODY_CLASS_NAMES.hideSlideNav, state.value),
    },
    {
        name: "showMainCourseSidebar",
        icon: {
            emoji: "📗",
            html: SVGIcons.viewStack
        },
        desc: "Pokaż nawigację całego kursu w panelu bocznym",
        type: SettingType.Checkbox,
        defaultValue: false,
        onchange: state => {
            if (state.value) {
                if (!app.courseSidebar) {
                    setupSidebar()
                    app.addEventListener('unloaded', () => app.courseSidebar.destroy())
                }
                app.addEventListener('loaded', setupSidebar)
                app.courseSidebar.show()
            } else {
                app.removeEventListener('loaded', setupSidebar)
                if (app.courseSidebar) app.courseSidebar.hide()
            }

            function setupSidebar() {
                app.courseSidebar = new CourseSidebar()
                const sidenav = document.querySelector('aside.course-sidenav')
                if (sidenav && !document.querySelector('.wnl-sidenav-detached')) {
                    app.courseSidebar.attach(sidenav)
                } else {
                    app.setupObserveSidenav()
                    app.addEventListener('sidenavOpened', opened => {
                        if (opened) {
                            const sidenav = document.querySelector('aside.course-sidenav')
                            app.courseSidebar.attach(sidenav)
                        }
                    })
                }
                app.courseSidebar.addEventListener('urlChange', toOpen => {
                    app.tabOpener.openSlide(toOpen)
                })
            }
        },
    },
    {
        type: SettingType.Divider
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
        defaultValue: !isMobile(),
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
        defaultValue: !isMobile(),
        key: 't'
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
        name: "changeTheme",
        icon: {
            emoji: "🖼️",
            html: SVGIcons.palette2
        },
        enum: [
            {
                value: 'default',
                desc: 'nie zmieniaj'
            },
            {
                value: 'white',
                desc: 'biały'
            },
            {
                value: 'black',
                desc: 'czarny'
            },
            {
                value: 'image',
                desc: 'obrazek'
            },
            {
                value: 'custom',
                desc: 'wybrany kolor...'
            }
        ],
        desc: "Zmień domyślny motyw...",
        type: SettingType.Enum,
        defaultValue: "default",
        onchange: function (state) {
            app.setBackground()
            const parent = this.parent
            console.log({parent})
            const customColorSett = parent.getSetting('customSlideshowColor')
            console.log({customColorSett})
            customColorSett.disabled = state.value !== 'custom'
        },
        key: 'i'
    } as EnumSettingInit<ThemeEnum, Themes>,
    {
        type: SettingType.Color,
        name: 'customSlideshowColor',
        desc: 'Kolor slajdów',
        defaultValue: '#ffffff',
        icon: {
            html: SVGIcons.pallete,
            emoji: '🎨'
        },
        onchange: state => {
            console.log('color chosen:', state.value)
            setRootProperty('custom-slideshow-bg-color', state.value)
            setRootProperty('custom-slideshow-fg-color', getForegroundColor(state.value))            
        }
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
        name: "hideCursor",
        icon: {
            emoji: "🖱️",
            html: SVGIcons.cursor
        },
        desc: "Ukryj kursor (przy braku aktywności)",
        type: SettingType.Checkbox,
        defaultValue: false,
        onchange: state => {
            if (state.value) {
                mouseTimer.start()
            } else {
                mouseTimer.endListening()
            }
        },
        onrender: function () {
            if (isMobile()) {
                this.disabled = true
                return
            }
            mouseTimer.addEventListener('timerEnd', () => {
                setMouseVisible(false)
                document.addEventListener('mousemove', () => setMouseVisible(true))
            })
            mouseTimer.addEventListener('timerStart', () => setMouseVisible(true))
            setupListening()
            mouseTimer.addEventListener('endListening', () => {
                document.removeEventListener('mousemove', mouseTimer.listener)
                setMouseVisible(true)
                setupListening()
            })
            
            Keyboard.registerShortcut({
                keys: ['m'],
                callback: () => {
                    this.value = !this.value
                }
            })

            
            function setMouseVisible(visible: boolean) {
                toggleBodyClass(BODY_CLASS_NAMES.hideCursor, !visible)
            }
            function setupListening() {
                mouseTimer.addEventListener('timerStart', () => {
                    document.addEventListener('mousemove', mouseTimer.listener)
                    setMouseVisible(false)
                }, true)
            }
        }
    },
    {
        type: SettingType.Divider
    },
    {
        name: "hideTools",
        icon: {
            emoji: "🛠️",
            html: SVGIcons.tools
        },
        desc: "Ukryj narzędzia",
        type: SettingType.Checkbox,
        onchange: state => toggleBodyClass(BODY_CLASS_NAMES.hideTools, state.value),
        defaultValue: false,
    },
    {
        name: "hideTags",
        icon: {
            emoji: "🔖",
            html: SVGIcons.tags
        },
        desc: "Ukryj listę tagów",
        type: SettingType.Checkbox,
        onchange: state => toggleBodyClass(BODY_CLASS_NAMES.hideTags, state.value),
        defaultValue: false,
    },
    {
        name: "hideBottomSearch",
        icon: {
            emoji: "🔎",
            html: SVGIcons.search
        },
        desc: "Ukryj narzędzie wyszukiwania pod slajdem",
        type: SettingType.Checkbox,
        onchange: state => toggleBodyClass(BODY_CLASS_NAMES.hideBottomSearch, state.value),
        defaultValue: false,
    },
]