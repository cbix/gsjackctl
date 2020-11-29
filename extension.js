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

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'JACK Control');

        const box = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        box.add_child(new St.Icon({
            gicon: _customGIcon('jack-plug-symbolic'),
            style_class: 'system-status-icon',
        }));
        // box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.add_child(box);

        this.jackStatus = new PopupMenu.PopupMenuItem('...', {
            reactive: false,
        });
        this.toggleJack = new PopupMenu.PopupMenuItem('Start JACK');
        this.jackRunning = false;

        try {
            jackctl = new JackControl();
            this.toggleJack.connect('activate', () => {
                if (this.jackRunning)
                    jackctl.StopServerRemote();
                else
                    jackctl.StartServerRemote();
            });

            const startBackground = (interval = 5000) => {
                if (this.updateStatus()) {
                    GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
                        return this.updateStatus();
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
        }

        this.menu.addMenuItem(this.jackStatus);
        this.menu.addMenuItem(this.toggleJack);
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
                this.jackStatus.label.text = `Running${rt ? ' (RT)' : ''}
Load: ${load.toFixed(2)}
Xruns: ${xruns}
Samplerate: ${sr} Hz
Block latency: ${latency.toFixed(2)} ms
Buffer size: ${buffersize}`;
                this.toggleJack.label.text = 'Stop JACK';
            } else {
                this.jackStatus.label.text = 'Stopped';
                this.toggleJack.label.text = 'Start JACK';
            }
            return started;
        } catch (e) {
            logError(e, 'gsjackctl updateStatus');
            this.jackStatus.label.text = `Error: ${e}`;
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
