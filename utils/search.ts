const getSearchURL = (q: string) => `https://lek.wiecejnizlek.pl/papi/v2/slides/.search?q=${encodeURIComponent(q)}&include=context,sections,slideshows.screens.lesson`
const WNL_DYNAMIC_SLIDES = 'https://lek.wiecejnizlek.pl/app/dynamic/slides/'

let searchContainer: HTMLDivElement, searchResultsContainer: HTMLDivElement
function addSearchContainer() {
    searchContainer = document.createElement('div')
    searchContainer.className = 'custom-script-search custom-script-hidden'
    searchContainer.innerHTML = `
        <input class="custom-search-result" style="width: 80%;display: inline-block;">
        <a class='custom-search-submit' style="font-size: 1.2rem;padding:0.1rem;">${svgIcons.search}</a>
        `
    const closeBtn = document.createElement('div')
    closeBtn.className = 'custom-script-summary-close'
    closeBtn.innerHTML = svgIcons.chevronUp
    searchContainer.prepend(closeBtn)
    closeBtn.addEventListener('click', () => toggleSearch(false))
    searchResultsContainer = document.createElement('div')
    searchContainer.append(searchResultsContainer)
    document.querySelector('.order-number-container').after(searchContainer)
    searchContainer.querySelector('input.custom-search-result').addEventListener('change', () => performSearch())
    searchContainer.querySelector('a.custom-search-submit').addEventListener('click', () => performSearch())
}

function performSearch() {
    if (!searchContainer) return
    const q = (searchContainer.querySelector('input.custom-search-result') as HTMLInputElement).value
    getSearchResponseHTML(q).then(resp => {
        if (searchResultsContainer) searchResultsContainer.innerHTML = resp
        toggleSearch(true)
    })
}

async function getSearchResponseHTML(q: string): Promise<string> {
    const response = await searchRequest(q)
    return response.map(el => `
        <a href='${WNL_DYNAMIC_SLIDES+el.id}' target='_blank' class='custom-search-result'>
            <h5>${el.highlight['snippet.header'] || el.details.header}</h5>
            <h6>${el.highlight['snippet.subheader'] || el.details.subheader}</h6>
            <p>${el.highlight['snippet.content'] || el.details.content}</p>
        </a>
        `).join('')
}

function toggleSearch(visible?: boolean) {
    if (!searchContainer) return
    if (typeof visible === 'undefined') visible = searchContainer.className.includes('custom-script-hidden')
    if (visible) {
        searchContainer.classList.remove('custom-script-hidden')
        setTimeout(() => (searchContainer.querySelector('input.custom-search-result') as HTMLInputElement).focus(), 100)
    }
    else searchContainer.classList.add('custom-script-hidden')
}

function searchRequest(q: string): Promise<ParsedSearchResult[]> {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            url: getSearchURL(q),
            method: 'GET',
            responseType: "json",
            onload: ({ response }: { response: SearchResults }) => {
                const entries = Object.entries(response)
                const results = entries.filter( el => el[0].match(/^[0-9]+$/) ).map(el => el[1])
                const parsed = results.map(el => {
                    return {
                        highlight: el.scout_metadata.highlight,
                        details: el.snippet,
                        context: el.context,
                        id: el.id
                    }
                })
                resolve(parsed)
            },
            onerror: reject
        })
    })
}