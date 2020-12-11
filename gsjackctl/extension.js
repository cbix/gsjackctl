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

var Extension = class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        this._jackctl = null;
        this._indicator = null;
        this._status = null;
        this._backgroundRunning = false;
    }

    enable() {
        log('Extension.enable()');
        try {
            // setup dbus
            log('setup dbus');
            this._jackctl = new JackControl();

            // setup widgets
            log('setup widgets');
            this._indicator = new Indicator();
            this._status = new Status();
            this._control = new Control();
            this._indicator.menu.addMenuItem(this._status);
            this._indicator.menu.addMenuItem(this._control);
            Main.panel.addToStatusArea(this._uuid, this._indicator);

            // connect signals
            log('connect signals');
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
                log('control.start-jack');
                try {
                    this._jackctl.StartServerSync();
                } catch (e) {
                    logError(e, 'gsjackctl.start-jack');
                    // TODO: make this a signal maybe?
                    this._status.setError(e);
                    this._indicator.setError(e);
                }
            });

            this._control.connect('stop-jack', () => {
                log('control.stop-jack');
                try {
                    this._jackctl.StopServerSync();
                } catch (e) {
                    logError(e, 'gsjackctl.stop-jack');
                    // TODO: make this a signal maybe?
                    this._status.setError(e);
                    this._indicator.setError(e);
                }
            });

            this._jackctl.connectSignal('ServerStarted', () => {
                log('jackctl.ServerStarted');
                this.startBackground();
            });

            this._jackctl.connectSignal('ServerStopped', () => {
                log('jackctl.ServerStopped');
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

                status = {started, rt, load, xruns, sr, latency, buffersize};
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
