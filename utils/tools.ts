let suggestBreakTimer: NodeJS.Timeout, obs: MutationObserver
function startBreakTimer() {
    clearTimeout(suggestBreakTimer)
    console.log('starting suggestBreak timer...')
    suggestBreakTimer = setTimeout(() => {
        alert('Pora na przerwę 🔔')
    }, 1000 * 60 * 7)
}
toRunOnLoaded.push(() => {
    obs = onAttributeChange(document.querySelector(SELECTORS.appDiv), 'slide', () => {
        startBreakTimer()
    })
    if (tools && !tools.state.suggestBreak.value) obs.disconnect()
})
const notesBtnHandler = (event: MouseEvent) => {
    if (currentSlideNotes) {
        const slide = document.querySelector('.present .present') as HTMLElement
        slide.style.cursor = 'crosshair'
        slide.addEventListener('click', event => {
            event.preventDefault()
            event.stopImmediatePropagation()
            slide.style.cursor = ''
            const slideRect = slide.getBoundingClientRect()
            console.log({event, slideRect})
            const position: Position = {
                x: (event.x - slideRect.x) / slideRect.width,
                y: (event.y - slideRect.y) / slideRect.height
            }
            currentSlideNotes.addNote(position, prompt('Podaj treść notatki:'))
        }, {once: true})
    }
}
tools = new Options([
    {
        name: "suggestBreak",
        desc: state => `${getCheckboxEmoji(state.value)}🔔 Sugeruj przerwę przy dłuższym braku aktywności`,
        defaultValue: false,
        callback: function (state) {
            return { value: !state.value }
        },
        update: state => {
            console.log('update suggestBreak', { state, obs })
            if (!obs) return
            if (state.value) {
                obs.observe(document.querySelector(SELECTORS.appDiv), { attributes: true })
                startBreakTimer()
            } else {
                obs.disconnect()
                if (suggestBreakTimer) clearTimeout(suggestBreakTimer)
            }
        }
    },
    {
        name: "useNotes",
        desc: state => `${getCheckboxEmoji(state.value)}📝 Używaj notatek`,
        defaultValue: false,
        callback: function (state) {
            return { value: !state.value }
        },
        update: state => {
            const notesBtn = document.querySelector('.custom-notes-btn')
            console.log({ notesBtn })
            toggleBodyClass('custom-script-use-notes', state.value)
            if (notesBtn) {
                if (state.value) {
                    notesBtn.addEventListener('click', notesBtnHandler)
                } else {
                    notesBtn.removeEventListener('click', notesBtnHandler)
                }
            }
        },
        init: state => {
        },

    }
], `.${CLASS_NAMES.toolsContainer}`)
