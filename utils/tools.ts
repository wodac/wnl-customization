///<reference path="common.ts" />
///<reference path="options.ts" />
///<reference path="Notes.ts" />
///<reference path="BreakTimer.ts" />
let noteTarget: HTMLElement
const notesBtnsAndTags = `
        <div class='custom-tags-container'> 
            <a class='custom-new-tag custom-tag'>${SVGIcons.plusCircle}</a>  
        </div>
        <div class='custom-notes-btns-container'>
            <a class="custom-notes-view-btn custom-script-slideshow-btn wnl-rounded-button">
                <div class="a-icon -x-small custom-while-inactive" title="Pokaż notatki">
                    ${SVGIcons.stickies}
                </div>
                <div class="a-icon -x-small custom-while-active" title="Ukryj notatki">
                    ${SVGIcons.stickiesFill}
                </div>
            </a>
            <div class="custom-add-note-btns-container">
                <a class="custom-add-btn custom-script-slideshow-btn wnl-rounded-button">
                    <div class="a-icon -x-small custom-while-inactive" title="Dodaj...">
                        ${SVGIcons.plusSquare}
                    </div>
                    <div class="a-icon -x-small custom-while-active" style='transform: rotateZ(180deg)' title="Ukryj menu">
                        ${SVGIcons.chevronUp}
                    </div>
                </a>
                <div class="custom-add-note-btns">
                    <a class="custom-add-note-btn custom-script-slideshow-btn wnl-rounded-button">
                        <div class="a-icon -x-small" title="Dodaj notatkę">
                        ${SVGIcons.stickies}
                        </div>
                    </a>
                    <a class="custom-add-tag-btn custom-script-slideshow-btn wnl-rounded-button">
                        <div class="a-icon -x-small" title="Dodaj tag">
                        ${SVGIcons.tags}
                        </div>
                    </a>
                </div>
            </div>
            <div class='custom-notes-additional-btns'>
                <a class="custom-clear-notes-btn custom-script-slideshow-btn wnl-rounded-button">
                    <div class="a-icon -x-small" title="Usuń wszystkie notatki">
                        ${SVGIcons.eraserFill}
                    </div>
                </a>
                <a class="custom-notes-view-type-btn custom-script-slideshow-btn wnl-rounded-button">
                    <div class="a-icon -x-small custom-while-inactive" title="Pokaż notatki w kolumnie">
                        ${SVGIcons.layoutChaotic}
                    </div>
                    <div class="a-icon -x-small custom-while-active" title="Pokaż notatki na slajdzie">
                        ${SVGIcons.viewStack}
                    </div>
                </a>
            </div>
            <a class="custom-tags-view-btn custom-script-slideshow-btn wnl-rounded-button">
                <div class="a-icon -x-small custom-while-inactive" title="Pokaż tagi">
                    ${SVGIcons.tags}
                </div>
                <div class="a-icon -x-small custom-while-active" title="Ukryj tagi">
                    ${SVGIcons.tagsFill}
                </div>
            </a>
        </div>`

function createNotesBtnsAndTags() {
    const slideshowContainer = document.querySelector('.slideshow-container')
    if (!slideshowContainer) return
    if (document.querySelector('.custom-tags-and-btns-container')) return
    const el = document.createElement('div')
    el.innerHTML = notesBtnsAndTags
    el.className = 'custom-tags-and-btns-container'
    slideshowContainer.append(el)
}

// const tagColorsStyles = document.createElement('style')
// document.head.append(tagColorsStyles)
class NotesRendering {
    btnsContainerNoNotes: ClassToggler
    btnsContainerNoTags: ClassToggler

    constructor(private app: App) {
        this.btnsContainerNoTags = new ClassToggler('custom-no-tags', '.custom-notes-btns-container')
        this.btnsContainerNoNotes = new ClassToggler('custom-no-notes', '.custom-notes-btns-container')
    }
    async loadNotes() {
        const appDiv = document.querySelector(SELECTORS.appDiv)
        const presentationMetadata = this.app.presentationMetadata
        this.app.notesCollection = await Notes.Collections.Presentation.createAsync(presentationMetadata.screenID, presentationMetadata.lessonID)
        if (this.app.tools && this.app.tools.getValue('useNotes')) {
            this.setupTagsNamesAndColors()
            const slideNumber = appDiv.attributes.getNamedItem('slide').value
            return this.renderNotes(parseInt(slideNumber))
        }
    }

    async setupTagsNamesAndColors() {
        const tags = await this.app.notesCollection.getAllTagNames()
        // this.addTagStyle(tags)
        const tagToOption = (tag: Notes.RecordTypes.Tag): HTMLOptionElement => {
            const opt = document.createElement('option')
            opt.value = tag.name
            opt.style.background = tag.color
            opt.innerHTML = tag.name
            return opt
        }
        const suggestions = tags.map(tagToOption)
        const suggestionsContainer = document.createElement('datalist')
        suggestionsContainer.id = 'custom-tags-list'
        suggestionsContainer.append(...suggestions)
        document.body.append(suggestionsContainer)

        this.app.notesCollection.addEventListener('changedTags', desc => {
            if (desc.added && desc.added.length) {
                // this.addTagStyle(desc.added)
                suggestionsContainer.append(...desc.added.map(tagToOption))
            }
            if (desc.changed && desc.changed.length) {
                // desc.changed.forEach(this.setTagColor)
            }
        })
    }

    // addTagStyle(tags: Notes.RecordTypes.Tag[]) {
    //     tags.forEach(async (tag) => {
    //         const rule = await this.getRuleFromTag(tag)
    //         //console.log({ rule })
    //         tagColorsStyles.sheet.insertRule(rule)
    //     })
    // }

    // async getRuleFromTag(tag: Notes.RecordTypes.Tag) {
    //     const varName = await this.setTagColor(tag)
    //     return `.custom-tag[title="${tag.name}"] { 
    //     background: var(${varName}-bg); 
    //     color: var(${varName}-color) 
    // }`
    // }

    getRandomTagColor(): string {
        const colors = ["#6e8898", "#606c38", "#fabc2a", "#c3423f", "#011936"]
        return getRandomElement(colors)
    }

    // async setTagColor(tag: Notes.RecordTypes.Tag) {
    //     const varName = await this.getTagVarName(tag)
    //     root.style.setProperty(`${varName}-bg`, tag.color)
    //     root.style.setProperty(`${varName}-color`, getForegroundColor(tag.color))
    //     return varName
    // }

    // async getTagVarName(tag: Notes.RecordTypes.Tag): Promise<string> {
    //     const subtleCrypto = unsafeWindow.crypto.subtle
    //     const encoder = new TextEncoder()
    //     const toDigest = encoder.encode(tag.name)
    //     const hashBuffer = await subtleCrypto.digest('SHA-1', toDigest)
    //     const hashArray = new Uint8Array(hashBuffer) as Uint8Array & number[]
    //     const hash = hashArray.map(v => v.toString(16).padStart(2, '0')).slice(0, 15).join('')
    //     return `--custom-tag-${hash}`
    // }

    renderNotes(slideNumber: number): Promise<HTMLDivElement[]> {
        if (this.app.currentSlideNotes) {
            this.app.currentSlideNotes.commitChanges()
            this.app.currentSlideNotes.removeEventListener('change', this.notesChangedListener)
        }
        if (this.app.tools && this.app.tools.getValue('useNotes') && this.app.notesCollection) {
            if (noteTarget) noteTarget.innerHTML = ''
            const currentSlide = document.querySelector(SELECTORS.currentSlideContainer)
            const notesOverlayElem = currentSlide.querySelector('.custom-notes-overlay')
            return this.app.notesCollection.getNotesBySlide(slideNumber).then(notes => {
                this.app.currentSlideNotes = notes
                this.renderTags()
                this.btnsContainerNoNotes.state = !notes.notes.length
                if (!noteTarget && notesOverlayElem) return notes.notes.map(n => n.element)
                //console.log({ currentSlideNotes })
                this.app.currentSlideNotes.addEventListener('change', this.notesChangedListener)
                return this.addNoteElems(notes.notes)
            })
        }
    }

    renderTags() {
        const tagContainer = document.querySelector('.custom-tags-container') as HTMLElement
        const toRemove = Array.from(tagContainer.children)
        toRemove.pop()
        toRemove.forEach(el => el.remove())
        const tags = this.app.currentSlideNotes.tags
        if (tags.length) {
            tags.forEach(tag => {
                tag.render(tagContainer)
                // tag.addEventListener('colorChange', ({ newColor }) => {
                //     this.setTagColor({ color: newColor, name: tag.content })
                // })
            })
        }
        this.btnsContainerNoTags.state = !tags.length
    }

    notesChangedListener = (change: Notes.Events.Slide['change']) => this.slideNotesChanged(change)

    slideNotesChanged(change: Notes.Events.Slide['change']) {
        if (change.added) {
            const regular = change.added.filter(note => note instanceof Notes.RegularNote) as Notes.RegularNote[]
            if (regular.length) this.addNoteElems(regular)
            const tags = change.added.filter(note => note instanceof Notes.TagNote) as Notes.TagNote[]
            this.btnsContainerNoTags.state = this.btnsContainerNoTags.state && !tags.length
            const tagContainer = document.querySelector('.custom-tags-container') as HTMLElement
            tags.forEach(tag => {
                const tagElem = tag.render(tagContainer)
                tagElem.click()
            })
        }
        if (change.deleted && !this.app.currentSlideNotes.notes.length) {
            this.btnsContainerNoNotes.state = true
        }
    }

    addNoteElems(notes: Notes.RegularNote[]): HTMLDivElement[] {
        if (!notes.length) return
        this.btnsContainerNoNotes.state = false
        let parent: HTMLElement
        const currentSlide = document.querySelector(SELECTORS.currentSlideContainer)
        if (noteTarget) {
            parent = noteTarget
        } else {
            let notesOverlayElem = currentSlide.querySelector('.custom-notes-overlay') as HTMLElement
            if (!notesOverlayElem) {
                notesOverlayElem = document.createElement('div') as HTMLElement
                notesOverlayElem.classList.add('custom-notes-overlay')
            }
            currentSlide.prepend(notesOverlayElem)
            parent = notesOverlayElem
        }

        return notes.map(note => {
            const noteElem = note.render(parent)
            const textContext = note.metadata.textContext
            if (textContext && textContext.trim().length) {
                const allNodes = currentSlide.querySelectorAll('*') as NodeListOf<HTMLElement>
                const contextElem = Array.from(allNodes).find(node => {
                    return node.innerText && node.innerText.trim() === textContext.trim()
                })
                if (contextElem) this.setupContextElem(contextElem, note)
            }
            return noteElem
        })
    }

    addNoteBtnHandler = (event: MouseEvent) => {
        if (this.app.currentSlideNotes) {
            const slide = document.querySelector(SELECTORS.currentSlideContainer) as HTMLElement
            slide.style.cursor = `copy`
            const newNote = this.app.currentSlideNotes.addNote({
                content: '', position: { x: 0, y: 1 },
                presentationTitle: this.app.presentationMetadata.presentationName,
                slideTitle: this.app.presentationMetadata.slideTitle
            })
            newNote.startFollowingMouse({ x: 0, y: 10 })
            slide.addEventListener('click', event => {
                event.preventDefault()
                event.stopImmediatePropagation()
                newNote.endFollowingMouse()
                slide.style.cursor = ''
                const contextElem = event.target as HTMLElement
                this.setupContextElem(contextElem, newNote)
                const textContext = contextElem.innerText
                newNote.metadata.textContext = textContext
                newNote.element.click()
            }, { once: true })
        }
    }

    setupContextElem(contextElem: HTMLElement, note: Notes.RegularNote) {
        const noteElem = note.element
        contextElem.title = `Notatka: ${note.content}`
        note.addEventListener('change', ({ newContent }) => contextElem.title = `Notatka: ${newContent}`)
        note.addEventListener('remove', () => contextElem.title = '')
        noteElem.addEventListener('mouseenter', () => {
            if (note.isMoving)
                return
            contextElem.style.border = 'solid 1px black'
        })
        noteElem.addEventListener('mouseleave', () => {
            contextElem.style.border = ''
        })
        note.addEventListener('remove', () => {
            contextElem.style.border = ''
        })
    }

    addNotesColumn() {
        const notesContainer = document.createElement('div')
        notesContainer.classList.add('custom-script-notes-column', 'custom-script-hidden')
        document.querySelector('.order-number-container').after(notesContainer)
        return notesContainer
    }
}
const notesOverlayToggle = new ClassToggler('custom-script-notes-visible')
const noteColumnToggle = new ClassToggler('custom-script-hidden', '.custom-script-notes-column')

let uploadInput

const getToolsConfig: (app: App) => SettingInit<any>[] = app => [
    {
        name: "suggestBreak",
        type: SettingType.Checkbox,
        desc: "Sugeruj przerwę przy dłuższym braku aktywności",
        icon: {
            emoji: '🔔',
            html: SVGIcons.bell
        },
        defaultValue: false,
        onchange: function (state) {
            if (!app.breakTimer)
                app.breakTimer = new BreakTimer(app)
            if (state.value) {
                app.breakTimer.startListening()
                app.breakTimer.start()
            } else {
                app.breakTimer.endListening()
            }
            this.parent.getSetting('breakTime').disabled = !state.value
        },
        onrender: () => {
            app.addEventListener('loaded',
                () => {
                    app.breakTimer = new BreakTimer(app)
                }
            );
        }
    },
    {
        name: 'breakTime',
        desc: "Czas przerwy (w minutach)",
        type: SettingType.Integer,
        defaultValue: 7,
        icon: {
            html: SVGIcons.stopwatch,
            emoji: '⌚'
        },
        onchange: function (event) {
            if (app.breakTimer.timer) {
                app.breakTimer.start()
            }
        },
        isInRange: val => val > 2 && val < 200
    },
    {
        name: "useNotes",
        type: SettingType.Checkbox,
        desc: "Używaj notatek i tagów",
        icon: {
            emoji: '📝',
            html: SVGIcons.stickies
        },
        defaultValue: false,
        onchange: function (state) {
            toggleBodyClass('custom-script-use-notes', state.value)
            if (app.notesRendering && app.presentationMetadata.screenID && state.value && !app.notesCollection) {
                app.notesRendering.addNotesColumn()
                setupNotesBtns(app)
                app.notesRendering.loadNotes()
            }
            this.parent.getSetting('exportNotes').disabled = !state.value
            this.parent.getSetting('importNotes').disabled = !state.value
        },
        onrender: function () {
            app.addEventListener('loaded',
                () => {
                    if (this.value) {
                        app.notesRendering.addNotesColumn()
                        setupNotesBtns(app)
                    }
                }
            )
        },
    },
    {
        name: "exportNotes",
        desc: "Eksportuj notatki",
        icon: {
            emoji: '📤',
            html: SVGIcons.export
        },
        type: SettingType.Button,
        onclick: () => {
            app.notesCollection.exportNotes().then(notes => {
                //console.log({ notes })
                downloadFile('application/json', `${app.presentationMetadata.presentationName}-notes.json`, JSON.stringify(notes))
            })
        }
    },
    {
        name: "importNotes",
        desc: "Importuj notatki",
        icon: {
            emoji: '📥',
            html: SVGIcons.import
        },
        type: SettingType.Button,
        onclick: function () {
            uploadInput.addEventListener('change', (ev) => {
                //console.log({ ev })
                if (uploadInput.files.length) {
                    const file = uploadInput.files.item(0)
                    file.text().then(
                        imported => app.notesCollection.importNotes(JSON.parse(imported))
                    ).then(() => unsafeWindow.location.reload())
                }
            }, { once: true })
            uploadInput.click()
        },
        onrender: function () {
            uploadInput = document.createElement('input')
            uploadInput.type = 'file'
            uploadInput.name = 'importNotes'
            uploadInput.accept = 'application/json'
            uploadInput.style.display = 'none'
            document.body.appendChild(uploadInput)
        }
    }
]

function setupNotesBtns(app: App) {
    createNotesBtnsAndTags()
    const addBtn = document.querySelector('.custom-add-btn') as HTMLElement
    const addBtnContToggle = new ClassToggler('active', '.custom-add-note-btns')
    const addBtnToggle = new ClassToggler('active', addBtn, t => {
        addBtnContToggle.state = t.state
    })
    addBtn.addEventListener('click', () => addBtnToggle.toggle())

    const viewTagsBtn = document.querySelector('.custom-tags-view-btn') as HTMLElement
    const viewTagsToggle = new ClassToggler('custom-script-tags-visible')
    const viewTagsBtnToggle = new ClassToggler('active', viewTagsBtn, t => viewTagsToggle.state = t.state)
    viewTagsBtn.addEventListener('click', () => viewTagsBtnToggle.toggle())

    const addTagBtns = document.querySelectorAll('.custom-new-tag, .custom-add-tag-btn')
    const onAddTag = () => {
        addBtnToggle.state = false
        viewTagsBtnToggle.state = true
        addTag()
    }
    addTagBtns.forEach(btn => btn.addEventListener('click', onAddTag))
    Keyboard.registerShortcut({ keys: ['t'], callback: onAddTag })

    const clearNotesBtn = document.querySelector('.custom-clear-notes-btn')
    clearNotesBtn.addEventListener('click', () => {
        if (app.currentSlideNotes && confirm(`Czy na pewno usunąć WSZYSTKIE (${app.currentSlideNotes.notes.length}) notatki ze slajdu ${app.currentSlideNotes.metadata.slide}?`))
            app.currentSlideNotes.removeAllNotes()
    })


    let viewNotesBtnToggle: ClassToggler
    const viewNotesBtn = document.querySelector('.custom-notes-view-btn')
    const hiddenBtnsToggle = new ClassToggler('inactive', '.custom-notes-additional-btns')

    const viewTypeBtn = document.querySelector('.custom-notes-view-type-btn') as HTMLElement
    const viewTypeBtnToggle = new ClassToggler('active', viewTypeBtn, t => {
        if (!viewNotesBtnToggle || !viewNotesBtnToggle.state)
            return
        noteColumnToggle.state = !t.state
        notesOverlayToggle.state = !t.state
        if (t.state) {
            noteTarget = noteColumnToggle.element as HTMLElement
            noteTarget.innerHTML = ''
        } else {
            noteTarget = null
            document.querySelectorAll('.custom-notes-overlay').forEach(el => el.remove())
        }
        app.currentSlideNotes.commitChanges().then(() => {
            app.notesRendering.renderNotes(app.presentationMetadata.slideNumber)
        })
    })
    viewNotesBtnToggle = new ClassToggler('active', viewNotesBtn, t => {
        hiddenBtnsToggle.state = !t.state
        notesOverlayToggle.state = !viewTypeBtnToggle.state && t.state
        noteColumnToggle.state = !(viewTypeBtnToggle.state && t.state)
    })

    const addNoteBtn = document.querySelector('.custom-add-note-btn') as HTMLAnchorElement
    addNoteBtn.addEventListener('click', (ev: MouseEvent) => {
        addBtnToggle.state = false
        viewNotesBtnToggle.state = true
        app.notesRendering.addNoteBtnHandler(ev)
    })

    viewNotesBtnToggle.state = app.tools && app.tools.getValue('useNotes')
    viewNotesBtn.addEventListener('click', () => viewNotesBtnToggle.toggle())
    Keyboard.registerShortcut({
        keys: ['n'], callback: () => viewNotesBtnToggle.toggle()
    })
    viewTypeBtn.addEventListener('click', () => viewTypeBtnToggle.toggle())
    Keyboard.registerShortcut({
        keys: ['v'], callback: () => viewTypeBtnToggle.toggle()
    })

    function addTag() {
        app.currentSlideNotes.addTag({
            content: '', color: app.notesRendering.getRandomTagColor(),
            presentationTitle: app.presentationMetadata.presentationName,
            slideTitle: app.presentationMetadata.slideTitle
        })
    }
}

