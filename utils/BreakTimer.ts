import App from "../App";

export default class BreakTimer {
    constructor(public app: App) {
        app.addEventListener('unloaded', () => this.timer && clearTimeout(this.timer))
    }
    timer: NodeJS.Timeout;
    start() {
        clearTimeout(this.timer);
        //console.log('starting suggestBreak timer...')
        this.timer = setTimeout(() => {
            alert('Pora na przerwę 🔔');
        }, 1000 * 60 * this.app.tools.getValue('breakTime'));
    }
    endListening() {
        this.app.presentationMetadata.removeEventListener('slideChange', this.start);
        if (this.timer)
            clearTimeout(this.timer);
    }
    startListening() {
        this.app.presentationMetadata.addEventListener('slideChange', this.start);
    }
}
