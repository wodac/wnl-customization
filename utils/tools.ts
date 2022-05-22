let suggestBreakTimer: NodeJS.Timeout, obs: MutationObserver
function startBreakTimer() {
    clearTimeout(suggestBreakTimer)
    suggestBreakTimer = setTimeout(() => {
        alert('Pora na przerwę 🔔')
    }, 1000*60*7)
}
toRunOnLoaded.push(() => {
    obs = onAttributeChange(document.querySelector(SELECTORS.appDiv), 'slide', () => {
        startBreakTimer()
    })
})
tools = new Options([
    {
        name: "suggestBreak",
        desc: state => `${getCheckboxEmoji(state.value)}🔔 Sugeruj przerwę przy dłuższym braku aktywności`,
        defaultValue: false,
        callback: function (state) {
            return { value: !state.value }
        },
        update: state => {
            if (!obs) return
            if (state.value) {
                obs.observe(document.querySelector(SELECTORS.appDiv), { attributes: true })
            } else {
                obs.disconnect()
                if (suggestBreakTimer) clearTimeout(suggestBreakTimer)
            }
        }
    }
], `.${CLASS_NAMES.toolsContainer}`)
