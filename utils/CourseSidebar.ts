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

    static readonly URLChangeTime = 1000

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

    protected readonly LoadingHTML = `
    <div class="navigation-group__toggle">
        <div class="navigation-group__item">
            <div class="a-icon navigation-group__itemIcon -x-small">
                <svg data-icon="angle-down" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="svg-inline--fa fa-angle-down">
                    <path fill="currentColor" d="M360.5 217.5l-152 143.1C203.9 365.8 197.9 368 192 368s-11.88-2.188-16.5-6.562L23.5 217.5C13.87 208.3 13.47 193.1 22.56 183.5C31.69 173.8 46.94 173.5 56.5 182.6L192 310.9l135.5-128.4c9.562-9.094 24.75-8.75 33.94 .9375C370.5 193.1 370.1 208.3 360.5 217.5z" class="">
                    </path>
                </svg>
            </div> 
            <span class="sidenav-item-content custom-loading">
                <div style='width: 70%; height: 1.5rem; display: inline-block;'></div>
            </span>
        </div>
    </div>`

    private setupOpenLinks() {
        this.lastURLUpdate = Date.now()
        const urlRegExp = /lek.wiecejnizlek.pl\/app\/courses\/1\/lessons\/([0-9]+)\/([0-9]+)\/([0-9]+)/
        this.addEventListener('iframeURLChange', newURL => {
            this.goBackToggle.state = true
            const now = Date.now()
            console.log({now})
            if (now - this.lastURLUpdate < CourseSidebar.URLChangeTime) return
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