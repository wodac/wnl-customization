///<reference path="ExternalFragment.ts" />
///<reference path="../globals.d.ts" />
class CourseSidebar extends ExternalFragment<{
    urlChange: string
}> {
    container: HTMLElement
    collapseToggler: ClassToggler

    constructor() {
        super('https://lek.wiecejnizlek.pl/app/courses/1/', '.course-sidenav>div')
        this.prepareContainer()
        this.addEventListener(
            'loaded',
            el => {
                if (!el) return
                this.container.append(el)
            }, 
            true
        )
        this.addEventListener('iframeURLChange', newURL => {
            this.trigger('urlChange', newURL)
            this.load()
        })
    }

    static CONTAINER_HTML = `
    <a>
        ${SVGIcons.chevronUp}
        <span>GŁÓWNE MENU</span>
    </a>`

    private prepareContainer() {        
        this.container = document.createElement('div')
        this.container.innerHTML = CourseSidebar.CONTAINER_HTML
        this.container.classList.add('custom-main-nav-container')
        this.collapseToggler = new ClassToggler('active', this.container)
        this.container.querySelector('a').addEventListener(
            'click', () => this.collapseToggler.toggle()
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
}