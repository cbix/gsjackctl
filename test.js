// gjs -I . test.js

const {GLib} = imports.gi;

const {JackControl, JackConfigure} = imports.jack.jackdbus;

try {
    print('JackControl:');
    const jackctl = new JackControl();
    for (const f in jackctl)
        print(f);

    print('JackConfigure:');
    const jackcfg = new JackConfigure();
    for (const f in jackcfg)
        print(f);

    jackctl.connectSignal('ServerStarted', proxy => {
        const sr = proxy.GetSampleRateSync();
        print(`Server started with sample rate ${sr} Hz`);
    });

    jackctl.connectSignal('ServerStopped', proxy => {
        print('Server stopped');
        print('Printing children of proxy');
    });

    const loop = new GLib.MainLoop(null, false);
    loop.run();
} catch (e) {
    logError(e);
}
