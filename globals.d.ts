
// @grant        unsafeWindow
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_saveTab
// @grant        GM_getTab
// @grant        GM_getTabs
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_addElement
// @grant        GM_download

interface TabObject { 
    originalURL?: string, 
    originalTitle?: string, 
    dontUseAutoProxy?: boolean,
    [key: string]: any
}
type BooleanValueName = 'useURLFinder' | 'autoloadProxy' 
type CitationFormat = "apa" | "harvard1" | "nature" | "modern-language-association-with-url" | "chicago-author-date" | "vancouver"
interface StoredValueType {
    'option_smoothScroll': boolean
    'option_changeTitle': boolean
    'option_keyboardControl': boolean
    'autoloadProxy': boolean
    'citationFormat': CitationFormat
}
type ValueChangedListener = (name: string, old_value: any, new_value: any, remote: boolean) => any
declare let unsafeWindow: Window
declare let GM_getValue: <K extends keyof StoredValueType> (name: K, defaultValue?: StoredValueType[K]) => StoredValueType[K] 
declare let GM_registerMenuCommand: (description: string, callback?: Function, key?: string) => any
declare let GM_unregisterMenuCommand: (commandHandle: any) => any
declare let GM_saveTab: (tabObject: TabObject) => any
declare let GM_getTab: ( callback: (tab: TabObject) => any ) => any
declare let GM_getTabs: ( callback: (tabs: TabObject[]) => any ) => any
declare let GM_setValue: <K extends keyof StoredValueType> (name: K, value: StoredValueType[K]) => any
declare let GM_setClipboard: (text: string, type: string) => any
declare let GM_xmlhttpRequest: (options: any) => any
declare let GM_addElement: (parent: HTMLElement, tag: string, attributes: object) => any
declare let GM_download: (options: { url: string, name: string, saveAs: boolean }) => any
declare let GM_addValueChangeListener: (name: string, listener: ValueChangedListener) => any