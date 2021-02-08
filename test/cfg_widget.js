#!/usr/bin/env -S gjs -I ..

imports.gi.versions.Gtk = '3.0';

const {Gtk} = imports.gi;

const {PrefsWidget} = imports.gsjackctl.prefsWidget;

class TestWindow {
    constructor() {
        this.application = new Gtk.Application({
            application_id: 'de.cbix.gsjackctl.prefswindow',
        });
        this.application.connect('activate', this._onActivate.bind(this));
        this.application.connect('startup', this._onStartup.bind(this));
    }

    _onActivate() {
        this._window.present();
    }

    _onStartup() {
        this._buildUI();
    }

    _buildUI() {
        this._window = new Gtk.ApplicationWindow({
            application: this.application,
            window_position: Gtk.WindowPosition.CENTER,
            default_height: 250,
            default_width: 100,
            title: 'gsjackctl prefs window test',
        });

        const widget = new PrefsWidget();
        widget.show_all();

        this._window.add(widget);
        this._window.show_all();
    }
}

try {
    // const Prefs = imports.prefs;
    try {
        print('test widget window');

        const app = new TestWindow();
        app.application.run(ARGV);
    } catch (e) {
        logError(e);
    }
} catch (e) {
    print(e.message);
}

// vim: set sw=4 ts=4 :
