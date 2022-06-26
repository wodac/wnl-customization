///<reference path="ExternalFragment.ts" />
///<reference path="../globals.d.ts" />
class CourseSidebar extends ExternalFragment<{
    urlChange: {
        url: string
        lessonID: number
        screenID: number
        slide: number
    }
}> {
    container: HTMLElement
    collapseToggler: ClassToggler
    changeURLInterval
    lastURLUpdate: number
    goBackToggle: ClassToggler
    urlChangeTime = 1200

    constructor() {
        super('https://lek.wiecejnizlek.pl/app/courses/1/', '.course-sidenav')
        this.prepareContainer()
        this.addEventListener(
            'loaded',
            el => {
                if (!el) return
                this.goBackToggle.state = false
                this.container.append(el)
            }
        )
        this.setupOpenLinks()
    }

    static CONTAINER_HTML = `
    <a class='custom-expand'>
        ${SVGIcons.chevronUp}
        <span>CAŁY KURS</span>
    </a>
    <a class='custom-go-back hidden'>
        ${SVGIcons.arrowLeftCircle}
        <span>WRÓĆ</span>
    </a>`

    private setupOpenLinks() {
        this.lastURLUpdate = Date.now()
        const urlRegExp = /lek.wiecejnizlek.pl\/app\/courses\/1\/lessons\/([0-9]+)\/([0-9]+)\/([0-9]+)/
        this.addEventListener('iframeURLChange', newURL => {
            this.goBackToggle.state = true
            const now = Date.now()
            console.log({now})
            if (now - this.lastURLUpdate < this.urlChangeTime) return
            this.lastURLUpdate = now
            const matching = urlRegExp.exec(newURL)
            console.table(matching)
            if (!matching) return
            this.trigger('urlChange', {
                url: newURL,
                lessonID: parseInt(matching[1]),
                screenID: parseInt(matching[2]),
                slide: parseInt(matching[3]),
            })
            console.log('reloading sidebar...')
            // this.load()
        })
    }

    private prepareContainer() {        
        this.container = document.createElement('div')
        this.container.innerHTML = CourseSidebar.CONTAINER_HTML
        this.container.classList.add('custom-main-nav-container')
        this.collapseToggler = new ClassToggler('active', this.container)
        this.container.querySelector('a.custom-expand').addEventListener(
            'click', () => this.collapseToggler.toggle()
        )
        const goBackBtn = this.container.querySelector('a.custom-go-back')
        this.goBackToggle = new ClassToggler('hidden', goBackBtn)
        this.goBackToggle.invert = true
        goBackBtn.addEventListener(
            'click', () => this.load()
        )
        // sidenav.prepend(this.container)
    }

    attach(parent: Element) {        
        parent.prepend(this.container)
    }

    show() {
        this.container && (this.container.style.display = '')
    }

    hide() {
        this.container && (this.container.style.display = 'none')
    }

    destroy(): void {
        this.container.remove()
        super.destroy()
    }
}
