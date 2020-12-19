/* exported A2jControl */

/* gsjackctl
 *
 * Copyright 2020 Florian Hülsmann <fh@cbix.de>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const Local = imports.ui.main.extensionManager.lookup('gsjackctl@cbix.de');

const {Clutter, GObject} = imports.gi;
const PopupMenu = imports.ui.popupMenu;

const {A2j} = Local.imports.jack.a2jdbus;

var A2jControl = GObject.registerClass({
    Signals: {
    },
}, class A2jControl extends PopupMenu.PopupSubMenuMenuItem {
    _init() {
        super._init('ALSA MIDI Bridge');
        this._a2jStarted = false;

        try {
            // setup dbus
            this._a2j = new A2j();
            this._hwExport = new PopupMenu.PopupSwitchMenuItem('Export Hardware Ports', true);
            this._toggleStarted = new PopupMenu.PopupMenuItem('Start bridge');
            this.menu.addMenuItem(this._hwExport);
            this.menu.addMenuItem(this._toggleStarted);

            // connect signals
            this._hwExport.connect('toggled', (state) => {
                try {
                    this._a2j.set_hw_exportSync([state]);
                } catch (e) {
                    logError(e, 'gsjackctl.a2j.set_hw_export');
                }
            });

            this._toggleStarted.connect('activate', () => {
                if (this._a2jStarted)
                    this.stop();
                else
                    this.start();
            });

            this._a2j.connectSignal('bridge_started', () => {
                this.updateStatus();
            });

            this._a2j.connectSignal('bridge_stopped', () => {
                this.updateStatus();
            });

            // initial update
            this.updateStatus();
        } catch (e) {
            logError(e, 'gsjackctl.A2jControl.init');
            this.hide();
        }
    }

    start() {
        try {
            this._a2j.startSync();
            this.updateStatus();
        } catch (e) {
            logError(e, 'gsjackctl.A2jControl.start');
        }
    }

    stop() {
        try {
            this._a2j.stopSync();
            this.updateStatus();
        } catch (e) {
            logError(e, 'gsjackctl.A2jControl.stop');
        }
    }

    updateStatus() {
        const [started] = this._a2j.is_startedSync();
        const [hwExport] = this._a2j.get_hw_exportSync();
        this._hwExport.setToggleState(hwExport);
        this._a2jStarted = started;
        if (started) {
            this.label.text = 'ALSA MIDI bridge On';
            this._toggleStarted.label.text = 'Stop bridge';
            this._hwExport.reactive = false;
        } else {
            this.label.text = 'ALSA MIDI bridge Off';
            this._toggleStarted.label.text = 'Start bridge';
            this._hwExport.reactive = true;
        }
        return started;
    }
}
);

// vim: set sw=4 ts=4 :
