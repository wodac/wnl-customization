let suggestBreakTimer: NodeJS.Timeout, obs: MutationObserver, noteTarget: HTMLElement
function startBreakTimer() {
    clearTimeout(suggestBreakTimer)
    console.log('starting suggestBreak timer...')
    suggestBreakTimer = setTimeout(() => {
        alert('Pora na przerwę 🔔')
    }, 1000 * 60 * 7)
}

const notesBtnsContainer = `
    <div class='custom-notes-btns-container'>
        <a class="custom-notes-view-btn custom-script-slideshow-btn wnl-rounded-button">
            <div class="a-icon -x-small custom-while-inactive" title="Pokaż notatki">
                ${svgIcons.stickies}
            </div>
            <div class="a-icon -x-small custom-while-active" title="Ukryj notatki">
                ${svgIcons.stickiesFill}
            </div>
        </a>
        <div class='custom-notes-additional-btns hidden'>
            <a class="custom-add-note-btn custom-script-slideshow-btn wnl-rounded-button">
                <div class="a-icon -x-small" title="Dodaj notatkę">
                    ${svgIcons.plusSquare}
                </div>
            </a>
            <a class="custom-clear-notes-btn custom-script-slideshow-btn wnl-rounded-button">
                <div class="a-icon -x-small" title="Usuń wszystkie notatki">
                    ${svgIcons.eraserFill}
                </div>
            </a>
            <a class="custom-notes-view-type-btn custom-script-slideshow-btn wnl-rounded-button">
                <div class="a-icon -x-small custom-while-inactive" title="Pokaż notatki w kolumnie">
                    ${svgIcons.layoutChaotic}
                </div>
                <div class="a-icon -x-small custom-while-active" title="Pokaż notatki na slajdzie">
                    ${svgIcons.viewStack}
                </div>
            </a>
        </div>
    </div>`


async function loadNotes() {
    const appDiv = document.querySelector(SELECTORS.appDiv)
    notesCollection = await PresentationNotesCollection.createAsync(presentationScreenID)
    if (tools && tools.state.useNotes.value) {
        const slideNumber = appDiv.attributes.getNamedItem('slide').value
        return renderNotes(parseInt(slideNumber))
    }
}

function renderNotes(slideNumber: number) {
    if (currentSlideNotes)
        currentSlideNotes.commitChanges()
    if (tools && tools.state.useNotes.value && notesCollection) {
        if (noteTarget) noteTarget.innerHTML = ''
        const currentSlide = document.querySelector(SELECTORS.currentSlideContainer)
        const notesOverlayElem = currentSlide.querySelector('.custom-notes-overlay')
        if (!noteTarget && notesOverlayElem) return
        return notesCollection.getNotesBySlide(slideNumber).then(notes => {
            currentSlideNotes = notes
            console.log({ currentSlideNotes })
            currentSlideNotes.onchange = slideNotesChanged
            return addNoteElems(notes.notes)
        })
    }
}

function slideNotesChanged(change: SlideNotesChange) {
    if (change.added) {
        addNoteElems(change.added)
    }
}

function addNoteElems(notes: Note[]): HTMLDivElement[] {
    let parent: HTMLElement
    if (noteTarget) {
        parent = noteTarget
    } else {
        const currentSlide = document.querySelector(SELECTORS.currentSlideContainer)
        let notesOverlayElem = currentSlide.querySelector('.custom-notes-overlay') as HTMLElement
        if (!notesOverlayElem) {
            notesOverlayElem = document.createElement('div') as HTMLElement
            notesOverlayElem.classList.add('custom-notes-overlay')
        }
        currentSlide.prepend(notesOverlayElem)
        parent = notesOverlayElem
    }

    return notes.map(note => {
        return note.render(parent)
    })
}

const addNoteBtnHandler = (event: MouseEvent) => {
    if (currentSlideNotes) {
        const slide = document.querySelector(SELECTORS.currentSlideContainer) as HTMLElement
        slide.style.cursor = `copy`
        slide.addEventListener('click', event => {
            event.preventDefault()
            event.stopImmediatePropagation()
            slide.style.cursor = ''
            const slideRect = slide.getBoundingClientRect()
            console.log({ event, slideRect })
            const position: Position = {
                x: (event.x - slideRect.x) / slideRect.width,
                y: (event.y - slideRect.y) / slideRect.height
            };
            const textContext = (event.target as HTMLElement).innerText
            const newNote = currentSlideNotes.addNote({
                position, content: '', textContext,
                presentationTitle: presentationName,
                slideTitle: currentSlideTitle
            })
            newNote.element.click()
        }, { once: true })
    }
}

function addNotesColumn() {
    const notesContainer = document.createElement('div')
    notesContainer.classList.add('custom-script-notes-column', 'custom-script-hidden')
    document.querySelector('.order-number-container').after(notesContainer)
    return notesContainer
}

const notesOverlayToggle = new ClassToggler('custom-script-notes-visible')
const noteColumnToggle = new ClassToggler('custom-script-hidden', '.custom-script-notes-column')

toRunOnLoaded.push(
    () => {
        obs = onAttributeChange(document.querySelector(SELECTORS.appDiv), 'slide', () => {
            startBreakTimer()
        })
        tools && !tools.state.suggestBreak.value && obs.disconnect()

        if (tools && tools.state.useNotes.value) {
            addNotesColumn()
            setupNotesBtns()
        }
    }
)

tools = new Options([
    {
        name: "suggestBreak",
        desc: state => `${getCheckboxEmoji(state.value)}🔔 Sugeruj przerwę przy dłuższym braku aktywności`,
        defaultValue: false,
        callback: function (state) {
            return { value: !state.value }
        },
        update: state => {
            console.log('update suggestBreak', { state, obs })
            if (!obs) return
            if (state.value) {
                obs.observe(document.querySelector(SELECTORS.appDiv), { attributes: true })
                startBreakTimer()
            } else {
                obs.disconnect()
                if (suggestBreakTimer) clearTimeout(suggestBreakTimer)
            }
        }
    },
    {
        name: "useNotes",
        desc: state => `${getCheckboxEmoji(state.value)}📝 Używaj notatek`,
        defaultValue: false,
        callback: function (state) {
            return { value: !state.value }
        },
        update: state => {
            toggleBodyClass('custom-script-use-notes', state.value)
            if (presentationScreenID && state.value && !notesCollection) {
                addNotesColumn()
                setupNotesBtns()
                loadNotes()
            }
        },
        init: state => {
        },
    },
    {
        name: "exportNotes",
        desc: "📤 Eksportuj notatki",
        type: 'button',
        callback: () => {
            notesCollection.exportNotes().then(notes => {
                console.log({ notes })
                downloadFile('application/json', `${presentationName}-notes.json`, JSON.stringify(notes))
            })
        }
    },
    {
        name: "importNotes",
        desc: "📥 Importuj notatki",
        type: 'button',
        callback: (state) => {
            const uploadInput = state.uploadInput as HTMLInputElement
            uploadInput.addEventListener('change', (ev) => {
                console.log({ ev })
                if (uploadInput.files.length) {
                    const file = uploadInput.files.item(0)
                    file.text().then(
                        imported => notesCollection.importNotes(JSON.parse(imported))
                    ).then(() => unsafeWindow.location.reload())
                }
            }, { once: true })
            uploadInput.click()
        },
        init: (state) => {
            const uploadInput = document.createElement('input')
            uploadInput.type = 'file'
            uploadInput.name = 'importNotes'
            uploadInput.accept = 'application/json'
            uploadInput.style.display = 'none'
            document.body.appendChild(uploadInput)
            state.uploadInput = uploadInput
        }
    }
], `.${CLASS_NAMES.toolsContainer}`)

function setupNotesBtns() {
    const addNoteBtn = document.querySelector('.custom-add-note-btn')
    addNoteBtn.addEventListener('click', addNoteBtnHandler)

    const clearNotesBtn = document.querySelector('.custom-clear-notes-btn')
    clearNotesBtn.addEventListener('click', () => {
        if (currentSlideNotes && confirm(`Czy na pewno usunąć WSZYSTKIE (${currentSlideNotes.notes.length}) notatki ze slajdu ${currentSlideNotes.metadata.slide}?`))
            currentSlideNotes.removeAllNotes()
    })

    
    let viewNotesBtnToggle: ClassToggler
    const viewNotesBtn = document.querySelector('.custom-notes-view-btn')
    const hiddenBtnsToggle = new ClassToggler('hidden', '.custom-notes-additional-btns')

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
        currentSlideNotes.commitChanges().then(() => {
            renderNotes(currentSlideNumber)
        })
    })
    viewNotesBtnToggle = new ClassToggler('active', viewNotesBtn, t => {
        hiddenBtnsToggle.state = !t.state
        notesOverlayToggle.state = !viewTypeBtnToggle.state && t.state
        noteColumnToggle.state = !(viewTypeBtnToggle.state && t.state)
    })

    viewNotesBtnToggle.state = tools && tools.state.useNotes.value
    viewNotesBtn.addEventListener('click', () => viewNotesBtnToggle.toggle())
    registerKeyboardShortcut({
        keys: ['n'], callback: () => viewNotesBtnToggle.toggle()
    })
    viewTypeBtn.addEventListener('click', () => viewTypeBtnToggle.toggle())
    registerKeyboardShortcut({
        keys: ['v'], callback: () => viewTypeBtnToggle.toggle()
    })
}

