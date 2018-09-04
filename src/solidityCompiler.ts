import {FilePath, readFile, writeFile, fileExists} from './misc';

const solc = require('solc');
const path = require('path');
const chokidar = require('chokidar');

/*
const baseArgs = 2;
const fileSettings = {
    encoding: 'utf8'
};

if (process.argv.length < baseArgs + 2) {
    console.log("Usage: \n" + process.argv[1] + ' pathToFileToCompile outputFolder');
    process.exit(1);
}
*/

type AbiCollection = any;

const globSuffix = '/**/*.sol';

// basicly this is autoloading - it's needed because solcjs doesn't resolve solidity files by itself
const findImports = (rootDir: FilePath, fileExtension: string) => (importPath: FilePath) => {
    let resolveFilename = (filePath: FilePath) => {
        let tmpPath = rootDir + '/' + filePath + fileExtension;
        if (fileExists(tmpPath)) {
            return tmpPath;
        }

        if (filePath.startsWith('.')) { // local file not found?
            return null
        }

        try {
            return require.resolve(filePath + '.sol')
        } catch (e) {
            return null
        }
    }


    let filename = resolveFilename(importPath);
    if (filename) {
        return {
            contents: readFile(filename)
        };
    }

    return { error: 'COMPILE ERROR: file not resolved: ' + importPath};
};


const compileContracts = (sourcePath: FilePath, contractName: FilePath) => {
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

const createAbi = (compiledContracts: AbiCollection) => {
    return Object.keys(compiledContracts.contracts).reduce((accumulator, key) => {
        let tmp = key.split(':');
        accumulator[tmp[tmp.length - 1]] = compiledContracts.contracts[key].interface;
        return accumulator;
    }, {} as AbiCollection);
};

export function build(sourcePath: FilePath, outputFolder: FilePath) {
    let contractName = path.basename(sourcePath, path.extname(sourcePath));

    let compiledContracts = compileContracts(sourcePath, contractName);
    let abis = createAbi(compiledContracts);

    let outputFiles = [
        outputFolder + '/' + contractName + '.json',
        outputFolder + '/' + contractName + '_abi.json'
    ];
    writeFile(outputFiles[0], JSON.stringify(compiledContracts, null, 4));
    writeFile(outputFiles[1], JSON.stringify(abis, null, 4));

    return outputFiles;
}

export function watch(watchDirectory: FilePath, sourcePath: FilePath, outputFolder: FilePath) {

    let watcher = chokidar.watch([watchDirectory + globSuffix])
        .on('add', () => build(sourcePath, outputFolder))
        .on('change', () => build(sourcePath, outputFolder));

    return watcher;
}


/*
(() => {
    main(process.argv[2], process.argv[3])
})();
*/
