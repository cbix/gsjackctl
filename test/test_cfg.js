#!/usr/bin/env -S gjs -I ..

// prints the full configuration tree as json. It's recommended to be run through a json pretty-printer, like
// ./test_cfg.js | jsonpp

try {
    const {JackConfigure} = imports.jack.jackdbus;

    try {
        const jackcfg = new JackConfigure();
        const configtree = jackcfg._fullConfigurationTree();
        print(JSON.stringify(configtree));

    } catch (e) {
        print(`Error: ${e}`);
    }
} catch (e) {
    print(e.message);
}

// vim: set sw=4 ts=4 :
