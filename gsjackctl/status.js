/* exported Status */

/* gsjackctl
 *
 * Copyright 2020 Florian Hülsmann <fh@cbix.de>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const Local = imports.misc.extensionUtils.getCurrentExtension();

const {Clutter, GObject, St} = imports.gi;
const PopupMenu = imports.ui.popupMenu;

var Status = GObject.registerClass({
    Signals: {
        'decrease-buffersize': {},
        'increase-buffersize': {},
        'clear-xruns': {},
    },
}, class Status extends PopupMenu.PopupBaseMenuItem {
    _init() {
        super._init({
            reactive: false,
            can_focus: false,
            style_class: 'gsjackctl-status',
        });

        // build UI
        this._errorStatus = new St.Label({
            text: 'Error',
            visible: false,
        });
        this.add_child(this._errorStatus);

        this._stoppedStatus = new St.Label({
            text: 'JACK stopped',
            visible: true,
        });
        this.add_child(this._stoppedStatus);

        const layout = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL,
            row_spacing: 8,
            column_spacing: 8,
        });
        this._grid = new St.Widget({
            style_class: 'gsjackctl-status-grid',
            x_expand: true,
            layout_manager: layout,
            visible: false,
        });
        layout.hookup_style(this._grid);
        this.add_child(this._grid);

        // Running + RT status
        this._runningLabel = new St.Label({
            text: 'Running',
            x_expand: true,
        });
        this._rtLabel = new St.Label({
            text: 'RT',
            x_align: Clutter.ActorAlign.CENTER,
            style_class: 'gsjackctl-rt-label',
        });
        layout.attach_next_to(this._runningLabel, null, Clutter.GridPosition.BOTTOM, 2, 1);
        layout.attach_next_to(this._rtLabel, this._runningLabel, Clutter.GridPosition.RIGHT, 1, 1);

        // Load status
        this._loadLabel = new St.Label({
            text: 'Load:',
            x_expand: true,
            style_class: 'gsjackctl-status-label',
        });
        this._loadValue = new St.Label({
            text: '?? %',
            x_expand: true,
            style_class: 'gsjackctl-status-value',
        });
        layout.attach_next_to(this._loadLabel, null, Clutter.GridPosition.BOTTOM, 1, 1);
        layout.attach_next_to(this._loadValue, this._loadLabel, Clutter.GridPosition.RIGHT, 1, 1);

        // Samplerate
        this._samplerateLabel = new St.Label({
            text: 'Samplerate:',
            x_expand: true,
            style_class: 'gsjackctl-status-label',
        });
        this._samplerateValue = new St.Label({
            text: '?? kHz',
            x_expand: true,
            style_class: 'gsjackctl-status-value',
        });
        layout.attach_next_to(this._samplerateLabel, null, Clutter.GridPosition.BOTTOM, 1, 1);
        layout.attach_next_to(this._samplerateValue, this._samplerateLabel, Clutter.GridPosition.RIGHT, 1, 1);

        // Latency
        this._latencyLabel = new St.Label({
            text: 'Block latency:',
            x_expand: true,
            style_class: 'gsjackctl-status-label',
        });
        this._latencyValue = new St.Label({
            text: '?? ms',
            x_expand: true,
            style_class: 'gsjackctl-status-value',
        });
        layout.attach_next_to(this._latencyLabel, null, Clutter.GridPosition.BOTTOM, 1, 1);
        layout.attach_next_to(this._latencyValue, this._latencyLabel, Clutter.GridPosition.RIGHT, 1, 1);

        // Buffer size
        this._buffersizeLabel = new St.Label({
            text: 'Buffer size:',
            x_expand: true,
            style_class: 'gsjackctl-status-label',
        });
        this._buffersizeValue = new St.Label({
            text: '??',
            x_expand: true,
            style_class: 'gsjackctl-status-value',
        });
        const increaseIcon = new St.Icon({
            icon_name: 'value-increase-symbolic',
            style_class: 'popup-menu-icon',
        });
        const decreaseIcon = new St.Icon({
            icon_name: 'value-decrease-symbolic',
            style_class: 'popup-menu-icon',
        });
        this._increaseBuffersizeButton = new St.Button({
            child: increaseIcon,
            can_focus: true,
            style_class: 'gsjackctl-buffersize-button gsjackctl-inline-button',
        });
        this._decreaseBuffersizeButton = new St.Button({
            child: decreaseIcon,
            can_focus: true,
            style_class: 'gsjackctl-buffersize-button gsjackctl-inline-button',
        });
        this._changeBuffersizeButtons = new St.BoxLayout({
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this._changeBuffersizeButtons.add_child(this._decreaseBuffersizeButton);
        this._changeBuffersizeButtons.add_child(this._increaseBuffersizeButton);
        /* not implemented
        const changeBuffersizeIcon = new St.Icon({
            icon_name: 'document-edit-symbolic',
            style_class: 'popup-menu-icon',
        });
        this._changeBuffersizeButton = new St.Button({
            child: changeBuffersizeIcon,
            can_focus: true,
            style_class: 'gsjackctl-buffersize-button gsjackctl-inline-button button',
        });
        */
        layout.attach_next_to(this._buffersizeLabel, null, Clutter.GridPosition.BOTTOM, 1, 1);
        layout.attach_next_to(this._buffersizeValue, this._buffersizeLabel, Clutter.GridPosition.RIGHT, 1, 1);
        layout.attach_next_to(this._changeBuffersizeButtons, this._buffersizeValue, Clutter.GridPosition.RIGHT, 1, 1);
        // layout.attach_next_to(this._changeBuffersizeButton, this._buffersizeValue, Clutter.GridPosition.RIGHT, 1, 1);

        // Xruns status + clear button
        this._xrunsStatusLabel = new St.Label({
            text: '?? xruns',
            x_expand: true,
            style_class: 'gsjackctl-xruns-label',
        });
        const xrunsClearIcon = new St.Icon({
            icon_name: 'edit-clear-symbolic',
            style_class: 'popup-menu-icon',
        });
        this._xrunsClearButton = new St.Button({
            child: xrunsClearIcon,
            can_focus: true,
            style_class: 'gsjackctl-xruns-button gsjackctl-inline-button',
        });
        layout.attach_next_to(this._xrunsStatusLabel, null, Clutter.GridPosition.BOTTOM, 2, 1);
        layout.attach_next_to(this._xrunsClearButton, this._xrunsStatusLabel, Clutter.GridPosition.RIGHT, 1, 1);

        // Connect signals
        this._decreaseBuffersizeButton.connect('clicked', () => {
            this.emit('decrease-buffersize');
        });
        this._increaseBuffersizeButton.connect('clicked', () => {
            this.emit('increase-buffersize');
        });
        this._xrunsClearButton.connect('clicked', () => {
            this.emit('clear-xruns');
        });
    }

    setStatus(status) {
        this._stoppedStatus.visible = !status.started;
        this._grid.visible = status.started;
        if (status.started) {
            this._errorStatus.visible = false;
            this._rtLabel.visible = status.rt;
            this._loadValue.text = `${status.load.toFixed(1)} %`;
            this._samplerateValue.text = `${status.sr / 1000} kHz`;
            this._latencyValue.text = `${status.latency.toFixed(1)} ms`;
            this._buffersizeValue.text = `${status.buffersize}`;
            this._xrunsStatusLabel.text = `${status.xruns} xrun${status.xruns === 1 ? '' : 's'}`;

            this._decreaseBuffersizeButton.visible = (status.buffersize > 8);
            this._increaseBuffersizeButton.visible = (status.buffersize < 8192);
            this._xrunsClearButton.visible = (status.xruns > 0);

            if (status.xruns > 0)
                this._xrunsStatusLabel.add_style_class_name('has-xruns');
            else
                this._xrunsStatusLabel.remove_style_class_name('has-xruns');

        }
    }

    setError(e) {
        log('status.setError', e.message);
        this._errorStatus.text = e.message;
        this._errorStatus.visible = true;
    }
}
);

// vim: set sw=4 ts=4 :
