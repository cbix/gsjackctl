/* exported Indicator */

/* gsjackctl
 *
 * Copyright 2020 Florian Hülsmann <fh@cbix.de>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const Local = imports.ui.main.extensionManager.lookup('gsjackctl@cbix.de');

const {Clutter, GObject, St, Gio, GLib} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ModalDialog = imports.ui.modalDialog;
const Dialog = imports.ui.dialog;

const {JackControl} = Local.imports.jack.jackdbus;
const {Status} = Local.imports.gsjackctl.status;

let jackctl = null;

const _customGIcon = iconName => {
    const path = Local.dir.get_child('icons').get_child(`${iconName}.svg`).get_path();
    return new Gio.FileIcon({file: Gio.File.new_for_path(path)});
};

const _iconJackStarted = _customGIcon('jack-started-symbolic');
const _iconJackStopped = _customGIcon('jack-stopped-symbolic');
const _iconJackError = _customGIcon('jack-error-symbolic');
const _iconJackXruns = _customGIcon('jack-xruns-symbolic');

var Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'JACK Control');

        this._backgroundRunning = false;

        this._icon = new St.Icon({
            gicon: _iconJackStopped,
            style_class: 'system-status-icon',
        });

        const clearXrunsIcon = new St.Icon({
            icon_name: 'edit-clear-symbolic',
            style_class: 'popup-menu-icon warning',
        });
        this._clearXrunsButton = new St.Button({
            child: clearXrunsIcon,
            style_class: 'gsjackctl-xruns-button button',
        });

        this._clearXrunsButton.connect('clicked', () => {
            try {
                jackctl.ResetXrunsRemote(() => {
                    this.updateStatus();
                });
            } catch (e) {
                logError(e, 'gsjackctl clearXrunsButton.clicked');
            }
        });

        // create a box layout for the status icon
        const indicatorBox = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        indicatorBox.add_child(this._icon);
        this.add_child(indicatorBox);

        this._jackStatus = new PopupMenu.PopupMenuItem('...', {
            reactive: false,
        });
        this._toggleJack = new PopupMenu.PopupMenuItem('Start JACK');
        this.jackRunning = false;

        // MenuItem for xrun counter + clear button
        this._resetXruns = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
            style_class: 'gsjackctl-xruns',
        });
        const resetXrunsContainer = new St.BoxLayout();
        this._resetXruns.add_child(resetXrunsContainer);
        this._resetXrunsLabel = new St.Label({
            text: '0 xruns',
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'gsjackctl-xruns-label',
        });
        resetXrunsContainer.add_child(this._resetXrunsLabel);
        resetXrunsContainer.add_child(this._clearXrunsButton);

        try {
            jackctl = new JackControl();
            this._toggleJack.connect('activate', () => {
                try {
                    if (this.jackRunning)
                        this.confirmStopServer();
                    else
                        jackctl.StartServerSync();
                } catch (e) {
                    logError(e, 'gsjackctl toggleJack');
                    this._jackStatus.label.text = `Error: ${e.message}`;
                    this._icon.gicon = _iconJackError;
                }
            });

            const startBackground = (interval = 2000) => {
                if (this.updateStatus() && !this._backgroundRunning) {
                    this._backgroundRunning = true;
                    GLib.timeout_add(GLib.PRIORITY_DEFAULT, interval, () => {
                        this._backgroundRunning = this.updateStatus();
                        return this._backgroundRunning;
                    });
                }
            };

            jackctl.connectSignal('ServerStarted', () => {
                startBackground();
            });
            jackctl.connectSignal('ServerStopped', () => {
                this.updateStatus();
            });

            startBackground();
        } catch (e) {
            logError(e, 'gsjackctl init');
            this._icon.gicon = _iconJackError;
        }

        try {
            this._statusItem = new Status();

            this.menu.addMenuItem(this._jackStatus, 0);
            this.menu.addMenuItem(this._resetXruns, 1);
            this.menu.addMenuItem(this._toggleJack, 2);
            this.menu.addMenuItem(this._statusItem, 3);
        } catch (e) {
            logError(e, 'gsjackctl addMenuItem');
        }
    }

    updateStatus() {
        try {
            const [started] = jackctl.IsStartedSync();
            this.jackRunning = started;
            this._resetXruns.visible = started;
            if (started) {
                const [load] = jackctl.GetLoadSync();
                const [xruns] = jackctl.GetXrunsSync();
                const [sr] = jackctl.GetSampleRateSync();
                const [latency] = jackctl.GetLatencySync();
                const [buffersize] = jackctl.GetBufferSizeSync();
                const [rt] = jackctl.IsRealtimeSync();
                this._resetXrunsLabel.text = `${xruns} xrun${xruns === 1 ? '' : 's'}`;
                this._clearXrunsButton.visible = (xruns > 0);
                this._jackStatus.label.text = `Running${rt ? ' (RT)' : ''}
Load: ${load.toFixed(1)} %
Samplerate: ${sr / 1000} kHz
Block latency: ${latency.toFixed(1)} ms
Buffer size: ${buffersize}`;
                if (xruns > 0) {
                    this._resetXruns.add_style_class_name('has-xruns');
                    this._icon.gicon = _iconJackXruns;
                } else {
                    this._resetXruns.remove_style_class_name('has-xruns');
                    this._icon.gicon = _iconJackStarted;
                }

                this._toggleJack.label.text = 'Stop JACK';
            } else {
                this._jackStatus.label.text = 'Stopped';
                this._toggleJack.label.text = 'Start JACK';
                this._icon.gicon = _iconJackStopped;
            }
            return started;
        } catch (e) {
            logError(e, 'gsjackctl updateStatus');
            this._jackStatus.label.text = `Error: ${e.message}`;
            this._icon.gicon = _iconJackError;
            return false;
        }
    }

    confirmStopServer() {
        const stopConfirmationModal = new ModalDialog.ModalDialog();
        const stopConfirmationContent = new Dialog.MessageDialogContent({
            title: 'Stop JACK?',
            description: 'Are you sure you want to stop the JACK server?',
        });
        stopConfirmationModal.contentLayout.add_child(stopConfirmationContent);
        stopConfirmationModal.addButton({
            label: 'Yes',
            action: () => {
                log('stopConfirmationModal: confirmed');
                jackctl.StopServerSync();
                stopConfirmationModal.close();
            },
            default: false,
            key: Clutter.KEY_Escape,
        });
        stopConfirmationModal.addButton({
            label: 'No',
            action: () => {
                log('stopConfirmationModal: not confirmed');
                stopConfirmationModal.close();
            },
            default: true,
            key: Clutter.KEY_Escape,
        });
        stopConfirmationModal.open();
    }
});

// vim: set sw=4 ts=4 :
