///<reference path="../globals.d.ts" />
///<reference path="CustomEventEmmiter.ts" />
///<reference path="PresentationMetadata.ts" />

enum TabOpenerIndexes {
    noAction = -1,
    findTab = -2
}

type TabOpenerEvents = {
    remoteOpenRequest: SlideToOpen
}

type SlideToOpen = {
    lessonID: number;
    screenID: number;
    slide: number;
    currentTab: number;
};

class TabOpener extends CustomEventEmmiter<TabOpenerEvents> {
    private _tabIndex: number;

    public get tabIndex(): number {
        return this._tabIndex;
    }
    
    constructor(public app: App) {
        super()
        this.getTabIndex()
        this.setInitialStoreVal()
        GM_addValueChangeListener('openInTab', (name, oldVal, toOpen, remote) => {
            if (remote && toOpen.currentTab >= 0) {
                this.trigger('remoteOpenRequest', toOpen)
            }
            this.openSlide(toOpen)
        })
    }

    private async getTabIndex() {
        const tabs = await this.getTabs()
        let maxIndex = 0
        if (tabs) {
            tabs.forEach(tab => {
                if (tab && tab.index > maxIndex) maxIndex = tab.index
            })
            maxIndex++
        }
        GM_saveTab({ index: maxIndex })
        this._tabIndex = maxIndex
    }

    private getTabs() {
        return new Promise<{ index }[]>(resolve => {
            GM_getTabs(tabs => resolve(Object.values(tabs)))
        })
    }

    focusThisTab() {
        if (document.hidden) {
            const w = GM_openInTab('about:blank', { active: true, setParent: true })
            setTimeout(() => w.close(), 0)
        }
    }

    openURLinTab(url: string) {
        return GM_openInTab(url, { active: true, setParent: true })
    }

    private setInitialStoreVal() {
        GM_setValue('openInTab', {
            lessonID: this.app.presentationMetadata.lessonID,
            screenID: this.app.presentationMetadata.screenID,
            slide: this.app.presentationMetadata.slideNumber,
            currentTab: -1
        })
    }

    private async findTabToOpen(toOpen: SlideToOpen) {
        if (isMobile()) {
            this.openURLinTab(this.generateURL(toOpen))
            return
        }
        const tabs = await this.getTabs()
        let nextIndex = 1000
        tabs.forEach(tab => {
            if (tab && tab.index > toOpen.currentTab && tab.index < nextIndex)
                nextIndex = tab.index
        })
        if (nextIndex === 1000) {
            nextIndex = -1
            this.openURLinTab(this.generateURL(toOpen))
        }
        toOpen.currentTab = nextIndex
        GM_setValue('openInTab', toOpen)
    }

    private generateURL(toOpen: SlideToOpen) {
        const path = [WNL_LESSON_LINK, toOpen.lessonID, toOpen.screenID, toOpen.slide]
        return path.join('/')
    }


    openSlide(toOpen: Omit<SlideToOpen, "currentTab"> & { currentTab?: number }) {
        if (toOpen) {
            console.table(toOpen)
            if (typeof toOpen.currentTab !== 'number') {
                toOpen.currentTab = TabOpenerIndexes.findTab
            }
            if (toOpen.currentTab === TabOpenerIndexes.noAction) return
            if (this.isSlideInCurrentSlideshow(toOpen as SlideToOpen)) {
                this.focusThisTab()
                this.app.presentationMetadata.slideNumber = toOpen.slide
                this.setInitialStoreVal()
            } else if (toOpen.currentTab === TabOpenerIndexes.findTab ||
                toOpen.currentTab === this.tabIndex) {
                this.findTabToOpen(toOpen as SlideToOpen)
            }
        }
    }

    private isSlideInCurrentSlideshow(toOpen: SlideToOpen) {
        return toOpen.lessonID === this.app.presentationMetadata.lessonID &&
            toOpen.screenID === this.app.presentationMetadata.screenID &&
            toOpen.slide
    }
}
