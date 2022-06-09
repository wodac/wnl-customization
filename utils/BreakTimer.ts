namespace BreakTimer {
    export let timer: NodeJS.Timeout;
    export function start() {
        clearTimeout(timer);
        //console.log('starting suggestBreak timer...')
        timer = setTimeout(() => {
            alert('Pora na przerwę 🔔');
        }, 1000 * 60 * 7);
    }
    export function endListening() {
        presentationMetadata.removeEventListener('slideChange', start);
        if (timer)
            clearTimeout(timer);
    }
    export function startListening() {
        presentationMetadata.addEventListener('slideChange', start);
    }
}
