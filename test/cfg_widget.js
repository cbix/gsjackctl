#!/usr/bin/env -S gjs -I ..

imports.gi.versions.Gtk = '3.0';

const {GObject, Gtk, Pango} = imports.gi;

const {JackConfigure} = imports.jack.jackdbus;

const COL_KEY = 0,
    COL_VALUE = 1,
    COL_DEFAULT = 2,
    COL_DESC = 3,
    COL_LEAF = 4,
    COL_ISRANGE = 5,
    COL_ISSTRICT = 6,
    COL_ISFAKEVALUE = 7,
    COL_VALUES = 8;

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
        const jackcfg = new JackConfigure();
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
        colTypes[COL_LEAF] = GObject.TYPE_BOOLEAN;
        colTypes[COL_ISFAKEVALUE] = GObject.TYPE_BOOLEAN;
        colTypes[COL_ISRANGE] = GObject.TYPE_BOOLEAN;
        colTypes[COL_ISSTRICT] = GObject.TYPE_BOOLEAN;
        colTypes[COL_VALUES] = GObject.TYPE_VARIANT;

        this._treeStore.set_column_types(colTypes);

        /*
        const itA = this._treeStore.append(null);
        const itB = this._treeStore.append(null);
        const itFoo = this._treeStore.append(itA);
        const itBar = this._treeStore.append(itB);
        const itBaz = this._treeStore.append(itBar);

        this._treeStore.set(itA, [COL_KEY, COL_DESC, COL_LEAF], ['a', 'A', false]);
        this._treeStore.set(itB, [COL_KEY, COL_DESC, COL_LEAF], ['b', 'B', false]);
        this._treeStore.set(itFoo, [COL_KEY, COL_DESC, COL_LEAF], ['foo', 'Foo', true]);
        this._treeStore.set(itBar, [COL_KEY, COL_DESC, COL_LEAF], ['bar', 'Bar', false]);
        this._treeStore.set(itBaz, [COL_KEY, COL_DESC, COL_LEAF], ['baz', 'Baz', true]);
        */

        // adaptation of _fullConfigurationTree() traversing for TreeStore
        const pathStack = [[]],
            iterStack = [null];
        while (pathStack.length > 0) {
            const path = pathStack.pop();
            const iter = iterStack.pop() || null;
            const [isLeaf, nodes] = jackcfg.ReadContainerSync(path);

            // set leaf flag in store, except for root node
            if (iter)
                this._treeStore.set(iter, [COL_LEAF], [isLeaf]);

            if (!isLeaf) {
                nodes.forEach(node => {
                    const newPath = path.concat(node);
                    pathStack.push(newPath);
                    const newIter = this._treeStore.append(iter);
                    iterStack.push(newIter);
                    this._treeStore.set(newIter, [COL_KEY], [node]);
                });
            } else {
                nodes.forEach(node => {
                    const newPath = path.concat(node);
                    const [paramInfo] = jackcfg.GetParameterInfoSync(newPath);
                    // const paramValue = jackcfg.GetParameterValueSync(newPath);
                    const paramConstraint = jackcfg.GetParameterConstraintSync(newPath);
                    const newIter = this._treeStore.append(iter);
                    this._treeStore.set(newIter, [
                        COL_KEY,
                        COL_DESC,
                        COL_ISRANGE,
                        COL_ISRANGE,
                        COL_ISFAKEVALUE,
                    ], [
                        paramInfo[1],
                        paramInfo[2],
                        paramConstraint[0],
                        paramConstraint[1],
                        paramConstraint[2],
                    ]);
                });
            }
        }
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
                // test
                this._treeStore.set(it, [COL_ISSTRICT], [!rend.active]);

            // const currentState = this._treeStore.
        });

        colKey.pack_start(normalRenderer, true);
        colValue.pack_start(comboRenderer, true);
        colDefault.pack_start(comboRenderer, true);
        colDescription.pack_start(normalRenderer, true);
        colState.pack_start(toggleRenderer, true);

        colKey.add_attribute(normalRenderer, 'text', COL_KEY);
        colDescription.add_attribute(normalRenderer, 'text', COL_DESC);
        // TESTING
        // colState.add_attribute(toggleRenderer, 'active', COL_ISSTRICT);
        // colState.add_attribute(toggleRenderer, 'visible', COL_LEAF);

        this._treeView.insert_column(colKey, 0);
        this._treeView.insert_column(colDescription, 1);
        this._treeView.insert_column(colState, 2);

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
