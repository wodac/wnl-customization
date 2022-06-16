export interface EventsInterface {
    [eventName: string]: any
}

export type CustomEventListener<Event> = (ev: Event) => any

export type CustomEventListeners<Events extends EventsInterface> = {
    [Name in keyof Events]: CustomEventListener<Events[Name]>[]
}

export default class CustomEventEmmiter<Events extends EventsInterface> {
    private listeners = {} as CustomEventListeners<Events>;

    addEventListener<EventName extends keyof Events>(eventName: EventName, listener: CustomEventListener<Events[EventName]>, once?: boolean) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        if (once) {
            const toAdd = event => {
                listener.bind(this)(event);
                this.removeEventListener(eventName, toAdd);
            }
            this.listeners[eventName].push(toAdd)
        } else {
            this.listeners[eventName].push(listener) //.bind(this)
        }
    }

    removeEventListener<EventName extends keyof Events>(eventName: EventName, listener: CustomEventListener<Events[EventName]>) {
        if (!this.listeners[eventName]) return
        const i = this.listeners[eventName].findIndex(cb => cb == listener)
        // console.log('removing', { listener }, 'for event', eventName, 'on position', { i }, 'on', this)
        if (i >= 0) {
            const toRemove = this.listeners[eventName].splice(i, 1)
            return toRemove[0]
        }
    }

    removeAllListeners(eventName?: keyof Events) {
        if (eventName) this.listeners[eventName] = []
        else this.listeners = {} as CustomEventListeners<Events>;
    }


    trigger<EventName extends keyof Events>(eventName: EventName, event: Events[EventName] = {} as Events[EventName]) {
        // console.log(`triggering`, eventName, `with data`, event, 'on', this);
        setTimeout(() => {
            this.listeners[eventName] && this.listeners[eventName].forEach(listener => {
                try {
                    listener.bind(this)(event)
                } catch (err) {
                    console.error(
                        'triggering', eventName,
                        `with data`, event,
                        'on', this,
                        'with callback', listener,
                        `(${listener.toString()})`
                    )
                }
            })
        }, 0)
    }
}
