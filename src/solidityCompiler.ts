import {FilePath, readFile, writeFile, fileExists} from './misc';

//import * as solc from 'solc'
const solc = require('solc')
import * as path from 'path'
import * as chokidar from 'chokidar'


type AbiCollection = any;

const globSuffix = '/**/*.sol';

interface IRefreshCallback {
    (): Promise<null | FilePath>
}

// basicly this is autoloading - it's needed because solcjs doesn't resolve solidity files by itself
const findImports = (rootDir: FilePath) => (importPath: FilePath) => {
    const resolveFilename = (filePath: FilePath) => {
        const tmpPath = rootDir + '/' + filePath;
        if (fileExists(tmpPath)) {
            return tmpPath;
        }

        if (filePath.startsWith('.')) { // local file not found?
            return null
        }

        try {
            return require.resolve(filePath)
        } catch (e) {
            return null
        }
    }


    const filename = resolveFilename(importPath);
    if (filename) {
        return {
            contents: readFile(filename)
        };
    }

    return { error: 'COMPILE ERROR: file not resolved: ' + importPath};
};


const compileContracts = (sourcePath: FilePath, contractName: FilePath) => {
    const sourceDirectory = path.dirname(sourcePath);
    const input = {
        language: 'Solidity',
        sources: {
            [contractName]: {
                content: readFile(sourcePath)
            }
        },
        settings: {
            outputSelection: {
                "*": {
                    "*": [ "abi", "evm.bytecode" ]
                }
            }
        }
    }

    const compiled = JSON.parse(solc.compileStandardWrapper(JSON.stringify(input), findImports(sourceDirectory)));
    const contract = compiled.contracts && compiled.contracts[contractName];

    if(!contract) {
        console.log(compiled)
        console.log('COMPILE ERROR: unknown error');
        process.exit(1);
    }

    return compiled;
};

const createAbi = (compiledContracts: AbiCollection) => {
    return Object.keys(compiledContracts.contracts).reduce((accumulator, fileKey) => {
        Object.keys(compiledContracts.contracts[fileKey]).map(nameKey => {
            accumulator[nameKey] = JSON.stringify(compiledContracts.contracts[fileKey][nameKey].abi);
        })

        return accumulator
    }, {} as AbiCollection)
};

export function build(sourcePath: FilePath, outputFolder: FilePath) {
    const contractName = path.basename(sourcePath, path.extname(sourcePath));

    const compiledContracts = compileContracts(sourcePath, contractName);
    const abis = createAbi(compiledContracts);

    const outputFiles = [
        outputFolder + '/' + contractName + '.json',
        outputFolder + '/' + contractName + '_abi.json'
    ];
    writeFile(outputFiles[0], JSON.stringify(compiledContracts, null, 4));
    writeFile(outputFiles[1], JSON.stringify(abis, null, 4));

    return outputFiles;
}

export function watch(watchDirectory: FilePath, sourcePath: FilePath, outputFolder: FilePath, refreshCallback?: IRefreshCallback) {
    const refresh = async () => {
        const newSourcePath = refreshCallback && await refreshCallback()
        if (newSourcePath) {
            build(newSourcePath, outputFolder)
            return
        }

        build(sourcePath, outputFolder)
    }

    const watcher = chokidar.watch([watchDirectory + globSuffix])
        .on('add', refresh)
        .on('change', refresh);

    return watcher;
}
