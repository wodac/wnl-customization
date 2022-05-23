class Note {
    private _deleted: boolean

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

    remove() {
        this.parent.removeNoteById(this.metadata.id)
        this._deleted = true
    }

    set content(value: string) {
        if (this._deleted) throw new NoteDeletedError()
        this._content = value
        this.parent.saveNote(this)
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
        public readonly screenid: number
    ) { }
}

class NoteMetadata extends SlideMetadata {
    constructor(
        public readonly id: string,
        slideMetadata: SlideMetadata,
        public readonly position: Position) {
        super(slideMetadata.slide, slideMetadata.screenid)
    }
}

class SlideNotesCollection {
    private _notes: Note[]
    private _changedNotes: Note[]
    private _deletedNotes: Note[]

    constructor(
        public readonly metadata: SlideMetadata,
        private _notesRaw: NotesStoreRecord[],
        public readonly parent: PresentationNotesCollection
    ) {
        this._notes = _notesRaw.map(record => {
            return new Note(
                new NoteMetadata(record.id, this.metadata, record.position),
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

    getNoteByPosition(position: Position): Note {
        return this._notes.find(note => note.metadata.position === position)
    }

    getNoteById(id: string): Note {
        return this._notes.find(note => note.metadata.id === id)
    }

    addNote(position: Position, content: string): Note {
        const id = generateId()
        const note = new Note(new NoteMetadata(id, this.metadata, position), content, this)
        this._notes.push(note)
        this._changedNotes.push(note)
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
        return deleted
    }

    removeNoteById(id: string): Note {
        return this.removeNoteByQuery(note => note.metadata.id === id)
    }

    saveNote(note: Note) {
        const index = this._changedNotes.findIndex(note => note.metadata.id === note.metadata.id)
        if (index >= 0) this._changedNotes[index] = note
        else this._changedNotes.push(note)
    }

    async commitChanges() {
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

function getNotesDatabase(setupCb: (db: IDBDatabase) => IDBObjectStore) {
    return new Promise<IDBDatabase>((resolve, reject) => {
        var request = indexedDB.open("NotesDatabase");
        request.addEventListener('error', ev => {
            reject('Unable to open database')
        })
        request.addEventListener('upgradeneeded', function (ev) {
            const db = this.result
            const store = setupCb(db)
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
}

class PresentationNotesCollection {
    private static readonly STORE_NAME = 'Notes'

    private static readonly STORE_INDEX = 'byScreenIdAndSlide'

    private static setupDB(db: IDBDatabase) {
        const notesStore = db.createObjectStore(PresentationNotesCollection.STORE_NAME, { keyPath: 'id' })
        notesStore.createIndex(PresentationNotesCollection.STORE_INDEX, ['screenid', 'slide'], { unique: false })
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
        const screenidIndex = notesStore.index(PresentationNotesCollection.STORE_INDEX)
        const notesRequest = screenidIndex.getAll([this._screenid, slide])
        return new Promise((resolve, reject) => {
            notesRequest.addEventListener('success', ev => {
                const notes: NotesStoreRecord[] = notesRequest.result
                resolve(new SlideNotesCollection(
                    new SlideMetadata(slide, this._screenid),
                    notes, this
                ))
            })
        })
    }

    private mapNoteToRecord(note: Note): NotesStoreRecord {
        return {
            content: note.content,
            id: note.metadata.id,
            screenid: note.metadata.screenid,
            slide: note.metadata.slide,
            position: note.metadata.position
        }
    }

    saveNotes(notes: Note[]) {
        const transaction = this.db.transaction(PresentationNotesCollection.STORE_NAME, 'readwrite')
        const notesStore = transaction.objectStore(PresentationNotesCollection.STORE_NAME)
        notes.map(this.mapNoteToRecord).forEach(record => {
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
            notesStore.delete(note.metadata.id)
        })
        transaction.commit()
        return new Promise<void>((resolve, reject) => {
            transaction.addEventListener('complete', ev => {
                resolve()
            })
        })
    }
}

// PresentationNotesCollection.createAsync(892).then(collection => console.log(collection))