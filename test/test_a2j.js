#!/usr/bin/env -S gjs -I ..

try {
    const {GLib} = imports.gi;

    const {A2j} = imports.jack.a2jdbus;

    try {
        print('a2j:');
        const a2j = new A2j();
        for (const f in a2j)
            print(f);

        a2j.connectSignal('bridge_started', proxy => {
            print('a2jmidid bridge started');
        });

        a2j.connectSignal('bridge_stopped', proxy => {
            print('a2jmidid bridge stopped');
        });

        const loop = new GLib.MainLoop(null, false);
        loop.run();
    } catch (e) {
        logError(e);
    }
} catch (e) {
    print(e.message);
}

// vim: set sw=4 ts=4 :
