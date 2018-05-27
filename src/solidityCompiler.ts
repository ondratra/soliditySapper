const solc = require('solc');
const fs = require('fs');
const path = require('path');

const baseArgs = 2;
const fileSettings = {
    encoding: 'utf8'
};

if (process.argv.length < baseArgs + 2) {
    console.log("Usage: \n" + process.argv[1] + ' pathToFileToCompile outputFolder');
    process.exit(1);
}


const readFile = (path) => {
    return fs.readFileSync(path, fileSettings).toString();
};

const writeFile = (path, data) => {
    return fs.writeFileSync(path, data, fileSettings);
};



// basicly this is autoloading - it's needed because solcjs doesn't resolve solidity files by itself
const findImports = (rootDir, fileExtensions) => (importPath) => {
    let resolveFilename = (filePath) => {
        let tmpPath = rootDir + '/' + filePath + fileExtensions;
        console.log(tmpPath)
        if (fs.existsSync(tmpPath)) {
            return tmpPath;
        }

        // TODO: make generic autoloading
        tmpPath = __dirname + '/node_modules/' + filePath;
        if (filePath.startsWith('zeppelin-solidity') && fs.existsSync(tmpPath)) {
            return tmpPath;
        }

        return null;
    }


    let filename = resolveFilename(importPath);
    if (filename) {
        return {
            contents: readFile(filename)
        };
    }

    return { error: 'COMPILE ERROR: file not resolved: ' + importPath};
};


const compileContracts = (sourcePath, contractName) => {
    let sourceDirectory = path.dirname(sourcePath);
    let inputSource = {
        [contractName + '.sol']: readFile(sourcePath),
    }

    let compiled = solc.compile({sources: inputSource}, 1, findImports(sourceDirectory, '.sol'));

    let contract = compiled.contracts[contractName + '.sol:' + contractName];

    if(!contract) {
        console.log(compiled)
        console.log('COMPILE ERROR: unknown error');
        process.exit(1);
    }

    return compiled;
};

const createAbi = (compiledContracts) => {
    return Object.keys(compiledContracts.contracts).reduce((accumulator, key) => {
        let tmp = key.split(':');
        accumulator[tmp[tmp.length - 1]] = compiledContracts.contracts[key].interface;
        return accumulator;
    }, {});
};

(() => {
    const sourcePath = process.argv[2];
    const outputFolder = process.argv[3];

    let contractName = path.basename(sourcePath, path.extname(sourcePath));

    let compiledContracts = compileContracts(sourcePath, contractName);
    let abis = createAbi(compiledContracts);

    writeFile(outputFolder + '/' + contractName + '.json', JSON.stringify(compiledContracts, null, 4));
    writeFile(outputFolder + '/' + contractName + '_abi.json', JSON.stringify(abis, null, 4));
})();
