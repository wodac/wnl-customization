///<reference path="common.ts" />
///<reference path="CustomEventEmmiter.ts" />
///<reference path="../App.ts" />

namespace ResettingTimer {
    export type Events = {
        timerStart: {},
        timerEnd: {},
        endListening: {}
    }
}

class ResettingTimer extends CustomEventEmmiter<ResettingTimer.Events> {
    constructor(public time: number) {
        super()
        // app.addEventListener('unloaded', () => this.timer && clearTimeout(this.timer))
    }
    
    protected timer: NodeJS.Timeout

    start() {
        clearTimeout(this.timer)
        this.trigger('timerStart')
        this.timer = setTimeout(() => {
            this.trigger('timerEnd')
        }, this.time);
    }

    protected _listener = () => this.start()

    get listener(): () => void {
        return this._listener
    }

    endListening() {
        if (this.timer) clearTimeout(this.timer)
        this.trigger('endListening')
    }
}
