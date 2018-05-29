"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var misc_1 = require("./misc");
var solc = require('solc');
var path = require('path');
// basicly this is autoloading - it's needed because solcjs doesn't resolve solidity files by itself
var findImports = function (rootDir, fileExtension) { return function (importPath) {
    var resolveFilename = function (filePath) {
        var tmpPath = rootDir + '/' + filePath + fileExtension;
        console.log(tmpPath);
        if (misc_1.fileExists(tmpPath)) {
            return tmpPath;
        }
        // TODO: make generic autoloading
        tmpPath = __dirname + '/node_modules/' + filePath;
        if (filePath.startsWith('zeppelin-solidity') && misc_1.fileExists(tmpPath)) {
            return tmpPath;
        }
        return null;
    };
    var filename = resolveFilename(importPath);
    if (filename) {
        return {
            contents: misc_1.readFile(filename)
        };
    }
    return { error: 'COMPILE ERROR: file not resolved: ' + importPath };
}; };
var compileContracts = function (sourcePath, contractName) {
    var sourceDirectory = path.dirname(sourcePath);
    var inputSource = (_a = {},
        _a[contractName + '.sol'] = misc_1.readFile(sourcePath),
        _a);
    var compiled = solc.compile({ sources: inputSource }, 1, findImports(sourceDirectory, '.sol'));
    var contract = compiled.contracts[contractName + '.sol:' + contractName];
    if (!contract) {
        console.log(compiled);
        console.log('COMPILE ERROR: unknown error');
        process.exit(1);
    }
    return compiled;
    var _a;
};
var createAbi = function (compiledContracts) {
    return Object.keys(compiledContracts.contracts).reduce(function (accumulator, key) {
        var tmp = key.split(':');
        accumulator[tmp[tmp.length - 1]] = compiledContracts.contracts[key].interface;
        return accumulator;
    }, {});
};
function solidityCompiler(sourcePath, outputFolder) {
    var contractName = path.basename(sourcePath, path.extname(sourcePath));
    var compiledContracts = compileContracts(sourcePath, contractName);
    var abis = createAbi(compiledContracts);
    misc_1.writeFile(outputFolder + '/' + contractName + '.json', JSON.stringify(compiledContracts, null, 4));
    misc_1.writeFile(outputFolder + '/' + contractName + '_abi.json', JSON.stringify(abis, null, 4));
}
exports.default = solidityCompiler;
/*
(() => {
    main(process.argv[2], process.argv[3])
})();
*/
