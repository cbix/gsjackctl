// gjs -I .. test_cfg.js

const {JackConfigure} = imports.jack.jackdbus;
const traverseObjReducer = (acc, curr) => acc ? acc[curr] : undefined;

try {
    print('JackConfigure:');
    const jackcfg = new JackConfigure();
    const pathStack = [[]],
        root = {};
    while (pathStack.length > 0) {
        const path = pathStack.pop();
        const [isLeaf, nodes] = jackcfg.ReadContainerSync(path);
        const currentNode = path.reduce(traverseObjReducer, root);
        if (!isLeaf) {
            nodes.forEach(node => {
                const newPath = path.concat(node);
                pathStack.push(newPath);
                currentNode[node] = {};
            });
        } else {
            nodes.forEach(node => {
                const newPath = path.concat(node);
                const nodeValue = jackcfg.GetParameterValueSync(newPath);
                if (nodeValue[0]) { // isSet
                    currentNode[node] = nodeValue[2]; // value
                } else {
                    currentNode[node] = nodeValue[1]; // default
                }
            });
        }
    }
    print(JSON.stringify(root));

} catch (e) {
    print(`Error: ${e}`);
}

// vim: set sw=4 ts=4 :
