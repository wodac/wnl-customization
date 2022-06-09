///<reference path="packageMetadata.ts" />
///<reference path="globals.d.ts" />
///<reference path="App.ts" />
///<reference path="style.ts" />
(function () {
    'use strict';
    //@ts-ignore
    __SENTRY__.hub.getClient().getOptions().enabled = false;

    const app = new App()
    app.init()
})();