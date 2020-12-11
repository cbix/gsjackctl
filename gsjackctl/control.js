/* exported Control */

/* gsjackctl
 *
 * Copyright 2020 Florian Hülsmann <fh@cbix.de>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const Local = imports.ui.main.extensionManager.lookup('gsjackctl@cbix.de');

const {Clutter, GObject} = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const ModalDialog = imports.ui.modalDialog;
const Dialog = imports.ui.dialog;

// TODO: use a different or custom widget here
var Control = GObject.registerClass({
    Signals: {
        'start-jack': {},
        'stop-jack': {},
    },
}, class Control extends PopupMenu.PopupMenuItem {
    _init() {
        super._init('...');

        this._jackStarted = false;

        // connect signals
        this.connect('activate', () => {
            if (this._jackStarted)
                this.confirmStopServer();
            else
                this.emit('start-jack');
        });
    }

    setStatus(status) {
        this._jackStarted = status.started;
        if (status.started)
            this.label.text = 'Stop JACK';
        else
            this.label.text = 'Start JACK';
    }

    confirmStopServer() {
        const modal = new ModalDialog.ModalDialog();
        const content = new Dialog.MessageDialogContent({
            title: 'Stop JACK?',
            description: 'Are you sure you want to stop the JACK server?',
        });
        modal.contentLayout.add_child(content);
        modal.addButton({
            label: 'Yes',
            action: () => {
                this.emit('stop-jack');
                modal.close();
            },
            default: false,
            key: Clutter.KEY_Escape,
        });
        modal.addButton({
            label: 'No',
            action: () => {
                modal.close();
            },
            default: true,
            key: Clutter.KEY_Escape,
        });
        modal.open();
    }
}
);

// vim: set sw=4 ts=4 :
