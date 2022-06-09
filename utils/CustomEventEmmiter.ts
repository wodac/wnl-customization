type CustomEventListener<Event> = (ev: Event) => any

type CustomEventListeners<Events> = {
    [Name in keyof Events]: CustomEventListener<Events[Name]>[]
}

class CustomEventEmmiter<Events> {
    private listeners = {} as CustomEventListeners<Events>;

    addEventListener<EventName extends keyof Events>(eventName: EventName, listener: CustomEventListener<Events[EventName]>, once?: boolean) {
        if (!this.listeners[eventName])
            this.listeners[eventName] = [];
        if (once) {
            listener = event => {
                listener.bind(this)(event);
                this.removeEventListener(eventName, listener);
            };
        }
        this.listeners[eventName].push(listener.bind(this));
    }

    removeEventListener<EventName extends keyof Events>(eventName: EventName, listener: CustomEventListener<Events[EventName]>) {
        const i = this.listeners[eventName] && this.listeners[eventName].findIndex(cb => cb.toString() === listener.toString());
        if (i && i >= 0)
            return this.listeners[eventName].splice(i, 1);
    }

    removeAllListeners(eventName?: keyof Events) {
        if (eventName) this.listeners[eventName] = []
        else this.listeners = {} as CustomEventListeners<Events>;
    }


    trigger<EventName extends keyof Events>(eventName: EventName, event: Events[EventName] = {} as Events[EventName]) {
        console.log(`triggering ${eventName} with data`, event, 'on', this);
        this.listeners[eventName] && this.listeners[eventName].forEach(listener => listener(event));
    }
}
