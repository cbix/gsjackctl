/* exported Indicator */

/* gsjackctl
 *
 * Copyright 2020 Florian Hülsmann <fh@cbix.de>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const Local = imports.ui.main.extensionManager.lookup('gsjackctl@cbix.de');

const {Clutter, GObject, St, Gio, GLib} = imports.gi;
const PanelMenu = imports.ui.panelMenu;

const _customGIcon = iconName => {
    const path = Local.dir.get_child('icons').get_child(`${iconName}.svg`).get_path();
    return new Gio.FileIcon({file: Gio.File.new_for_path(path)});
};

var Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'JACK Control');

        // get custom icons
        this._iconJackStarted = _customGIcon('jack-started-symbolic');
        this._iconJackStopped = _customGIcon('jack-stopped-symbolic');
        this._iconJackError = _customGIcon('jack-error-symbolic');
        this._iconJackXruns = _customGIcon('jack-xruns-symbolic');

        this._icon = new St.Icon({
            gicon: this._iconJackStopped,
            style_class: 'system-status-icon',
        });

        // create a box layout for the status icon
        // FIXME: do we even need this?
        const indicatorBox = new St.BoxLayout({
            style_class: 'panel-status-menu-box',
        });
        indicatorBox.add_child(this._icon);
        this.add_child(indicatorBox);
    }

    setStatus(status) {
        // log('Indicator.setStatus', JSON.stringify(status));
        if (status.started) {
            if (status.xruns > 0)
                this._icon.gicon = this._iconJackXruns;
            else
                this._icon.gicon = this._iconJackStarted;

        } else {
            this._icon.gicon = this._iconJackStopped;
        }
    }

    setError(e) {
        this._icon.gicon = this._iconJackError;
    }
}
);

// vim: set sw=4 ts=4 :
