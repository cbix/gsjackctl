// gjs -I .. test_cfg.js

// prints the full configuration tree as json. It's recommended to be run through a json pretty-printer, like
// gjs -I .. test_cfg.js | jsonpp

const {JackConfigure} = imports.jack.jackdbus;

try {
    const jackcfg = new JackConfigure();
    const configtree = jackcfg._fullConfigurationTree();
    print(JSON.stringify(configtree));

} catch (e) {
    print(`Error: ${e}`);
}

// vim: set sw=4 ts=4 :
