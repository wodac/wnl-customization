///<reference path="common.ts" />
///<reference path="Notes.ts" />
///<reference path="BreakTimer.ts" />
let noteTarget: HTMLElement

const tagContainerHTML = `
        <div class='custom-tags-container'> 
            <a class='custom-new-tag custom-tag'>${SVGIcons.plusCircle}</a>  
        </div>`
const notesBtnsHTML = `
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
    el.innerHTML = tagContainerHTML + notesBtnsHTML
    el.className = 'custom-tags-and-btns-container'
    slideshowContainer.append(el)
}

class NotesRendering {
    btnsContainerNoNotes: ClassToggler
    btnsContainerNoTags: ClassToggler

    constructor(private app: App) {
        this.btnsContainerNoTags = new ClassToggler('custom-no-tags', '.custom-notes-btns-container')
        this.btnsContainerNoNotes = new ClassToggler('custom-no-notes', '.custom-notes-btns-container')
    }
    async loadNotes() {
        const presentationMetadata = this.app.presentationMetadata
        this.app.notesCollection = await Notes.Collections.Presentation.createAsync(presentationMetadata.screenID, presentationMetadata.lessonID)
        this.setupTagList()
        return this.renderNotes(this.app.slideNumber)
    }

    async setupTagList() {
        const tags = await this.app.notesCollection.getAllTagNames()
        this.app.addTagListContainer()
        const tagToOption = (tag: Notes.RecordTypes.Tag): HTMLOptionElement => {
            const opt = document.createElement('option')
            opt.value = tag.name
            opt.style.background = tag.color
            opt.innerHTML = tag.name
            return opt
        }
        const tagToTagListElem = (tag: Notes.RecordTypes.Tag) => {
            const el = document.createElement('a')
            el.className = 'custom-tag'
            el.innerText = tag.name
            el.style.background = tag.color
            el.style.color = getForegroundColor(tag.color)
            el.addEventListener('click', ev => {
                ev.preventDefault()
                this.app.searchInBottomContainer.performSearch(`"${tag.name}"`)
            })
            return el
        }
        const suggestions = tags.map(tagToOption)
        const tagListElems = tags.map(tagToTagListElem)
        const suggestionsContainer = document.createElement('datalist')
        const tagListContainer = document.querySelector(`.${CLASS_NAMES.tagListContainer}`)
        suggestionsContainer.id = 'custom-tags-list'
        suggestionsContainer.append(...suggestions)
        tagListContainer.append(...tagListElems)
        document.body.append(suggestionsContainer)

        this.app.notesCollection.addEventListener('changedTags', desc => {
            if (desc.added && desc.added.length) {
                suggestionsContainer.append(...desc.added.map(tagToOption))
                tagListContainer.append(...desc.added.map(tagToTagListElem))
            }
        })
    }

    getRandomTagColor(): string {
        const colors = ["#6e8898", "#606c38", "#fabc2a", "#c3423f", "#011936"]
        return getRandomElement(colors) as string
    }

    async renderNotes(slideNumber: number): Promise<HTMLDivElement[] | void> {
        if (this.app.currentSlideNotes) {
            this.app.currentSlideNotes.commitChanges()
            this.app.currentSlideNotes.removeEventListener('change', this.notesChangedListener)
        }
        if (this.app.tools && this.app.tools.getValue('useNotes') && this.app.notesCollection) {
            if (noteTarget) noteTarget.innerHTML = ''
            const currentSlide = document.querySelector(SELECTORS.currentSlideContainer)
            if (!currentSlide) return
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
        if (!tagContainer) return
        const toRemove = Array.from(tagContainer.children)
        toRemove.pop()
        toRemove.forEach(el => el.remove())
        const tags = this.app.currentSlideNotes.tags
        if (tags.length) {
            tags.forEach(tag => {
                tag.render(tagContainer)
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

    addNoteElems(notes: Notes.RegularNote[]): HTMLDivElement[] | undefined {
        if (!notes.length) return
        this.btnsContainerNoNotes.state = false
        let parent: HTMLElement
        const currentSlide = document.querySelector(SELECTORS.currentSlideContainer)
        if (!currentSlide) return
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
        const numberContainer = document.querySelector('.order-number-container')
        if (!numberContainer) return
        numberContainer.after(notesContainer)
        return notesContainer
    }
}