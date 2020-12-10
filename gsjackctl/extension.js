/* exported Extension */

/* gsjackctl
 *
 * Copyright 2020 Florian Hülsmann <fh@cbix.de>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const Local = imports.ui.main.extensionManager.lookup('gsjackctl@cbix.de');

const {GObject} = imports.gi;
const Main = imports.ui.main;

const {Indicator} = Local.imports.gsjackctl.indicator;
const {JackControl} = Local.imports.jack.jackdbus;

var Extension = class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        this._jackctl = null;

    }

    enable() {
        try {
            this._jackctl = new JackControl();
            this._indicator = new Indicator();
            Main.panel.addToStatusArea(this._uuid, this._indicator);
        } catch (e) {
            logError(e, 'gsjackctl.Extension');
            throw e;
        }
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
};

// vim: set sw=4 ts=4 :
