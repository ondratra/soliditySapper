import {build as tsxBuild, watch as tsxWatch} from './tsxCompiler';
import solBuild from './solidityCompiler';
//import yargsa from 'yargs';

const yargsLib = require('yargs');

// workaround for current version of package @types/yargs not exporting all interfaces
type yargArguments = any;

const tsxBuildWatchArgs = (yargs: yargArguments) => {
    yargs
        .positional('inputRootDir', {
            type: 'string',
            describe: 'root directory of source codes'
        })
        .positional('inputFile', {
            type: 'string',
            describe: 'path to your .tsx file'
        })
        .positional('outputDirectory', {
            type: 'string',
            describe: 'path to directory where resulting .js and .css files will be saved'
        });
};

const solBuildWrapper = (yargs: yargArguments) => {
    solBuild(yargs.solidityInputFile, yargs.outputDirectory)
};

let solBuildArgs = (yargs: yargArguments) => {
    yargs
        .positional('solidityInputFile', {
            type: 'string',
            describe: 'root directory of source codes'
        })
        .positional('outputDirectory', {
            type: 'string',
            describe: 'path to your .tsx file'
        })
};

const tsxWrapper = (func: {(a: string, b: string, c: string): void}) => (yargs: yargArguments) => {
    func(yargs.inputRootDir, yargs.inputFile, yargs.outputDirectory);
};

const isScriptCalledDirectly = () => require.main === module;


/////////////////// MAIN ///////////////////////////////////////////////////////

(() => {
    if (!isScriptCalledDirectly()) {
        return;
    }

    const argv = yargsLib
        .usage('$0 <cmd> [args]')
        .command('solBuild <solidityInputFile> <outputDirectory>', 'compile solidity contract', solBuildArgs, solBuildWrapper)
        .command('tsxBuild <inputRootDir> <inputFile> <outputDirectory>', 'build project', tsxBuildWatchArgs, tsxWrapper(tsxBuild))
        .command('tsxWatch <inputRootDir> <inputFile> <outputDirectory>', 'watches project an rebuild on changes', tsxBuildWatchArgs, tsxWrapper(tsxWatch))
        .strict()
        .help()
        .argv;

    // show help when no parameters passed
    if (!argv._[0]) {
        yargsLib.showHelp();
    }
})();
