/* exported Extension */

/* gsjackctl
 *
 * Copyright 2020 Florian Hülsmann <fh@cbix.de>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const Local = imports.ui.main.extensionManager.lookup('gsjackctl@cbix.de');

const {GLib, GObject} = imports.gi;
const Main = imports.ui.main;

const {Indicator} = Local.imports.gsjackctl.indicator;
const {Status} = Local.imports.gsjackctl.status;
const {Control} = Local.imports.gsjackctl.control;
const {JackControl} = Local.imports.jack.jackdbus;
const {A2j} = Local.imports.jack.a2jdbus;

var Extension = class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        this._jackctl = null;
        this._indicator = null;
        this._status = null;
        this._buffersize = 256;
        this._backgroundRunning = false;

        // TODO make this configurable
        this._a2jAutostart = true;
    }

    enable() {
        try {
            // setup dbus
            this._jackctl = new JackControl();
            this._a2j = new A2j();

            // initial configuration
            try {
                this._a2j.set_hw_exportRemote([true]);
            } catch (e) {
                logError(e, 'gsjackctl.a2j.set_hw_export');
            }

            // setup widgets
            this._indicator = new Indicator();
            this._status = new Status();
            this._control = new Control();
            this._indicator.menu.addMenuItem(this._status);
            this._indicator.menu.addMenuItem(this._control);
            Main.panel.addToStatusArea(this._uuid, this._indicator);

            // connect signals
            this._status.connect('decrease-buffersize', () => {
                log('status.decrease-buffersize');
                try {
                    const bs = Math.max(8, Math.pow(2, Math.floor(Math.log2(this._buffersize)) - 1));
                    this._jackctl.SetBufferSizeRemote([bs], () => {
                        this.updateStatus();
                    });
                } catch (e) {
                    logError(e, 'gsjackctl.decrease-buffersize');
                }
            });

            this._status.connect('increase-buffersize', () => {
                log('status.increase-buffersize');
                try {
                    const bs = Math.min(8192, Math.pow(2, Math.ceil(Math.log2(this._buffersize)) + 1));
                    this._jackctl.SetBufferSizeRemote([bs], () => {
                        this.updateStatus();
                    });
                } catch (e) {
                    logError(e, 'gsjackctl.increase-buffersize');
                }
            });

            this._status.connect('clear-xruns', () => {
                log('status.clear-xruns');
                try {
                    this._jackctl.ResetXrunsRemote(() => {
                        this.updateStatus();
                    });
                } catch (e) {
                    logError(e, 'gsjackctl.clear-xruns');
                }
            });

            this._control.connect('start-jack', () => {
                try {
                    this._jackctl.StartServerSync();
                    if (this._a2jAutostart) {
                        this._a2j.set_hw_exportSync([true]);
                        this._a2j.startSync();
                    }
                } catch (e) {
                    logError(e, 'gsjackctl.start-jack');
                    // TODO: make this a signal maybe?
                    this._status.setError(e);
                    this._indicator.setError(e);
                }
            });

            this._control.connect('stop-jack', () => {
                if (this._a2jAutostart) {
                    try {
                        this._a2j.stopSync();
                    } catch (e) {
                        logError(e, 'gsjackctl.stop-jack a2j.stop');
                    }
                }
                try {
                    this._jackctl.StopServerSync();
                } catch (e) {
                    logError(e, 'gsjackctl.stop-jack jackctl.StopServer');
                    // TODO: make this a signal maybe?
                    this._status.setError(e);
                    this._indicator.setError(e);
                }
            });

            this._jackctl.connectSignal('ServerStarted', () => {
                this.startBackground();
            });

            this._jackctl.connectSignal('ServerStopped', () => {
                this.updateStatus();
            });

            this._a2j.connectSignal('bridge-started', () => {
                this.updateStatus();
            });

            this._a2j.connectSignal('bridge-stopped', () => {
                this.updateStatus();
            });

            // everything is set up, now refresh status periodically if/while JACK is started
            this.startBackground();
        } catch (e) {
            logError(e, 'gsjackctl.Extension');
            throw e;
        }
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }

    updateStatus() {
        try {
            const [started] = this._jackctl.IsStartedSync();
            this._jackRunning = started;
            let status = {started};
            if (started) {
                const [rt] = this._jackctl.IsRealtimeSync();
                const [load] = this._jackctl.GetLoadSync();
                const [xruns] = this._jackctl.GetXrunsSync();
                const [sr] = this._jackctl.GetSampleRateSync();
                const [latency] = this._jackctl.GetLatencySync();
                const [buffersize] = this._jackctl.GetBufferSizeSync();
                const [a2j] = this._a2j.is_startedSync();

                status = {started, rt, load, xruns, sr, latency, buffersize, a2j};
                this._buffersize = Math.min(8192, Math.max(8, buffersize));
            }

            this._status.setStatus(status);
            this._indicator.setStatus(status);
            this._control.setStatus(status);

            return started;
        } catch (e) {
            logError(e, 'gsjackctl updateStatus');
            this._status.setError(e);
            this._indicator.setError(e);

            return false;
        }
    }

    startBackground(interval = 2000) {
        if (this.updateStatus() && !this._backgroundRunning) {
            this._backgroundRunning = true;
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
                this._backgroundRunning = this.updateStatus();
                return this._backgroundRunning;
            });
        }
    }
};

// vim: set sw=4 ts=4 :
