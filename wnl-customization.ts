///<reference path="packageMetadata.ts" />
///<reference path="globals.d.ts" />
///<reference path="App.ts" />
///<reference path="style.ts" />
(function () {
    'use strict';
    try {
        //@ts-ignore
        __SENTRY__.hub.getClient().getOptions().enabled = false;
    } catch (err) {}
    
    const app = new App()
    app.init()
    console.log({app})
})();