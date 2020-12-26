'use strict';

imports.gi.versions.Gtk = '3.0';

const {GLib, GObject, Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Local = ExtensionUtils.getCurrentExtension();

const {JackConfigure} = Local.imports.jack.jackdbus;

const COL_KEY = 0,
    COL_VALUE = 1,
    COL_DEFAULT = 2,
    COL_DESC = 3,
    COL_LEAF = 4,
    COL_ISRANGE = 5,
    COL_ISSTRICT = 6,
    COL_ISFAKEVALUE = 7,
    COL_VALUES = 8,
    COL_VALUESTRING = 9,
    COL_DEFAULTSTRING = 10;


// Like `extension.js` this is used for any one-time setup like translations.
function init() {
    log('initializing gsjackctl Preferences');
}

var CellRendererVariant = GObject.registerClass(
class CellRendererVariant extends Gtk.CellRenderer {
    constructor(params) {
        super(params);
        this._textRenderer = new Gtk.CellRendererText();
        this._toggleRenderer = new Gtk.CellRendererToggle();
        this._comboRenderer = new Gtk.CellRendererCombo();
        this._spinRenderer = new Gtk.CellRendererSpin();
    }
}
);

var PrefsWidget = GObject.registerClass(
class PrefsWidget extends Gtk.ScrolledWindow {
    _init(params) {
        super._init(params);

        this._jackcfg = new JackConfigure();

        log('building prefs widget...');

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
        colTypes[COL_VALUESTRING] = GObject.TYPE_STRING;
        colTypes[COL_DEFAULTSTRING] = GObject.TYPE_STRING;

        this._treeStore.set_column_types(colTypes);

        // adaptation of _fullConfigurationTree() traversing for TreeStore
        const pathStack = [[]],
            iterStack = [null];
        while (pathStack.length > 0) {
            const path = pathStack.pop();
            const iter = iterStack.pop() || null;
            const [isLeaf, nodes] = this._jackcfg.ReadContainerSync(path);

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
                    const [paramInfo] = this._jackcfg.GetParameterInfoSync(newPath);
                    const paramValue = this._jackcfg.GetParameterValueSync(newPath);
                    const paramConstraint = this._jackcfg.GetParameterConstraintSync(newPath);
                    const newIter = this._treeStore.append(iter);
                    this._treeStore.set(newIter, [
                        COL_KEY,
                        COL_VALUESTRING,
                        COL_DEFAULTSTRING,
                        COL_DESC,
                        COL_ISRANGE,
                        COL_ISRANGE,
                        COL_ISFAKEVALUE,
                    ], [
                        paramInfo[1],
                        `${paramValue[2].get_type_string()}:${paramValue[2].print(false)}`,
                        `${paramValue[1].get_type_string()}:${paramValue[1].print(false)}`,
                        paramInfo[2],
                        paramConstraint[0],
                        paramConstraint[1],
                        paramConstraint[2],
                    ]);
                });
            }
        }

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

        // dynamic renderer
        const variantRenderer = new CellRendererVariant();

        const normalRenderer = new Gtk.CellRendererText();
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
        colValue.pack_start(normalRenderer, true);
        colDefault.pack_start(normalRenderer, true);
        colDescription.pack_start(normalRenderer, true);
        colState.pack_start(toggleRenderer, true);

        colKey.add_attribute(normalRenderer, 'text', COL_KEY);
        colValue.add_attribute(normalRenderer, 'text', COL_VALUESTRING);
        colDefault.add_attribute(normalRenderer, 'text', COL_DEFAULTSTRING);
        colDescription.add_attribute(normalRenderer, 'text', COL_DESC);

        this._treeView.insert_column(colKey, 0);
        this._treeView.insert_column(colValue, 1);
        this._treeView.insert_column(colDefault, 2);
        this._treeView.insert_column(colDescription, 3);
        this._treeView.insert_column(colState, 4);

        this.add(this._treeView);
        this.show_all();
    }
}
);

function buildPrefsWidget() {
    const widget = new PrefsWidget();
    widget.show_all();
    return widget;
}

// vim: set sw=4 ts=4 :
