
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
    [key: string]: any
}
interface StoredValueType {
    'option_smoothScroll': boolean
    'option_changeTitle': boolean
    'option_keyboardControl': boolean
    [key: `option_${string}`]: any
    [key: `option_is${string}`]: boolean
    [key: `option_${string}Number`]: number
}
/**
 * @param name is the name of the observed variable.
 * @param remote shows whether this value was modified from the instance of another tab (true) or within this script instance (false)
 */
type ValueChangedListener<T> = (name: string, old_value: T, new_value: T, remote: boolean) => any
declare let unsafeWindow: Window
declare let GM_getValue: <K extends keyof StoredValueType> (name: K, defaultValue?: StoredValueType[K]) => StoredValueType[K] 
declare let GM_registerMenuCommand: (description: string, callback?: Function, key?: string) => any
declare let GM_unregisterMenuCommand: (commandHandle: any) => any
/**
 * Save the tab object to reopen it after a page unload.
 */
declare let GM_saveTab: (tabObject: TabObject) => any
/**
 * Get a object that is persistent as long as this tab is open.
 */
declare let GM_getTab: ( callback: (tab: TabObject) => any ) => any
/**
 * Get all tab objects as a hash to communicate with other script instances.
 */
declare let GM_getTabs: ( callback: (tabs: TabObject[]) => any ) => any
declare let GM_setValue: <K extends keyof StoredValueType> (name: K, value: StoredValueType[K]) => any
/**
 * Copies data into the clipboard. The parameter 'info' can be an object like "{ type: 'text', mimetype: 'text/plain'}" or just a string expressing the type ("text" or "html").
 */
declare let GM_setClipboard: (text: string, info: string | { type: string, mimetype: string }) => any
declare let GM_xmlhttpRequest: (options: GM_xmlhttpRequestOptions) => any
declare let GM_addElement: (parent: HTMLElement, tag: string, attributes: object) => any
declare let GM_download: (options: { url: string, name: string, saveAs: boolean }) => any
/**
 * Adds a change listener to the storage and returns the listener ID.
 * 'name' is the name of the observed variable.
 * The 'remote' argument of the callback function shows whether this value was modified from the instance of another tab (true) or within this script instance (false).
 * Therefore this functionality can be used by scripts of different browser tabs to communicate with each other.
 */
declare let GM_addValueChangeListener: <K extends keyof StoredValueType> (name: K, listener: ValueChangedListener<StoredValueType[K]>) => any

interface GM_xmlhttpRequestOptions {
    method?: 'GET' | 'HEAD' | 'POST'
    /** the destination URL */
    url: string 
    /** ie. user-agent, referer, ... (some special headers are not supported by Safari and Android browsers) */
	headers?: Headers //
    /** some string to send via a POST request */
	data?: string //
    /** a cookie to be patched into the sent cookie set */
	cookie?: string //
    /** send the data string in binary mode */
	binary?: boolean //
    /** don't cache the resource */
	nocache?: boolean //
    /** revalidate maybe cached content */
	revalidate?: boolean //
    /** a timeout in ms */
	timeout?: number //
    /** a property which will be added to the response object */
	context?: any //
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'stream'
    /** a MIME type for the request */
	overrideMimeType?: string //
    /** don't send cookies with the requests (please see the fetch notes) */
	anonymous?: boolean //
    /** (beta) use a fetch instead of a xhr request */
	fetch?: boolean //
    /** a user name for authentication */
	user?: string //
    /** a password */
	password?: string //
    /** callback to be executed if the request was aborted */
	onabort?: Function //
    /** callback to be executed if the request ended up with an error */
	onerror?: Function //
    /** callback to be executed on load start, provides access to the stream object if responseType is set to "stream" */
	onloadstart?: Function //
    /** callback to be executed if the request made some progress */
	onprogress?: Function //
    /** callback to be executed if the request's ready state changed */
	onreadystatechange?: Function //
    /** callback to be executed if the request failed due to a timeout */
	ontimeout?: Function //
    /** callback to be executed if the request was loaded. */
	onload?: XHROnLoadCallback //
}

type XHROnLoadCallback = (xhrResult: {
    finalUrl: string //the final URL after all redirects from where the data was loaded
    readyState: number //the ready state
    status: number //the request status
    statusText: string //the request status text
    responseHeaders: any //the request response headers
    response: any //the response data as object if details.responseType was set
    responseXML: XMLDocument //the response data as XML document
    responseText: string //the response data as plain string
}) => any