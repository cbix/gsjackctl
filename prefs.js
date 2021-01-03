'use strict';

imports.gi.versions.Gtk = '3.0';

const ExtensionUtils = imports.misc.extensionUtils;
const Local = ExtensionUtils.getCurrentExtension();

const {PrefsWidget} = Local.imports.gsjackctl.prefsWidget;

function init() {
    log('initializing gsjackctl Preferences');
}

function buildPrefsWidget() {
    const widget = new PrefsWidget();
    widget.show_all();
    return widget;
}

// vim: set sw=4 ts=4 :
