'use strict';

imports.gi.versions.Gtk = '3.0';

const {GLib, GObject, Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


// Like `extension.js` this is used for any one-time setup like translations.
function init() {
    log(`initializing ${Me.metadata.name} Preferences`);
}

var PrefsWidget = GObject.registerClass(
class PrefsWidget extends Gtk.Grid {
    _init(params) {
        super._init(params);

        log('building prefs widget...');

        // example from https://developer.gnome.org/gnome-devel-demos/stable/treeview_simple_liststore.js.html.en

        // Create the underlying liststore for the phonebook
        this._listStore = new Gtk.ListStore();
        this._listStore.set_column_types([
            GObject.TYPE_STRING,
            GObject.TYPE_STRING,
            GObject.TYPE_STRING,
            GObject.TYPE_STRING,
        ]);

        // Data to go in the phonebook
        this._phonebook =
            [{name: 'Jurg', surname: 'Billeter', phone: '555-0123',
                description: 'A friendly person.'},
            {name: 'Johannes', surname: 'Schmid', phone: '555-1234',
                description: 'Easy phone number to remember.'},
            {name: 'Julita', surname: 'Inca', phone: '555-2345',
                description: 'Another friendly person.'},
            {name: 'Javier', surname: 'Jardon', phone: '555-3456',
                description: 'Bring fish for his penguins.'},
            {name: 'Jason', surname: 'Clinton', phone: '555-4567',
                description: "His cake's not a lie."},
            {name: 'Random J.', surname: 'Hacker', phone: '555-5678',
                description: 'Very random!'}];

        log(`_phonebook = ${JSON.stringify(this._phonebook)}`);

        // Put the data in the phonebook
        for (let i = 0; i < this._phonebook.length; i++) {
            const contact = this._phonebook[i];
            this._listStore.set(this._listStore.append(), [0, 1, 2, 3],
                [contact.name, contact.surname, contact.phone, contact.description]);
        }

        log(`_listStore = ${JSON.stringify(this._listStore)}`);

        // Create the treeview
        this._treeView = new Gtk.TreeView({expand: true,
            model: this._listStore});

        log(`_treeView = ${JSON.stringify(this._treeView)}`);

        // Create the columns for the address book
        this._firstName = new Gtk.TreeViewColumn({title: 'First Name'});
        this._lastName = new Gtk.TreeViewColumn({title: 'Last Name'});
        this._phone = new Gtk.TreeViewColumn({title: 'Phone Number'});

        // Create a cell renderer for when bold text is needed
        // const bold = new Gtk.CellRendererText({weight: Pango.Weight.BOLD});

        // Create a cell renderer for normal text
        this._normal = new Gtk.CellRendererText();

        // Pack the cell renderers into the columns
        this._firstName.pack_start(this._normal, true);
        this._lastName.pack_start(this._normal, true);
        this._phone.pack_start(this._normal, true);

        // Set each column to pull text from the TreeView's model
        this._firstName.add_attribute(this._normal, 'text', 0);
        this._lastName.add_attribute(this._normal, 'text', 1);
        this._phone.add_attribute(this._normal, 'text', 2);

        // Insert the columns into the treeview
        this._treeView.insert_column(this._firstName, 0);
        this._treeView.insert_column(this._lastName, 1);
        this._treeView.insert_column(this._phone, 2);

        // Create the label that shows details for the name you select
        this._label = new Gtk.Label({label: ''});

        // Get which item is selected
        this._selection = this._treeView.get_selection();

        // When something new is selected, call _on_changed
        this._selection.connect('changed', () => {
            const [, , iter] = this._selection.get_selected();

            // Set the label to read off the values stored in the current selection
            this._label.set_label('\n' +
            this._listStore.get_value(iter, 0) + ' ' +
            this._listStore.get_value(iter, 1) + ' ' +
            this._listStore.get_value(iter, 2) + '\n' +
            this._listStore.get_value(iter, 3)
            );

        });
        this.attach(this._treeView, 0, 0, 1, 1);
        this.attach(this._label, 0, 1, 1, 1);
    }
}
);

function buildPrefsWidget() {
    const widget = new PrefsWidget();
    widget.show_all();
    return widget;
}

// vim: set sw=4 ts=4 :
