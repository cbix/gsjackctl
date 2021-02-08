'use strict';

imports.gi.versions.Gtk = '3.0';

const {GLib, GObject, Gtk} = imports.gi;

let JackConfigure;

try {
    // const Local = imports.ui.main.extensionManager.lookup('gsjackctl@cbix.de');
    const ExtensionUtils = imports.misc.extensionUtils;
    const Local = ExtensionUtils.getCurrentExtension();
    JackConfigure = Local.imports.jack.jackdbus.JackConfigure;
} catch (e) {
    logError(e, 'gsjackctl.prefsWidget');
    JackConfigure = imports.jack.jackdbus.JackConfigure;
}

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

/**
 * CellRendererVariant is a custom Gtk.CellRenderer wrapping different cell
 * renderers and rendering one based on the parameter value and constraint.
 * bool → CellRendererToggle
 * numeric → CellRendererSpin
 * constraint values → CellRendererCombo
 * string → CellRendererText
 */
var CellRendererVariant = GObject.registerClass({
    GTypeName: 'CellRendererVariant',
    Properties: {
        'value': GObject.param_spec_variant('value', 'Value', 'Configuration Value', new GLib.VariantType('v'), null, GObject.ParamFlags.READWRITE),
        'default': GObject.param_spec_variant('default', 'Default', 'Default Configuration Value', new GLib.VariantType('v'), null, GObject.ParamFlags.READWRITE),
    },
}, class CellRendererVariant extends Gtk.CellRenderer {
    constructor(params) {
        super(params);
        this._textRenderer = new Gtk.CellRendererText();
        this._toggleRenderer = new Gtk.CellRendererToggle();
        this._comboRenderer = new Gtk.CellRendererCombo();
        this._spinRenderer = new Gtk.CellRendererSpin();
    }

    set value(value) {
        log(`set value: ${value}`);
        this._value = value;
        if (!value)
            return;

        log(`value type: ${value.type_string}`);
    }

    set default(value) {
        log(`set default: ${value}`);
        this._default = value;
        if (!value)
            return;

        log(`default type: ${value.type_string}`);
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
                        COL_VALUE,
                        COL_DEFAULT,
                        COL_VALUESTRING,
                        COL_DEFAULTSTRING,
                        COL_DESC,
                        COL_ISRANGE,
                        COL_ISRANGE,
                        COL_ISFAKEVALUE,
                    ], [
                        paramInfo[1],
                        paramValue[2],
                        paramValue[1],
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
        const colTest = new Gtk.TreeViewColumn({
            title: 'Test',
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
        colTest.pack_start(variantRenderer, true);

        colKey.add_attribute(normalRenderer, 'text', COL_KEY);
        colValue.add_attribute(normalRenderer, 'text', COL_VALUESTRING);
        colDefault.add_attribute(normalRenderer, 'text', COL_DEFAULTSTRING);
        colDescription.add_attribute(normalRenderer, 'text', COL_DESC);
        colTest.add_attribute(variantRenderer, 'value', COL_VALUE);
        colTest.add_attribute(variantRenderer, 'default', COL_DEFAULT);

        this._treeView.insert_column(colKey, 0);
        this._treeView.insert_column(colValue, 1);
        this._treeView.insert_column(colDefault, 2);
        this._treeView.insert_column(colDescription, 3);
        this._treeView.insert_column(colTest, 4);

        this.add(this._treeView);
        this.show_all();
    }
}
);

// vim: set sw=4 ts=4 :
