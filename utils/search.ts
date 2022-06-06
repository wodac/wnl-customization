namespace Search {
    const getSearchURL = (q: string) => `https://lek.wiecejnizlek.pl/papi/v2/slides/.search?q=${encodeURIComponent(q)}&include=context,sections,slideshows.screens.lesson`
    const WNL_DYNAMIC_SLIDES = 'https://lek.wiecejnizlek.pl/app/dynamic/slides/'

    let searchContainer: HTMLDivElement, searchResultsContainer: HTMLDivElement
    export function addSearchContainer() {
        searchContainer = document.createElement('div')
        searchContainer.className = 'custom-script-search custom-script-hidden'
        searchContainer.innerHTML = `
        <input class="custom-search-result" style="width: 80%;display: inline-block;">
        <a class='custom-search-submit' style="font-size: 1.2rem;padding:0.1rem;">${SVGIcons.search}</a>
        `
        const closeBtn = document.createElement('div')
        closeBtn.className = 'custom-script-summary-close'
        closeBtn.innerHTML = SVGIcons.chevronUp
        searchContainer.prepend(closeBtn)
        closeBtn.addEventListener('click', () => hiddenToggle.state = true)
        searchResultsContainer = document.createElement('div')
        searchContainer.append(searchResultsContainer)
        document.querySelector('.order-number-container').after(searchContainer)
        searchContainer.querySelector('input.custom-search-result').addEventListener('change', () => performSearch())
        searchContainer.querySelector('a.custom-search-submit').addEventListener('click', () => performSearch())
    }

    function performSearch() {
        if (!searchContainer) return
        const q = (searchContainer.querySelector('input.custom-search-result') as HTMLInputElement).value
        const interpretation = interpretQuery(q)
        searchResultsContainer.innerHTML = `<p style='padding: 0.5rem;text-align: center'>Ładowanie...</p>`
        getSearchResponseHTML(interpretation).then(resp => {
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = ''
                searchResultsContainer.append(...resp)
            }
            hiddenToggle.state = false
        })
    }

    type QueryInterpretation = {
        query: string
        rawQuery: string
        mustContain?: string[]
        musntContain?: string[]
    }

    function interpretQuery(rawQuery: string): QueryInterpretation {
        let query = rawQuery.replace(/"/g, '')
        rawQuery = rawQuery.toLowerCase()
        const quotesRegExp = /"([^"]+)"/g
        const hasntRegExp = /-\w+/g
        let mustContain = rawQuery.match(quotesRegExp)
        let musntContain = rawQuery.match(hasntRegExp)
        if (musntContain) musntContain.forEach(toReplace => {
            query.replace(`-${toReplace}`, '')
        })
        query = query.trim()
        if (mustContain) mustContain = mustContain.map(s => s.slice(1, -1))
        if (musntContain) musntContain = musntContain.map(s => s.slice(1))
        return { query, rawQuery, mustContain, musntContain }
    }

    async function getSearchResponseHTML(q: QueryInterpretation): Promise<HTMLElement[]> {
        const response = await searchRequest(q)
        if (response.length) {
            return response.map(el => {
                const link = document.createElement('a')
                link.innerHTML = `
                <h5>${el.highlight['snippet.header'] || el.details.header}</h5>
                <h6>${el.highlight['snippet.subheader'] || el.details.subheader}</h6>
                <p>${el.highlight['snippet.content'] || el.details.content}</p>`
                link.href = getHref(el)
                link.target = '_blank'
                link.className = 'custom-search-result'
                link.addEventListener('click', ev => {
                    ev.preventDefault()
                    openSlideInTab({
                        currentTab: -2,
                        lessonID: el.context.lesson.id,
                        screenID: el.context.screen.id,
                        slide: el.context.slideshow.order_number
                    })
                })
                return link
            })
        }
        const notFoundInfo = document.createElement('p')
        notFoundInfo.innerHTML = `Nie znaleziono frazy <em>${q.rawQuery}</em> :(`
        notFoundInfo.style.padding = '0.5rem'
        return [notFoundInfo]

        function getHref(el: ParsedSearchResult) {
            const fragm = {
                f1: el.context.lesson,
                f2: el.context.screen,
                f3: el.context.slideshow
            }
            if (Object.values(fragm).every(val => val)) {
                const path = [fragm.f1.id, fragm.f2.id, fragm.f3.order_number]
                if (path.every(val => val)) {
                    return [WNL_LESSON_LINK, ...path].join('/')
                }
            }
            if (el.id) return WNL_DYNAMIC_SLIDES + el.id
            return '#'
        }
    }

    export const hiddenToggle = new ClassToggler('custom-script-hidden', '.custom-script-search', t => {
        if (!t.state) setTimeout(() => {
            (searchContainer.querySelector('input.custom-search-result') as HTMLInputElement).focus()
        }, 100)
    })

    function searchRequest(q: QueryInterpretation): Promise<ParsedSearchResult[]> {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                url: getSearchURL(q.query),
                method: 'GET',
                responseType: "json",
                onload: ({ response }: { response: SearchResults }) => {
                    const entries = Object.entries(response)
                    const results = entries.filter(el => el[0].match(/^[0-9]+$/)).map(el => el[1])
                    const parsed = results.map(el => {
                        return {
                            highlight: el.scout_metadata.highlight,
                            details: el.snippet,
                            context: el.context,
                            id: el.id
                        }
                    })
                    resolve(filterSearch(parsed, q))
                },
                onerror: reject
            })
        })
    }

    async function filterSearch(parsed: ParsedSearchResult[], q: QueryInterpretation): Promise<ParsedSearchResult[]> {
        let filtered = parsed
        if (q.mustContain) {
            filtered = parsed.filter(result => {
                return hasSomePhrases(result, q.mustContain).every(includes => includes)
            })
        }
        if (q.musntContain) {
            filtered = filtered.filter(result => {
                return !hasSomePhrases(result, q.musntContain).some(includes => includes)
            })
        }
        filtered.sort(sortUpSome(res => res.context.screen.id === presentationMetadata.screenID))
        function sortUpSome<T>(predicate: (val: T) => boolean) {
            return (val1: T, val2: T) => predicate(val1) && !predicate(val2) ? -1 : 1
        }
        return (await getTagsAsResults(q)).concat(filtered)

        function hasSomePhrases(result: ParsedSearchResult, phrases: string[]) {
            return phrases.map(toSearch => {
                return Object.values(result.highlight).some(highlighted => {
                    return highlighted.some(s => stripHTMLTags(s).includes(toSearch))
                })
            })
        }
    }

    async function getTagsAsResults(q: QueryInterpretation): Promise<ParsedSearchResult[]> {
        if (!notesCollection) return []
        const tags = await notesCollection.getAllTagsWithName(q.query)
        return tags.map(tag => {
            return {
                highlight: {
                    "snippet.content": [`<div title='${tag.content}' class='custom-tag'>${tag.content}</div>`]
                },
                details: {
                    header: tag.presentationTitle,
                    subheader: tag.slideTitle,
                },
                context: {
                    screen: { id: tag.screenid },
                    lesson: { id: tag.lessonID, name: tag.presentationTitle },
                    slideshow: {
                        order_number: tag.slide
                    }
                }
            }
        })
    }

    function stripHTMLTags(s: string) {
        const tagStripper = /<[^>]+>/g
        return s.toLowerCase().replace(tagStripper, '')
    }
}

namespace Toggles {
    export const searchHidden = Search.hiddenToggle
}
