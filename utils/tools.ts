///<reference path="common.ts" />
///<reference path="options.ts" />
///<reference path="notes.ts" />
namespace BreakTimer {
    export let timer: NodeJS.Timeout, observer: MutationObserver
    export function start() {
        clearTimeout(timer)
       //console.log('starting suggestBreak timer...')
        timer = setTimeout(() => {
            alert('Pora na przerwę 🔔')
        }, 1000 * 60 * 7)
    }
    toRunOnLoaded.push(
        () => {
            observer = onAttributeChange(document.querySelector(SELECTORS.appDiv), 'slide', () => {
                start()
            })
            tools && !tools.state.suggestBreak.value && observer.disconnect()
        }
    )
}

let noteTarget: HTMLElement
const notesBtnsAndTags = ` 
    <div class='custom-tags-and-btns-container'>
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
        </div>
    </div>`


async function loadNotes() {
    const appDiv = document.querySelector(SELECTORS.appDiv)
    notesCollection = await Notes.Collections.Presentation.createAsync(presentationMetadata.screenID, presentationMetadata.lessonID)
    if (tools && tools.state.useNotes.value) {
        setupTagsNamesAndColors()
        const slideNumber = appDiv.attributes.getNamedItem('slide').value
        return renderNotes(parseInt(slideNumber))
    }
}
const tagColorsStyles = document.createElement('style')
document.head.append(tagColorsStyles)

async function setupTagsNamesAndColors() {
    const tags = await notesCollection.getAllTagNames()
    addTagStyle(tags)
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

    notesCollection.addEventListener('changedTags', desc => {
        if (desc.added && desc.added.length) {
            addTagStyle(desc.added)
            suggestionsContainer.append(...desc.added.map(tagToOption))
        }
        if (desc.changed && desc.changed.length) {
            desc.changed.forEach(setTagColor)
        }
    })
}

function addTagStyle(tags: Notes.RecordTypes.Tag[]) {
    tags.forEach(async (tag) => {
        const rule = await getRuleFromTag(tag)
       //console.log({ rule })
        tagColorsStyles.sheet.insertRule(rule)
    })
}

async function getRuleFromTag(tag: Notes.RecordTypes.Tag) {
    const varName = await setTagColor(tag)
    return `.custom-tag[title="${tag.name}"] { 
        background: var(${varName}-bg); 
        color: var(${varName}-color) 
    }`
}

const btnsContainerNoTags = new ClassToggler('custom-no-tags', '.custom-notes-btns-container')
const btnsContainerNoNotes = new ClassToggler('custom-no-notes', '.custom-notes-btns-container')

function getRandomTagColor(): string {
    const colors = ["#6e8898", "#606c38", "#fabc2a", "#c3423f", "#011936"]
    return getRandomElement(colors)
}

async function setTagColor(tag: Notes.RecordTypes.Tag) {
    const varName = await getTagVarName(tag)
    root.style.setProperty(`${varName}-bg`, tag.color)
    root.style.setProperty(`${varName}-color`, getForegroundColor(tag.color))
    return varName
}

async function getTagVarName(tag: Notes.RecordTypes.Tag): Promise<string> {
    const subtleCrypto = unsafeWindow.crypto.subtle
    const encoder = new TextEncoder()
    const toDigest = encoder.encode(tag.name)
    const hashBuffer = await subtleCrypto.digest('SHA-1', toDigest)
    const hashArray = new Uint8Array(hashBuffer) as Uint8Array & number[]
    const hash = hashArray.map(v => v.toString(16).padStart(2, '0')).slice(0, 15).join('')
    return `--custom-tag-${hash}`
}

function renderNotes(slideNumber: number): Promise<HTMLDivElement[]> {
    if (currentSlideNotes) {
        currentSlideNotes.commitChanges()
        const removedListener = currentSlideNotes.removeEventListener('change', slideNotesChanged)
       //console.log({ removedListener })
    }
    if (tools && tools.state.useNotes.value && notesCollection) {
        if (noteTarget) noteTarget.innerHTML = ''
        const currentSlide = document.querySelector(SELECTORS.currentSlideContainer)
        const notesOverlayElem = currentSlide.querySelector('.custom-notes-overlay')
        return notesCollection.getNotesBySlide(slideNumber).then(notes => {
            currentSlideNotes = notes
            renderTags()
            btnsContainerNoNotes.state = !notes.notes.length
            if (!noteTarget && notesOverlayElem) return notes.notes.map(n => n.element)
           //console.log({ currentSlideNotes })
            currentSlideNotes.addEventListener('change', slideNotesChanged)
            return addNoteElems(notes.notes)
        })
    }
}

function renderTags() {
    const tagContainer = document.querySelector('.custom-tags-container') as HTMLElement
    const toRemove = Array.from(tagContainer.children)
    toRemove.pop()
    toRemove.forEach(el => el.remove())
    const tags = currentSlideNotes.tags
    if (tags.length) {
        tags.forEach(tag => {
            tag.render(tagContainer)
            tag.addEventListener('colorChange', ({ newColor }) => {
                setTagColor({ color: newColor, name: tag.content })
            })
        })
    }
    btnsContainerNoTags.state = !tags.length
}

function slideNotesChanged(change: Notes.Events.Slide['change']) {
    if (change.added) {
        const regular = change.added.filter(note => note instanceof Notes.RegularNote) as Notes.RegularNote[]
        if (regular.length) addNoteElems(regular)
        const tags = change.added.filter(note => note instanceof Notes.TagNote) as Notes.TagNote[]
        btnsContainerNoTags.state &&= !tags.length
        const tagContainer = document.querySelector('.custom-tags-container') as HTMLElement
        tags.forEach(tag => {
            const tagElem = tag.render(tagContainer)
            tagElem.click()
        })
    }
    if (change.deleted && !currentSlideNotes.notes.length) {
        btnsContainerNoNotes.state = true
    }
}

function addNoteElems(notes: Notes.RegularNote[]): HTMLDivElement[] {
    if (!notes.length) return
    btnsContainerNoNotes.state = false
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
            if (contextElem) setupContextElem(contextElem, note)
        }
        return noteElem
    })
}

const addNoteBtnHandler = (event: MouseEvent) => {
    if (currentSlideNotes) {
        const slide = document.querySelector(SELECTORS.currentSlideContainer) as HTMLElement
        slide.style.cursor = `copy`
        const newNote = currentSlideNotes.addNote({
            content: '', position: { x: 0, y: 1 },
            presentationTitle: presentationMetadata.name,
            slideTitle: presentationMetadata.currentSlideTitle,
            type: 'regular'
        })
        newNote.startFollowingMouse({ x: 0, y: 10 })
        slide.addEventListener('click', event => {
            event.preventDefault()
            event.stopImmediatePropagation()
            newNote.endFollowingMouse()
            slide.style.cursor = ''
            const contextElem = event.target as HTMLElement
            setupContextElem(contextElem, newNote)
            const textContext = contextElem.innerText
            newNote.metadata.textContext = textContext
            newNote.element.click()
        }, { once: true })
    }
}

function setupContextElem(contextElem: HTMLElement, note: Notes.RegularNote) {
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
           //console.log('update suggestBreak', { state, obs: BreakTimer.observer })
            if (!BreakTimer.observer) return
            if (state.value) {
                BreakTimer.observer.observe(document.querySelector(SELECTORS.appDiv), { attributes: true })
                BreakTimer.start()
            } else {
                BreakTimer.observer.disconnect()
                if (BreakTimer.timer) clearTimeout(BreakTimer.timer)
            }
        }
    },
    {
        name: "useNotes",
        desc: state => `${getCheckboxEmoji(state.value)}📝 Używaj notatek i tagów`,
        defaultValue: false,
        callback: function (state) {
            return { value: !state.value }
        },
        update: state => {
            toggleBodyClass('custom-script-use-notes', state.value)
            if (presentationMetadata.screenID && state.value && !notesCollection) {
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
               //console.log({ notes })
                downloadFile('application/json', `${presentationMetadata.name}-notes.json`, JSON.stringify(notes))
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
               //console.log({ ev })
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
        if (currentSlideNotes && confirm(`Czy na pewno usunąć WSZYSTKIE (${currentSlideNotes.notes.length}) notatki ze slajdu ${currentSlideNotes.metadata.slide}?`))
            currentSlideNotes.removeAllNotes()
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
        currentSlideNotes.commitChanges().then(() => {
            renderNotes(presentationMetadata.currentSlideNumber)
        })
    })
    viewNotesBtnToggle = new ClassToggler('active', viewNotesBtn, t => {
        hiddenBtnsToggle.state = !t.state
        notesOverlayToggle.state = !viewTypeBtnToggle.state && t.state
        noteColumnToggle.state = !(viewTypeBtnToggle.state && t.state)
    })

    const addNoteBtn = document.querySelector('.custom-add-note-btn')
    addNoteBtn.addEventListener('click', (ev: MouseEvent) => {
        addBtnToggle.state = false
        viewNotesBtnToggle.state = true
        addNoteBtnHandler(ev)
    })

    viewNotesBtnToggle.state = tools && tools.state.useNotes.value
    viewNotesBtn.addEventListener('click', () => viewNotesBtnToggle.toggle())
    Keyboard.registerShortcut({
        keys: ['n'], callback: () => viewNotesBtnToggle.toggle()
    })
    viewTypeBtn.addEventListener('click', () => viewTypeBtnToggle.toggle())
    Keyboard.registerShortcut({
        keys: ['v'], callback: () => viewTypeBtnToggle.toggle()
    })
}

function addTag() {
    currentSlideNotes.addTag({
        content: '', color: getRandomTagColor(),
        presentationTitle: presentationMetadata.name,
        slideTitle: presentationMetadata.currentSlideTitle
    })
}

