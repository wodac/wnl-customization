import App from "../App"
import { ClassToggler } from "./common"
import CustomEventEmmiter from "./CustomEventEmmiter"
import { SELECTORS } from "./enums"

export interface ChapterMetadata {
    href: string
    name: string
    chapterLength: number
    startPage: number
    endPage: number
    children?: ChapterMetadata[]
}

type ChapterEvent = {
    rendered: {}
    activeChange: boolean
}

export class ChapterListElement extends CustomEventEmmiter<ChapterEvent> {
    children: ChapterListElement[]
    element: HTMLDivElement
    activeToggler: ClassToggler

    private _active: boolean
    public get active(): boolean {
        return this._active
    }
    public set active(value: boolean) {
        this._active = value
        this.trigger('activeChange', value)
        if (this.activeToggler) this.activeToggler.state = value
    }

    constructor (public metadata: ChapterMetadata, private parent: SlideshowChapters) {
        super()
        if (metadata.children) {
            this.children = metadata.children.map(
                meta => new ChapterListElement(meta, parent)
            )
        }
        this.active = false
    }

    getHTML() {
        return `<a class='custom-script-summary-link' href='${this.metadata.href}'>
           <span>${this.metadata.name} </span>
           <span class='small'>(${this.metadata.chapterLength})</span>
        </a>`
    }

    render() {
        this.element = document.createElement('div')
        this.element.classList.add('custom-script-summary-link-container')
        this.element.innerHTML = this.getHTML()
        if (this.children) {
            const list = document.createElement('ul')
            const listElems = this.children.map(child => {
                const li = document.createElement('li')
                li.append(child.render())
                return li
            })
            list.append(...listElems)
            this.element.append(list)
        }        
        this.activeToggler = new ClassToggler('active', this.element)
        const link = this.element.querySelector('a') as HTMLAnchorElement
        link.addEventListener('click', event => {
            event.preventDefault()
            this.parent.app.slideNumber = this.metadata.startPage
        })
        this.trigger('rendered')
        return this.element
    }
}

type SlideshowChaptersEvents = {
    dataRetrieved: ChapterMetadata[]
    rendered: {}
    activeChange: {
        path: ChapterListElement[]
    }
}

export interface ChapterProgress extends ChapterMetadata {
    current: number
    actualLength: number
}

export default class SlideshowChapters extends CustomEventEmmiter<SlideshowChaptersEvents> {
    menuOpened: boolean
    chapterMetadata: ChapterMetadata[]
    slideCount: number
    element: HTMLDivElement
    chapterElements: ChapterListElement[]
    private _rendered: boolean
    scrollIntoView: boolean
    currentChapterPath: ChapterListElement[]
    currentPage: number

    constructor(public app: App) {
        super()
    }

    async render(parentElement?: Element) {
        await this.getMetadata()
        if (this._rendered || !this.chapterMetadata) return
        this.element = document.createElement('div')
        this.chapterElements = this.chapterMetadata.map(meta => {
            const el = new ChapterListElement(meta, this)
            return el
        })
        this.element.append(...this.chapterElements.map(el => el.render()))
        if (parentElement) parentElement.append(this.element)
        this._rendered = true
        this.trigger('rendered')
        setTimeout(() => this.setCurrentPage(this.app.slideNumber), 0)
        return this.element
    }

    getProgress(): ChapterProgress[] {
        if (!this.currentChapterPath) return []
        return this.currentChapterPath.map(chapter => {
            return {
                ...chapter.metadata,
                current: this.currentPage - chapter.metadata.startPage + 1,
                actualLength: chapter.metadata.endPage - chapter.metadata.startPage + 1
            }
        })
    }

    setCurrentPage(page: number) {
        if (!this.chapterElements) return
        if (!page || page < 1 || page > this.slideCount) return
        this.currentPage = page
        if (this.currentChapterPath) this.currentChapterPath.forEach(el => el.active = false)
        this.currentChapterPath = []
        function findChapter(chapters: ChapterListElement[]) {
            return chapters.find(chapter => {
                return chapter.metadata.startPage <= page && chapter.metadata.endPage >= page
            })
        }
        let chapter = findChapter(this.chapterElements)
        if (!chapter) return []
        let children: ChapterListElement[]
        while (true) {
            this.currentChapterPath.push(chapter)
            children = chapter.children
            if (children) {
                chapter = findChapter(children)
                if (!chapter) break
            }
            else break
        }
        if (this.scrollIntoView && chapter) chapter.element.scrollIntoView({ behavior: "smooth" })
        this.trigger('activeChange', { path: this.currentChapterPath })
        this.currentChapterPath.forEach(el => el.active = true)
        return this.currentChapterPath
    }

    private getEndPages(chapters: Omit<ChapterMetadata, "endPage">[], length: number) {
        let chapterEnd = length, currentChapter: ChapterMetadata | null = null
        for (let index = chapters.length - 1; index >= 0; index--) {
            if (currentChapter) chapterEnd = currentChapter.startPage -1
            currentChapter = chapters[index] as ChapterMetadata
            currentChapter.endPage = chapterEnd
            if (currentChapter.children) {
                currentChapter.children = this.getEndPages(currentChapter.children, currentChapter.endPage)
            }
        }
        return chapters as ChapterMetadata[]
    }

    openMenu() {
        const menuBtn = document.querySelector(SELECTORS.menuBtn) as HTMLElement
        if (menuBtn) {
            menuBtn.click()
            this.menuOpened = true
        }
    }

    async getMetadata(): Promise<ChapterMetadata[]> {
        if (this.chapterMetadata) return this.chapterMetadata
        const menu = await this.getMenu()
        if (!menu) return []
        const active = menu.querySelector('.item-wrapper.is-active') as HTMLElement
        if (!active) {
            return []
        }
        this.slideCount = this.getSlideCount(active)
        const listParent = active.parentElement
        if (!listParent) {
            return []
        }
        const list = Array.from(listParent.children)
        if (this.menuOpened) this.closeMenu()
        if (list.length === 0) {
            return []
        }
        const wrappers = list.filter(el => el.nodeName === 'DIV') as HTMLElement[]
        if (wrappers.length === 0) {
            return []
        }
        const chapters = this.getMetadataFromLinks(wrappers)
        // console.log({chapters})
        this.chapterMetadata = this.getEndPages(chapters, this.slideCount)
        this.trigger('dataRetrieved', this.chapterMetadata)
        return this.chapterMetadata
    }

    closeMenu() {
        (document.querySelector('.topNavContainer__close') as HTMLElement).click()
    }

    private getSlideCount(a: HTMLElement) {
        const t = (a.querySelector('span span.sidenav-item-meta') as HTMLSpanElement).innerText
        return parseInt(t.slice(1, -1))
    }

    getMetadataFromLinks(wrappers: HTMLElement[]): Omit<ChapterMetadata, "endPage">[] {
        const links = wrappers.map(div => div.querySelector('a'))
        // console.log({links})
        const result: Omit<ChapterMetadata, "endPage">[] = []
        links.forEach((a, i) => {
            if (!a || !a.href) return 
            const chapterLength = this.getSlideCount(a)
            let children: Omit<ChapterMetadata, "endPage">[] = []
            const subwrappers: NodeListOf<HTMLDivElement> = wrappers[i].querySelectorAll('div')
            if (subwrappers.length) {
                children = this.getMetadataFromLinks(Array.from(subwrappers))
            }
            result.push({
                href: a.href,
                name: (a.querySelector('span span') as HTMLSpanElement).innerText,
                chapterLength, children: children as ChapterMetadata[],
                startPage: parseInt(a.href.split('/').pop() as string)
            })
        })
        return result
    }

    async getMenu() {
        return new Promise<false | HTMLElement>(resolve => {
            const menu = document.querySelector('aside.sidenav-aside')
            if (!menu) {
                if (this.menuOpened) {
                    resolve(false)
                    return
                }
                this.openMenu()
                setTimeout(() => resolve(this.getMenu()), 100)
            } else {
                resolve(menu as HTMLElement)
            }
        })
    }
}

