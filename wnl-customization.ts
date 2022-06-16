import './globals'
import App from './App'
(function () {
    'use strict';
    try {
        //@ts-ignore
        __SENTRY__.hub.getClient().getOptions().enabled = false;

    } catch (err) {}

    if (unsafeWindow.top != unsafeWindow.self) {
        return //in iframe
    }
    
    const app = new App()
    app.init()
    console.log({app})
})();
