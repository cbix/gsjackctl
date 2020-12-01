/* exported init */

/* gsjackctl
 *
 * Copyright 2020 Florian Hülsmann <fh@cbix.de>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const {GObject, St, Gio, GLib} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Me = ExtensionUtils.getCurrentExtension();

const {JackControl} = Me.imports.jack.jackdbus;

let jackctl = null;

const _customGIcon = iconName => {
    const path = Me.dir.get_child('icons').get_child(`${iconName}.svg`).get_path();
    return new Gio.FileIcon({file: Gio.File.new_for_path(path)});
};

const _iconJackStarted = _customGIcon('jack-started-symbolic');
const _iconJackStopped = _customGIcon('jack-stopped-symbolic');
const _iconJackError = _customGIcon('jack-error-symbolic');
const _iconJackXruns = _customGIcon('jack-xruns-symbolic');

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'JACK Control');

        this._backgroundRunning = false;

        this._icon = new St.Icon({
            gicon: _iconJackStopped,
            style_class: 'system-status-icon',
        });

        const box = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        box.add_child(this._icon);
        this.add_child(box);

        this._jackStatus = new PopupMenu.PopupMenuItem('...', {
            reactive: false,
        });
        this._toggleJack = new PopupMenu.PopupMenuItem('Start JACK');
        this.jackRunning = false;
        this._resetXruns = new PopupMenu.PopupMenuItem('Reset Xruns');

        try {
            jackctl = new JackControl();
            this._toggleJack.connect('activate', () => {
                try {
                    if (this.jackRunning)
                        jackctl.StopServerSync();
                    else
                        jackctl.StartServerSync();
                } catch (e) {
                    logError(e, 'gsjackctl toggleJack');
                    this._jackStatus.label.text = `Error: ${e.message}`;
                    this._icon.gicon = _iconJackError;
                }
            });

            this._resetXruns.connect('activate', () => {
                jackctl.ResetXrunsRemote(() => {
                    this.updateStatus();
                });
            });

            const startBackground = (interval = 2000) => {
                if (this.updateStatus() && !this._backgroundRunning) {
                    this._backgroundRunning = true;
                    GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
                        this._backgroundRunning = this.updateStatus();
                        return this._backgroundRunning;
                    });
                }
            };

            jackctl.connectSignal('ServerStarted', () => {
                startBackground();
            });
            jackctl.connectSignal('ServerStopped', () => {
                this.updateStatus();
            });

            startBackground();
        } catch (e) {
            logError(e, 'gsjackctl init');
            this._icon.gicon = _iconJackError;
        }

        this.menu.addMenuItem(this._jackStatus, 0);
        this.menu.addMenuItem(this._resetXruns, 1);
        this.menu.addMenuItem(this._toggleJack, 2);
    }

    updateStatus() {
        try {
            const [started] = jackctl.IsStartedSync();
            this.jackRunning = started;
            if (started) {
                const [load] = jackctl.GetLoadSync();
                const [xruns] = jackctl.GetXrunsSync();
                const [sr] = jackctl.GetSampleRateSync();
                const [latency] = jackctl.GetLatencySync();
                const [buffersize] = jackctl.GetBufferSizeSync();
                const [rt] = jackctl.IsRealtimeSync();
                this._jackStatus.label.text = `Running${rt ? ' (RT)' : ''}
Load: ${load.toFixed(1)} %
Xruns: ${xruns}
Samplerate: ${sr / 1000} kHz
Block latency: ${latency.toFixed(1)} ms
Buffer size: ${buffersize}`;
                if (xruns > 0)
                    this._icon.gicon = _iconJackXruns;
                else
                    this._icon.gicon = _iconJackStarted;

                this._toggleJack.label.text = 'Stop JACK';
            } else {
                this._jackStatus.label.text = 'Stopped';
                this._toggleJack.label.text = 'Start JACK';
                this._icon.gicon = _iconJackStopped;
            }
            return started;
        } catch (e) {
            logError(e, 'gsjackctl updateStatus');
            this._jackStatus.label.text = `Error: ${e.message}`;
            this._icon.gicon = _iconJackError;
            return false;
        }
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

/**
 * @param {Meta} meta metadata passed by the extension runtime environment
 * @returns {Extension} Extension object
 */
function init(meta) {
    return new Extension(meta.uuid);
}

// vim: set sw=4 ts=4 :
