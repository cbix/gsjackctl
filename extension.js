/* gsjackctl
 *
 * Copyright 2020 Florian Hülsmann <fh@cbix.de>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const {GObject, St, Gio} = imports.gi;

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
        box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.add_child(box);

        this.toggleJack = new PopupMenu.PopupMenuItem('...');
        this.jackRunning = false;

        try {
            jackctl = new JackControl();
            this.toggleJack.connect('activate', () => {
                if (this.jackRunning)
                    jackctl.StopServerSync();
                else
                    jackctl.StartServerSync();
            });

            jackctl.connectSignal('ServerStarted', () => {
                this.jackRunning = true;
                this.toggleJack.label.text = 'Stop JACK';
            });

            jackctl.connectSignal('ServerStopped', () => {
                this.jackRunning = false;
                this.toggleJack.label.text = 'Start JACK';
            });

            jackctl.IsStartedRemote(([running]) => {
                this.jackRunning = running;
                this.toggleJack.label.text = running ? 'Stop JACK' : 'Start JACK';
            });
        } catch (e) {
            log(e);
        }

        this.menu.addMenuItem(this.toggleJack);
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
