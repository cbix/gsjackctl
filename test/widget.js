#!/usr/bin/env -S gjs -I ..

imports.gi.versions.Gtk = '3.0';

const {GObject, Gtk, Pango} = imports.gi;

const COL_KEY = 0,
    COL_VALUE = 1,
    COL_DEFAULT = 2,
    COL_DESC = 3,
    COL_STATE = 4;

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

        this._treeStore = new Gtk.TreeStore();
        const colTypes = [];
        colTypes[COL_KEY] = GObject.TYPE_STRING;
        colTypes[COL_VALUE] = GObject.TYPE_VARIANT;
        colTypes[COL_DEFAULT] = GObject.TYPE_VARIANT;
        colTypes[COL_DESC] = GObject.TYPE_STRING;
        colTypes[COL_STATE] = GObject.TYPE_BOOLEAN;

        this._treeStore.set_column_types(colTypes);

        const itA = this._treeStore.append(null);
        const itB = this._treeStore.append(null);
        const itFoo = this._treeStore.append(itA);
        const itBar = this._treeStore.append(itB);
        const itBaz = this._treeStore.append(itBar);

        this._treeStore.set(itA, [COL_KEY, COL_DESC], ['a', 'A']);
        this._treeStore.set(itB, [COL_KEY, COL_DESC], ['b', 'B']);
        this._treeStore.set(itFoo, [COL_KEY, COL_DESC], ['foo', 'Foo']);
        this._treeStore.set(itBar, [COL_KEY, COL_DESC], ['bar', 'Bar']);
        this._treeStore.set(itBaz, [COL_KEY, COL_DESC], ['baz', 'Baz']);

        this._comboStore = new Gtk.ListStore();
        this._comboStore.set_column_types([
            GObject.TYPE_STRING,
            GObject.TYPE_STRING,
        ]);
        this._comboStore.set(this._comboStore.append(), [0, 1], ['es', 'Spain']);
        this._comboStore.set(this._comboStore.append(), [0, 1], ['pt', 'Portugal']);
        this._comboStore.set(this._comboStore.append(), [0, 1], ['de', 'Germany']);
        this._comboStore.set(this._comboStore.append(), [0, 1], ['pl', 'Poland']);
        this._comboStore.set(this._comboStore.append(), [0, 1], ['sv', 'Sweden']);

        this._treeView = new Gtk.TreeView({
            expand: true,
            model: this._treeStore,
        });

        const colKey = new Gtk.TreeViewColumn({title: 'Key'});
        const colValue = new Gtk.TreeViewColumn({title: 'Value'});
        const colDefault = new Gtk.TreeViewColumn({title: 'Default'});
        const colDescription = new Gtk.TreeViewColumn({title: 'Description'});
        const colState = new Gtk.TreeViewColumn({
            title: 'State',
        });

        const normalRenderer = new Gtk.CellRendererText();
        const comboRenderer = new Gtk.CellRendererCombo({
            model: this._comboStore,
        });
        const toggleRenderer = new Gtk.CellRendererToggle({
            activatable: true,
        });
        toggleRenderer.connect('toggled', (rend, path) => {
            const [ok, it] = this._treeStore.get_iter_from_string(path);
            print(`toggled: ${rend.active}, ${ok}`);
            if (ok)
                this._treeStore.set(it, [COL_STATE], [!rend.active]);

            // const currentState = this._treeStore.
        });

        colKey.pack_start(normalRenderer, true);
        colValue.pack_start(comboRenderer, true);
        colDefault.pack_start(comboRenderer, true);
        colDescription.pack_start(normalRenderer, true);
        colState.pack_start(toggleRenderer, true);

        colKey.add_attribute(normalRenderer, 'text', COL_KEY);
        colDescription.add_attribute(normalRenderer, 'text', COL_DESC);
        colState.add_attribute(toggleRenderer, 'active', COL_STATE);

        this._treeView.insert_column(colKey, COL_KEY);
        this._treeView.insert_column(colValue, COL_VALUE);
        this._treeView.insert_column(colDefault, COL_DEFAULT);
        this._treeView.insert_column(colDescription, COL_DESC);
        this._treeView.insert_column(colState, COL_STATE);

        this._window.add(this._treeView);
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
