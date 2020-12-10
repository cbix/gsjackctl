/* exported init */

/* gsjackctl
 *
 * Copyright 2020 Florian Hülsmann <fh@cbix.de>
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const Local = imports.ui.main.extensionManager.lookup('gsjackctl@cbix.de');

const {Extension} = Local.imports.gsjackctl.extension;

/**
 * @param {object} meta metadata passed by the extension runtime environment
 * @returns {gsjackctl.Extension} Extension object
 */
function init(meta) {
    return new Extension(meta.uuid);
}

// vim: set sw=4 ts=4 :
