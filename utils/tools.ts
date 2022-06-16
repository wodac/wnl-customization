import App from "../App"
import BreakTimer from "./BreakTimer"
import { ClassToggler, SVGIcons, toggleBodyClass, downloadFile, isMobile } from "./common"
import Keyboard from "./Keyboard"
import { createNotesBtnsAndTags } from "./NotesRendering"
import { SettingElement, SettingInit, SettingType } from "./Settings"

const notesOverlayToggle = new ClassToggler('custom-script-notes-visible')
const noteColumnToggle = new ClassToggler('custom-script-hidden', '.custom-script-notes-column')

let uploadInput: HTMLInputElement

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
            (this.parent.getSetting('breakTime') as SettingElement<boolean>).disabled = !state.value
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
                // if (isMobile()) {
                //     viewNotesBtnToggle.state = true
                //     viewTagsBtnToggle.state = true
                // }
            }
            (this.parent.getSetting('exportNotes') as SettingElement<boolean>).disabled = !state.value;
            (this.parent.getSetting('importNotes') as SettingElement<boolean>).disabled = !state.value
        },
        onrender: function () {
            const onLoaded = () => {
                if (this.value) {
                    app.notesRendering.addNotesColumn()
                    setupNotesBtns(app)
                }
            }
            if (app.loaded) onLoaded()
            else app.addEventListener('loaded', onLoaded)
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
            if (!app.notesCollection) return
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
                if (!app.notesCollection) return
                if (uploadInput.files?.length) {
                    const file = uploadInput.files.item(0)
                    file?.text().then(
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
export default getToolsConfig

function setupNotesBtns(app: App) {
    createNotesBtnsAndTags()
    const addBtn = document.querySelector('.custom-add-btn') as HTMLElement
    const addBtnContToggle = new ClassToggler('active', '.custom-add-note-btns')
    const addBtnToggle = new ClassToggler('active', addBtn, t => {
        addBtnContToggle.state = t.state
    })
    addBtnToggle.setDismissible(true)
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

    const clearNotesBtn = document.querySelector('.custom-clear-notes-btn') as HTMLElement
    clearNotesBtn.addEventListener('click', () => {
        if (app.currentSlideNotes && confirm(`Czy na pewno usunąć WSZYSTKIE (${app.currentSlideNotes.notes.length}) notatki ze slajdu ${app.currentSlideNotes.metadata.slide}?`))
            app.currentSlideNotes.removeAllNotes()
    })


    const viewNotesBtn = document.querySelector('.custom-notes-view-btn') as HTMLElement
    const hiddenBtnsToggle = new ClassToggler('inactive', '.custom-notes-additional-btns')

    const viewTypeBtn = document.querySelector('.custom-notes-view-type-btn') as HTMLElement
    const viewTypeBtnToggle = new ClassToggler('active', viewTypeBtn, t => {
        if (!viewNotesBtnToggle || !viewNotesBtnToggle.state)
            return
        noteColumnToggle.state = !t.state
        notesOverlayToggle.state = !t.state
        if (t.state) {
            app.notesRendering.noteTarget = noteColumnToggle.element as HTMLElement
            app.notesRendering.noteTarget.innerHTML = ''
        } else {
            app.notesRendering.noteTarget = null
            document.querySelectorAll('.custom-notes-overlay').forEach(el => el.remove())
        }
        app.currentSlideNotes.commitChanges().then(() => {
            app.notesRendering.renderNotes(app.presentationMetadata.slideNumber)
        })
    })
    const viewNotesBtnToggle = new ClassToggler('active', viewNotesBtn, t => {
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

    if (isMobile()) {
        viewNotesBtnToggle.state = true
        viewTagsBtnToggle.state = true
    }

    function addTag() {
        app.currentSlideNotes.addTag({
            content: '', color: app.notesRendering.getRandomTagColor(),
            presentationTitle: app.presentationMetadata.presentationName || undefined,
            slideTitle: app.presentationMetadata.slideTitle || undefined
        })
    }
}

