class Note {
    private _deleted: boolean
    public onchange: (this: Note, newContent: string) => any
    public onremove: (this: Note) => any
    private static HTML = `
        <div class="custom-note-content"></div>
        <form> 
            <textarea></textarea> 
        </form>
        <a class="custom-note-remove">${svgIcons.trash}</a>
        <a class="custom-note-move">${svgIcons.move}</a>`
    private _element: HTMLDivElement
    private parentElement: HTMLElement

    constructor(
        public readonly metadata: NoteMetadata,
        private _content: string,
        public readonly parent: SlideNotesCollection
    ) {
        this._deleted = false
    }

    get content(): string {
        return this._content
    }

    get element(): HTMLDivElement {
        return this._element
    }

    remove(removeFromParent = true) {
        console.log('deleting', { note: this, removeFromParent }, 'from Note')
        if (removeFromParent) this.parent.removeNoteById(this.metadata.id)
        if (this._element) this._element.remove()
        this._element = null
        this._deleted = true
    }

    set content(value: string) {
        if (this._deleted) throw new NoteDeletedError()
        this._content = value
        if (this.element) this.contentElement.innerHTML = value.replace(/\n/g, '<br />')
        if (this.onchange) this.onchange.apply(this, [value])
        this.parent.saveNote(this)
    }

    private setNotePosition(pos: Position) {
        this._element.style.top = `${Math.round(pos.y * 100)}%`
        this._element.style.left = `${Math.round(pos.x * 100)}%`
    }

    render(parent?: HTMLElement): HTMLDivElement {
        this.parentElement = parent
        this._element = document.createElement('div')
        this.setNotePosition(this.metadata.position)
        this._element.dataset.id = this.metadata.id
        this._element.classList.add('custom-note')
        this._element.innerHTML = Note.HTML
        const noteContentElem = this.contentElement
        const noteRemoveIcon = this._element.querySelector('.custom-note-remove') as HTMLAnchorElement
        noteContentElem.innerHTML = this.content.replace(/\n/g, '<br />')
        this.setupEditing()
        this.setupMoving()
        noteRemoveIcon.addEventListener('click', ev => {
            ev.stopPropagation()
            if (confirm(`Usunąć notatkę o treści "${this.content}" ze slajdu ${this.metadata.slide}?`)) {
                this.remove()
            }
        })
        parent && parent.appendChild(this._element)
        return this._element
    }

    get contentElement() {
        return this._element && this._element.querySelector('div.custom-note-content') as HTMLDivElement
    }

    private setupEditing() {
        const noteContentInput = this._element.querySelector('textarea')
        noteContentInput.value = this.content
        noteContentInput.addEventListener('blur', ev => {
            this._element.classList.remove('editing')
        })
        noteContentInput.addEventListener('keyup', ev => {
            if (ev.key === 'Enter' && !ev.shiftKey && !ev.altKey) {
                this._element.classList.remove('editing')
            }
        })
        noteContentInput.addEventListener('input', ev => {
            ev.stopPropagation()
            const content = noteContentInput.value
            console.log('note content changed', { content })
            this.content = content
        })
        this._element.addEventListener('click', ev => {
            this._element.classList.add('editing')
            noteContentInput.focus()
        })
    }

    private setupMoving() {
        const noteMoveIcon = this._element.querySelector('.custom-note-move') as HTMLAnchorElement
        noteMoveIcon.addEventListener('mousedown', ev => {
            if (!this.parentElement)
                return
            ev.stopPropagation()
            const parentRect = this.parentElement.getBoundingClientRect()
            let lastMousePosition: Position = { x: ev.clientX, y: ev.clientY }
            const followMouse = (ev: MouseEvent) => {
                ev.preventDefault()
                let offset: Position = {
                    x: lastMousePosition.x - ev.clientX,
                    y: lastMousePosition.y - ev.clientY
                }
                lastMousePosition = { x: ev.clientX, y: ev.clientY }
                this._element.style.top = (this._element.offsetTop - offset.y) + 'px'
                this._element.style.left = (this._element.offsetLeft - offset.x) + 'px'

                const position: Position = {
                    x: (ev.x - parentRect.x) / parentRect.width,
                    y: (ev.y - parentRect.y) / parentRect.height
                }
                this.metadata.position = position
                this.setNotePosition(position)
            }
            const endFollowing = ev => {
                document.removeEventListener('mousemove', followMouse)
                document.removeEventListener('mouseup', endFollowing)
                this.parent.saveNote(this)
            }
            document.addEventListener('mousemove', followMouse)
            document.addEventListener('mouseup', endFollowing)
        })
    }
}

class NoteDeletedError extends Error {
    constructor() {
        super('Cannot modify deleted note!')
    }
}

class SlideMetadata {
    constructor(
        public readonly slide: number,
        public readonly screenid: number,
        public slideTitle: string,
        public presentationTitle: string
    ) { }
}

class NoteMetadata extends SlideMetadata {
    constructor(
        public readonly id: string,
        slideMetadata: SlideMetadata,
        public position: Position,
        public textContext: string) {
        super(slideMetadata.slide, slideMetadata.screenid, slideMetadata.slideTitle, slideMetadata.presentationTitle)
    }
}

type SlideNotesChange = {
    added?: Note[]
    changed?: Note[]
    deleted?: Note[]
}

type NewNoteOptions = {
    position: Position
    content: string
    textContext: string
    slideTitle?: string
    presentationTitle?: string
}

class SlideNotesCollection {
    private _notes: Note[]
    private _changedNotes: Note[]
    private _deletedNotes: Note[]
    public onchange: (this: SlideNotesCollection, change: SlideNotesChange) => any
    public oncommit: (this: SlideNotesCollection) => any

    constructor(
        public readonly metadata: SlideMetadata,
        private _notesRaw: NotesStoreRecord[],
        public readonly parent: PresentationNotesCollection
    ) {
        this._notes = _notesRaw.map(record => {
            return new Note(
                new NoteMetadata(record.id, this.metadata, record.position, record.textContext),
                record.content,
                this
            )
        })
        this._changedNotes = []
        this._deletedNotes = []
    }

    get notes() {
        return this._notes
    }

    get isSaved() {
        return (this._changedNotes.length + this._deletedNotes.length) === 0
    }

    getNoteByPosition(position: Position): Note {
        return this._notes.find(note => note.metadata.position === position)
    }

    getNoteById(id: string): Note {
        return this._notes.find(note => note.metadata.id === id)
    }

    addNote({ position, content, textContext, presentationTitle, slideTitle }: NewNoteOptions): Note {
        if (presentationTitle) this.metadata.presentationTitle = presentationTitle
        if (slideTitle) this.metadata.slideTitle = slideTitle
        const id = generateId()
        const note = new Note(new NoteMetadata(id, this.metadata, position, textContext), content, this)
        this._notes.push(note)
        this._changedNotes.push(note)
        if (this.onchange) this.onchange.apply(this, [{ added: [note] }])
        return note
    }

    removeNoteByContext(position: Position): Note {
        return this.removeNoteByQuery(note => note.metadata.position === position)
    }

    private removeNoteByQuery(query: { (value: Note, index: number, obj: Note[]): boolean }): Note {
        let deleted: Note
        const indexInNotes = this._notes.findIndex(query)
        const indexInChangedNotes = this._changedNotes.findIndex(query)
        if (indexInNotes >= 0) {
            deleted = this._notes.splice(indexInNotes, 1)[0]
            this._deletedNotes.push(deleted)
        }
        if (indexInChangedNotes >= 0) deleted = this._changedNotes.splice(indexInChangedNotes, 1)[0]
        deleted.remove(false)
        if (this.onchange) this.onchange.apply(this, [{ deleted: [deleted] }])
        console.log('deleting', { deleted }, 'from SlideNotesCollection')
        return deleted
    }

    removeAllNotes() {
        const toDelete = this._notes.concat(this._changedNotes)
        this._changedNotes = this._notes = []
        if (this.onchange) this.onchange.apply(this, [{ deleted: toDelete }])
        this._deletedNotes.push(...toDelete)
        toDelete.forEach(note => {
            note.remove(false)
        })
        return toDelete
    }

    removeNoteById(id: string): Note {
        return this.removeNoteByQuery(note => note.metadata.id === id)
    }

    saveNote(note: Note) {
        if (!this._changedNotes.includes(note)) this._changedNotes.push(note)
        if (this.onchange) this.onchange.apply(this, [{ changed: [note] }])
    }

    async commitChanges() {
        if (this.oncommit) this.oncommit.apply(this)
        await this.parent.removeNotes(this._deletedNotes)
        this._deletedNotes = []
        await this.parent.saveNotes(this._changedNotes)
        this._changedNotes = []
    }
}

function generateId(): string {
    const r = Math.random()
    let id = btoa((r * Date.now() + r).toLocaleString())
    return id
}

function getNotesDatabase(setupCb: (ev: IDBVersionChangeEvent, db: IDBDatabase) => IDBObjectStore) {
    return new Promise<IDBDatabase>((resolve, reject) => {
        var request = indexedDB.open("NotesDatabase", 2);
        request.addEventListener('error', ev => {
            reject('Unable to open database')
        })
        request.addEventListener('upgradeneeded', function (ev) {
            const db = this.result
            const store = setupCb(ev, db)
            store.transaction.addEventListener('complete', function () {
                resolve(db)
            })
        })
        request.addEventListener('success', function () {
            const db = this.result
            db.onerror = event => {
                console.error("Database error: " + (event.target as any).errorCode);
            }
            resolve(db)
        })
    })
}

type Position = {
    x: number
    y: number
}

interface NotesStoreRecord {
    screenid: number
    slide: number
    id: string
    position: Position
    content: string
    textContext: string
    presentationTitle: string
    slideTitle: string
}

class PresentationNotesCollection {
    private static readonly STORE_NAME = 'Notes'

    private static readonly DUAL_INDEX = 'byScreenIDAndSlide'
    private static readonly SCREENID_INDEX = 'byScreenID'

    private static setupDB(event: IDBVersionChangeEvent, db: IDBDatabase) {
        let notesStore: IDBObjectStore
        if (event.oldVersion !== event.newVersion) {
            notesStore = db.createObjectStore(PresentationNotesCollection.STORE_NAME, { keyPath: 'id' })
        } else {
            notesStore = ((event.target as any).transaction as IDBTransaction).objectStore(PresentationNotesCollection.STORE_NAME)
        }
        notesStore.createIndex(PresentationNotesCollection.DUAL_INDEX, ['screenid', 'slide'], { unique: false })
        notesStore.createIndex(PresentationNotesCollection.SCREENID_INDEX, 'screenid', { unique: false })
        // notesStore.createIndex('id', 'id', { unique: true })
        return notesStore
    }

    static async createAsync(screenid: number) {
        const db = await getNotesDatabase(PresentationNotesCollection.setupDB)
        const notesCollection = new PresentationNotesCollection(db, screenid)
        return notesCollection
    }

    constructor(private readonly db: IDBDatabase, private readonly _screenid: number) {
    }

    getNotesBySlide(slide: number): Promise<SlideNotesCollection> {
        const transaction = this.db.transaction(PresentationNotesCollection.STORE_NAME, 'readonly')
        const notesStore = transaction.objectStore(PresentationNotesCollection.STORE_NAME)
        const screenidIndex = notesStore.index(PresentationNotesCollection.DUAL_INDEX)
        const notesRequest = screenidIndex.getAll([this._screenid, slide])
        return new Promise((resolve, reject) => {
            notesRequest.addEventListener('success', ev => {
                const notes: NotesStoreRecord[] = notesRequest.result
                const slideTitle = notes[0] && notes[0].slideTitle || ''
                const presentationTitle = notes[0] && notes[0].presentationTitle || ''
                resolve(new SlideNotesCollection(
                    new SlideMetadata(slide, this._screenid, slideTitle, presentationTitle),
                    notes, this
                ))
            })
        })
    }

    static mapNoteToRecord(note: Note): NotesStoreRecord {
        return {
            content: note.content,
            id: note.metadata.id,
            screenid: note.metadata.screenid,
            slide: note.metadata.slide,
            position: note.metadata.position,
            presentationTitle: note.metadata.presentationTitle,
            slideTitle: note.metadata.slideTitle,
            textContext: note.metadata.textContext
        }
    }

    saveNotes(notes: Note[]) {
        const records = notes.map(PresentationNotesCollection.mapNoteToRecord)
        return this.importNotes(records)
    }

    importNotes(notes: NotesStoreRecord[]) {
        console.log('to import:', {notes})
        const transaction = this.db.transaction(PresentationNotesCollection.STORE_NAME, 'readwrite')
        const notesStore = transaction.objectStore(PresentationNotesCollection.STORE_NAME)
        notes.forEach(record => {
            notesStore.put(record)
        })
        transaction.commit()
        return new Promise<void>((resolve, reject) => {
            transaction.addEventListener('complete', ev => {
                resolve()
            })
        })
    }

    removeNotes(notes: Note[]) {
        const transaction = this.db.transaction(PresentationNotesCollection.STORE_NAME, 'readwrite')
        const notesStore = transaction.objectStore(PresentationNotesCollection.STORE_NAME)
        notes.forEach(note => {
            console.log('deleting', { note }, 'from PresentationNotesCollection')
            notesStore.delete(note.metadata.id)
        })
        transaction.commit()
        return new Promise<void>((resolve, reject) => {
            transaction.addEventListener('complete', ev => {
                resolve()
            })
        })
    }

    exportNotes() {
        const transaction = this.db.transaction(PresentationNotesCollection.STORE_NAME, 'readonly')
        const notesStore = transaction.objectStore(PresentationNotesCollection.STORE_NAME)   
        const screenidIndex = notesStore.index(PresentationNotesCollection.SCREENID_INDEX)
        const notesRequest = screenidIndex.getAll(this._screenid)
        return new Promise<NotesStoreRecord[]>((resolve, reject) => {
            notesRequest.addEventListener('success', ev => {
                const notes: NotesStoreRecord[] = notesRequest.result
                resolve(notes)
            })
        })   
    }
}

// PresentationNotesCollection.createAsync(892).then(collection => console.log(collection))