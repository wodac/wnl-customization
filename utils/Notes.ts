///<reference path="common.ts" />
namespace Notes {
    export namespace Events {
        export type Note = {
            change: {
                newContent: string
            }
            rendered: {}
            edited: {
                newContent: string
            }
            remove: {}
            colorChange: {
                newColor: string
            }
        }
    }
    export abstract class Note extends CustomEventEmmiter<Events.Note> {
        protected _deleted: boolean
        protected _edited: boolean = false
        protected _editing: boolean = false
        protected _lastValue: string
        protected _element: HTMLDivElement
        abstract get contentElement(): HTMLDivElement
        abstract render(): HTMLDivElement

        constructor(
            public readonly metadata: NoteMetadata,
            private _content: string,
            public readonly parent: Collections.Slide
        ) {
            super()
            this._deleted = false
        }

        get content(): string {
            return this._content
        }

        get element(): HTMLDivElement {
            return this._element
        }

        remove(removeFromParent = true) {
            if (this._deleted) return
            this._deleted = true
            //console.log('deleting', { note: this, removeFromParent }, 'from Note')
            this.trigger('remove')
            if (this._element) this._element.remove()
            if (removeFromParent) this.parent.removeNoteById(this.metadata.id)
            this._element = null
            this.removeAllListeners()
        }

        set content(value: string) {
            if (this._deleted) throw new NoteDeletedError()
            this._content = value
            if (this.contentElement) this.contentElement.innerHTML = value.replace(/\n/g, '<br />')
            this.trigger('change', { newContent: value })
            this.parent.saveNote(this)
        }

        protected setupEditing(noteContentInput: HTMLInputElement | HTMLTextAreaElement) {
            noteContentInput.value = this.content
            noteContentInput.addEventListener('blur', ev => {
                this.endEditing()
            })
            noteContentInput.addEventListener('keyup', (ev: KeyboardEvent) => {
                if (ev.key === 'Enter' && !ev.shiftKey && !ev.altKey) {
                    ev.stopImmediatePropagation()
                    ev.preventDefault()
                    this.endEditing()
                }
            })
            noteContentInput.addEventListener('input', ev => {
                ev.stopPropagation()
                const content = noteContentInput.value
                //console.log('note content changed', { content })
                this.content = content
            })
            const form = this._element.querySelector('form')
            form && form.addEventListener('submit', ev => {
                ev.preventDefault()
                this.endEditing()
            })
            this._element.addEventListener('click', ev => this.startEditing(noteContentInput))
            // this._element.addEventListener('focus', ev => this.startEditing(noteContentInput))
        }

        private startEditing(noteContentInput: HTMLInputElement | HTMLTextAreaElement) {
            this._editing = true
            this._lastValue = this._content
            this._element.classList.add('editing')
            noteContentInput.focus()
        }

        private endEditing() {
            if (this._editing) {
                this._editing = false
                this._element.classList.remove('editing')
                if (this._lastValue !== this.content) this.trigger('edited', { newContent: this.content })
                if (!this._content.trim().length) {
                    if (this._edited) this.remove()
                    else this._edited = true
                    return
                }
            }
        }
    }

    export class TagNote extends Note {
        private colorInput: HTMLInputElement
        static from(note: Note) {
            return new TagNote(note.metadata, note.content, note.parent)
        }

        protected _edited: boolean = true

        private static HTML = `
    <span class='custom-tag-content'></span>
    <form>
        <input type='text' list='custom-tags-list' />
        <input type='color' />
    </form>
    <a class='custom-change-color' title='Zmień kolor'>${SVGIcons.pallete}</a>
    <a class='custom-remove' title='Usuń'>${SVGIcons.removeCircle}</a>
    `

        get contentElement(): HTMLDivElement {
            return this._element && this._element.querySelector('.custom-tag-content')
        }

        render(parent?: HTMLElement): HTMLDivElement {
            this._element = document.createElement('div')
            this._element.innerHTML = TagNote.HTML
            this._element.classList.add('custom-tag')
            this._element.title = this.content
            this._element.tabIndex = 0

            const removeBtn = this._element.querySelector('.custom-remove') as HTMLElement
            const colorBtn = this._element.querySelector('.custom-change-color') as HTMLElement
            this.colorInput = this._element.querySelector('input[type=color]') as HTMLInputElement
            this.setColor(this.metadata.color)

            this.contentElement.innerText = this.content
            this.setupEditing(this._element.querySelector('input'))

            colorBtn.addEventListener('click', (ev) => {
                ev.stopImmediatePropagation()
                this.colorInput.click()
            })
            this.colorInput.addEventListener('change', () => {
                this.metadata.color = this.colorInput.value
                this.trigger('colorChange', { newColor: this.metadata.color })
                this.parent.saveNote(this)
                this.setColor(this.metadata.color)
            })

            removeBtn.addEventListener('click', event => {
                event.preventDefault()
                event.stopPropagation()
                this.remove()
            })

            this._element.title = this.content
            this.addEventListener('edited', ({ newContent }) => {
                this._element.title = newContent
                this.setColorFromTagName()
            })
            if (parent) parent.prepend(this._element)
            this.trigger('rendered')
            return this._element
        }

        private setColorFromTagName() {
            const tagColors = this.parent.parent.tags
            console.log({tagColors})
            let color = this.metadata.color
            if (tagColors.length && this.content) {
                const tagRecord = tagColors.find(tag => tag.name === this.content)
                if (tagRecord)
                    color = tagRecord.color
            }
            this.metadata.color = color
            this.setColor(color)
        }

        private setColor(color: string) {
            this._element.style.background = color
            this._element.style.color = getForegroundColor(color)
            this.colorInput.value = color
        }
    }

    export class RegularNote extends Note {
        private parentElement: HTMLElement
        isMoving: boolean
        private parentRect: DOMRect
        private followingOffset: Position
        private _followingCb: { (this: Document, ev: MouseEvent): void }
        private _endFollowingCb: { (): void }

        static from(note: Note) {
            return new RegularNote(note.metadata, note.content, note.parent)
        }

        static normalizeFractionalPosition(pos: Position): Position {
            if (pos.x < 0) pos.x = 0
            if (pos.y < 0) pos.y = 0
            if (pos.x > 1) pos.x = 1
            if (pos.y > 1) pos.y = 1
            return pos
        }

        private static HTML = `
        <div class="custom-note-content"></div>
        <form> 
            <textarea></textarea> 
        </form>
        <a class="custom-note-remove">${SVGIcons.trash}</a>
        <a class="custom-note-move">${SVGIcons.move}</a>`

        private setNotePosition(pos: Position) {
            if (!pos) pos = { x: 0, y: 0 }
            pos = RegularNote.normalizeFractionalPosition(pos)
            this._element.style.top = `${Math.round(pos.y * 100)}%`
            this._element.style.left = `${Math.round(pos.x * 100)}%`
        }

        render(parent?: HTMLElement): HTMLDivElement {
            this.parentElement = parent
            this._element = document.createElement('div')
            this.setNotePosition(this.metadata.position)
            this._element.dataset.id = this.metadata.id
            this._element.classList.add('custom-note')
            this._element.innerHTML = RegularNote.HTML
            const input = this._element.querySelector('textarea')
            const noteContentElem = this.contentElement
            const noteRemoveIcon = this._element.querySelector('.custom-note-remove') as HTMLAnchorElement
            noteContentElem.innerHTML = this.content.replace(/\n/g, '<br />')
            this.setupEditing(input)
            this.setupMoving()
            noteRemoveIcon.addEventListener('click', ev => {
                ev.stopPropagation()
                this.remove()
            })
            parent && parent.appendChild(this._element)
            return this._element
        }

        get contentElement() {
            return this._element && this._element.querySelector('div.custom-note-content') as HTMLDivElement
        }

        private setupMoving() {
            const noteMoveIcon = this._element.querySelector('.custom-note-move') as HTMLAnchorElement
            noteMoveIcon.addEventListener('mousedown', (ev: MouseEvent) => {
                ev.stopPropagation()
                const offset: Position = {
                    x: - noteMoveIcon.offsetLeft,
                    y: - noteMoveIcon.offsetTop,
                }
                this.startFollowingMouse(offset)
                this._endFollowingCb = () => this.endFollowingMouse()
                document.addEventListener('mouseup', this._endFollowingCb)
            })
        }

        public endFollowingMouse() {
            document.removeEventListener('mousemove', this._followingCb)
            document.removeEventListener('mouseup', this._endFollowingCb)
            this.isMoving = false
            this.parent.saveNote(this)
        }

        public startFollowingMouse(followingOffset: Position = { x: 0, y: 0 }) {
            this.followingOffset = followingOffset
            if (!this.parentElement)
                return

            this.isMoving = true
            // this.lastMousePosition = { x: position.x - 10, y: position.y - 10 }  //offset      
            this.parentRect = this.parentElement.getBoundingClientRect()
            this._followingCb = (ev: MouseEvent) => this.followMouse(ev)
            document.addEventListener('mousemove', this._followingCb)
        }

        private followMouse(ev: MouseEvent) {
            ev.preventDefault()

            const position: Position = {
                x: (ev.x + this.followingOffset.x - this.parentRect.x) / this.parentRect.width,
                y: (ev.y + this.followingOffset.y - this.parentRect.y) / this.parentRect.height
            }
            this.metadata.position = position
            this.setNotePosition(position)
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
            public presentationTitle: string,
            public readonly lessonID: number
        ) { }
    }

    export enum NoteType {
        Regular = 'regular',
        Tag = 'tag'
    }

    class NoteMetadata extends SlideMetadata {
        constructor(
            public readonly id: string,
            public readonly type: NoteType,
            slideMetadata: SlideMetadata,
            public position?: Position,
            public textContext?: string,
            public color: string = '#95b9f9') {
            super(slideMetadata.slide, slideMetadata.screenid, slideMetadata.slideTitle, slideMetadata.presentationTitle, slideMetadata.lessonID)
        }
    }

    type NewNoteOptions = Partial<RecordTypes.Note>

    export namespace Events {
        export type Slide = {
            change: {
                added?: Notes.Note[]
                changed?: Notes.Note[]
                deleted?: Notes.Note[]
            }
            commit: {}
        }
    }

    export namespace Collections {

        export class Slide extends CustomEventEmmiter<Events.Slide> {
            private _notes: Note[]
            private _changedNotes: Note[]
            private _deletedNotes: Note[]

            constructor(
                public readonly metadata: SlideMetadata,
                private _notesRaw: RecordTypes.Note[],
                public readonly parent: Presentation
            ) {
                super()
                this._notes = []
                _notesRaw.forEach(record => {
                    let note: Note
                    if (record.type !== 'tag') {
                        note = new RegularNote(
                            new NoteMetadata(record.id, record.type, this.metadata, record.position, record.textContext),
                            record.content,
                            this
                        )
                    } else {
                        const tagColors = this.parent.tags
                        const tagRecord = tagColors.find(tag => tag.name === record.content)
                        const color = tagRecord && tagRecord.color || record.color
                        note = new TagNote(
                            new NoteMetadata(record.id, record.type, this.metadata, undefined, undefined, color),
                            record.content,
                            this
                        )
                        note.addEventListener('edited', ({ newContent }) => {
                            const tags = this.tags.map(tag => tag.content)
                            if (tags.filter(tag => tag === newContent).length > 1) note.remove()
                        })
                    }
                    this._notes.push(note)
                })
                this._changedNotes = []
                this._deletedNotes = []
            }

            get notes() {
                return this._notes.filter(note => note instanceof RegularNote) as RegularNote[]
            }

            get tags() {
                return this._notes.filter(note => note instanceof TagNote) as TagNote[]
            }

            get isSaved() {
                return (this._changedNotes.length + this._deletedNotes.length) === 0
            }

            getNoteByPosition(position: Position): RegularNote {
                return this._notes.find(note => note.metadata.position === position) as RegularNote
            }

            getNoteById(id: string): Note {
                return this._notes.find(note => note.metadata.id === id)
            }

            private addAnyNote<N extends Note>(
                {
                    position, content, textContext,
                    presentationTitle, slideTitle, type, color,
                    lessonID, screenid, slide
                }: NewNoteOptions,

                constructor: new (arg0: NoteMetadata, arg1: string, arg2: this) => N
            ): N {
                if (presentationTitle) this.metadata.presentationTitle = presentationTitle
                if (slideTitle) this.metadata.slideTitle = slideTitle
                const id = generateId()
                const note = new constructor(new NoteMetadata(id, type, this.metadata, position, textContext, color), content, this)
                this._notes.push(note)
                this._changedNotes.push(note)
                this.trigger('change', { added: [note] })
                return note
            }

            addNote(options: NewNoteOptions): RegularNote {
                options.type = NoteType.Regular
                return this.addAnyNote(options, RegularNote)
            }

            addTag(options: NewNoteOptions): TagNote {
                options.type = NoteType.Tag
                return this.addAnyNote(options, TagNote)
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
                this.trigger('change', { deleted: [deleted] })
                //console.log('deleting', { deleted }, 'from SlideNotesCollection')
                return deleted
            }

            removeAllNotes() {
                const toDelete = this._notes.concat(this._changedNotes)
                this._changedNotes = this._notes = []
                this.trigger('change', { deleted: toDelete })
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
                this.trigger('change', { changed: [note] })
            }

            async commitChanges() {
                this.trigger('commit', {})
                await this.parent.removeNotes(this._deletedNotes)
                this._deletedNotes = []
                await this.parent.saveNotes(this._changedNotes)
                this._changedNotes = []
            }
        }
    }

    function generateId(): string {
        return unsafeWindow.crypto.randomUUID()
    }

    type Position = {
        x: number
        y: number
    }

    export namespace RecordTypes {

        export type Note = Mutable<NoteMetadata> & { content: string } & Mutable<SlideMetadata>

        export interface Tag {
            name: string,
            color: string
        }
    }

    export namespace Collections {
        type StoreIndex<T extends { [k: string]: any }> = {
            name: string
            columns: keyof T | (keyof T)[]
            options: IDBIndexParameters
        }

        type StoreIndexes<T extends { [k: string]: any }> = {
            [name: `by${string}`]: StoreIndex<T>
        }

        type TagRecordWithIndex = RecordTypes.Tag & {
            index: number
        }

        interface PresentationEvents {
            changedTags: { changed?: (TagRecordWithIndex)[], added?: RecordTypes.Tag[] }
        }

        export class Presentation extends CustomEventEmmiter<PresentationEvents> {
            private static readonly NOTES_STORE = 'Notes'
            private static readonly TAGS_STORE = 'Tags'

            private static readonly NOTES_INDEXES = {
                byScreenIDAndSlide: {
                    name: 'byScreenIDAndSlide',
                    columns: ['screenid', 'slide'],
                    options: { unique: false }
                },
                byScreenID: {
                    name: 'byScreenID',
                    columns: 'screenid',
                    options: { unique: false }
                },
                byContentAndType: {
                    name: 'contentAndType',
                    columns: ['content', 'type'],
                    options: { unique: false }
                },
                byType: {
                    name: 'byType',
                    columns: 'type',
                    options: { unique: false }
                },
                byContent: {
                    name: 'byContent',
                    columns: 'content',
                    options: { unique: false }
                }
            }

            private static readonly TAGS_INDEXES = {
                byName: {
                    columns: "name",
                    name: 'byName',
                    options: { unique: true }
                }
            }

            private cache: {
                [k: number]: Slide
            } = {}

            private _tags: RecordTypes.Tag[] = []

            private static setupDB(event: IDBVersionChangeEvent, db: IDBDatabase) {
                let notesStore: IDBObjectStore, tagsStore: IDBObjectStore
                if (event.oldVersion !== event.newVersion) {
                    notesStore = db.createObjectStore(Presentation.NOTES_STORE, { keyPath: 'id' })
                    tagsStore = db.createObjectStore(Presentation.TAGS_STORE, { keyPath: 'name' })
                } else {
                    const transaction = (event.target as any).transaction as IDBTransaction
                    notesStore = transaction.objectStore(Presentation.NOTES_STORE)
                    tagsStore = transaction.objectStore(Presentation.TAGS_STORE)
                }
                Presentation.generateIndexes(notesStore, Presentation.NOTES_INDEXES)
                Presentation.generateIndexes(tagsStore, Presentation.TAGS_INDEXES)
                // notesStore.createIndex('id', 'id', { unique: true })
                return notesStore
            }

            private static generateIndexes<T extends { [k: string]: any }>(store: IDBObjectStore, indexes: StoreIndexes<T>) {
                const notesIndexes = Object.values(indexes)
                notesIndexes.forEach(index => {
                    try {
                        store.createIndex(index.name, index.columns as string | string[], index.options)
                    } catch (err) {
                        console.error(err)
                    }
                })
            }

            static async createAsync(screenid: number, lessonID?: number) {
                const db = await getIndexedDB("NotesDatabase", 5, Presentation.setupDB)
                const notesCollection = new Presentation(db, screenid, lessonID)
                return notesCollection
            }

            constructor(private readonly db: IDBDatabase, private readonly _screenid: number, private readonly _lessonID?: number) {
                super()
            }

            wipeCache() {
                this.cache = {}
            }

            async getNotesBySlide(slide: number): Promise<Slide> {
                // if (this.cache[slide]) return this.cache[slide]
                const transaction = this.db.transaction(Presentation.NOTES_STORE, 'readonly')
                const notesStore = transaction.objectStore(Presentation.NOTES_STORE)
                const screenidIndex = notesStore.index(Presentation.NOTES_INDEXES.byScreenIDAndSlide.name)
                const notesRequest = screenidIndex.getAll([this._screenid, slide])
                return new Promise((resolve, reject) => {
                    notesRequest.addEventListener('success', ev => {
                        const notes: RecordTypes.Note[] = notesRequest.result
                        const slideTitle = notes[0] && notes[0].slideTitle || ''
                        const presentationTitle = notes[0] && notes[0].presentationTitle || ''
                        const slideCollection = new Slide(
                            new SlideMetadata(slide, this._screenid, slideTitle, presentationTitle, this._lessonID),
                            notes, this
                        )
                        this.cache[slide] = slideCollection
                        resolve(slideCollection)
                    })
                    notesRequest.addEventListener('error', err => reject(err))
                })
            }

            get tags() {
                return this._tags
            }

            getAllTagNames() {
                const transaction = this.db.transaction(Presentation.TAGS_STORE, 'readonly')
                const notesStore = transaction.objectStore(Presentation.TAGS_STORE)
                const screenidIndex = notesStore.index(Presentation.TAGS_INDEXES.byName.name)
                const allTags = screenidIndex.getAll()
                return new Promise<RecordTypes.Tag[]>((resolve, reject) => {
                    allTags.addEventListener('success', ev => {
                        const tagsResult: RecordTypes.Tag[] = allTags.result
                        if (this._tags.length !== tagsResult.length) {
                            this._tags = tagsResult
                            this.trigger('changedTags', {
                                changed: tagsResult.map((tag, i) => {
                                    return { ...tag, index: i }
                                })
                            })
                        }
                        resolve(tagsResult)
                    })
                    allTags.addEventListener('error', err => reject(err))
                })

            }

            getAllTagsWithName(name: string) {
                const transaction = this.db.transaction(Presentation.NOTES_STORE, 'readonly')
                const notesStore = transaction.objectStore(Presentation.NOTES_STORE)
                const tagIndex = notesStore.index(Presentation.NOTES_INDEXES.byContentAndType.name)
                const notesRequest = tagIndex.getAll([name, 'tag'])
                return new Promise<RecordTypes.Note[]>((resolve, reject) => {
                    notesRequest.addEventListener('success', ev => {
                        const notes: RecordTypes.Note[] = notesRequest.result
                        resolve(notes)
                    })
                    notesRequest.addEventListener('error', err => reject(err))
                })
            }

            static mapNoteToRecord(note: Note): RecordTypes.Note {
                return {
                    content: note.content,
                    id: note.metadata.id,
                    screenid: note.metadata.screenid,
                    slide: note.metadata.slide,
                    position: note.metadata.position,
                    presentationTitle: note.metadata.presentationTitle,
                    slideTitle: note.metadata.slideTitle,
                    textContext: note.metadata.textContext,
                    type: note.metadata.type,
                    color: note.metadata.color,
                    lessonID: note.metadata.lessonID
                }
            }

            saveNotes(notes: Note[]) {
                const records = notes.map(Presentation.mapNoteToRecord)
                return this.importNotes(records)
            }

            importNotes(notes: RecordTypes.Note[]) {
                //console.log('to import:', { notes })
                const transaction = this.db.transaction(
                    [Presentation.NOTES_STORE, Presentation.TAGS_STORE],
                    'readwrite'
                )
                const notesStore = transaction.objectStore(Presentation.NOTES_STORE)
                const tagStore = transaction.objectStore(Presentation.TAGS_STORE)
                const changedTags: TagRecordWithIndex[] = []
                const addedTags: RecordTypes.Tag[] = []
                notes.forEach(record => {
                    notesStore.put(record)
                    if (record.type === 'tag') {
                        const name = record.content
                        const color = record.color
                        const toSave = { name, color }
                        tagStore.put(toSave)
                        const i = this._tags.findIndex(t => t.name === name)
                        if (i >= 0) {
                            if (this._tags[i].color !== color) {
                                this._tags[i].color = color
                                changedTags.push({ ...this._tags[i], index: i })
                            }
                        } else {
                            this._tags.push(toSave)
                            addedTags.push(toSave)
                        }
                    }
                })
                transaction.commit()
                if (changedTags.length || addedTags.length) this.trigger('changedTags', {
                    changed: changedTags, added: addedTags
                })
                return new Promise<void>((resolve, reject) => {
                    transaction.addEventListener('complete', ev => {
                        resolve()
                    })
                    transaction.addEventListener('error', err => reject(err))
                })
            }

            removeNotes(notes: Note[]) {
                const transaction = this.db.transaction(Presentation.NOTES_STORE, 'readwrite')
                const notesStore = transaction.objectStore(Presentation.NOTES_STORE)
                notes.forEach(note => {
                    //console.log('deleting', { note }, 'from PresentationNotesCollection')
                    notesStore.delete(note.metadata.id)
                })
                transaction.commit()
                return new Promise<void>((resolve, reject) => {
                    transaction.addEventListener('complete', ev => {
                        resolve()
                    })
                    transaction.addEventListener('error', err => reject(err))
                })
            }

            exportNotes() {
                const transaction = this.db.transaction(Presentation.NOTES_STORE, 'readonly')
                const notesStore = transaction.objectStore(Presentation.NOTES_STORE)
                const screenidIndex = notesStore.index(Presentation.NOTES_INDEXES.byScreenID.name)
                const notesRequest = screenidIndex.getAll(this._screenid)
                return new Promise<RecordTypes.Note[]>((resolve, reject) => {
                    notesRequest.addEventListener('success', ev => {
                        const notes: RecordTypes.Note[] = notesRequest.result
                        resolve(notes)
                    })
                    notesRequest.addEventListener('error', err => reject(err))
                })
            }
        }
    }
}

// PresentationNotesCollection.createAsync(892).then(collection => console.log(collection))