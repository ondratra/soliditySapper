import {build as tsxBuild, watch as tsxWatch, BuildWatchTsxOptions} from './tsxCompiler';
import {build as solBuild} from './solidityCompiler';
import {build as cssTypeBuild, watch as cssTypeWatch, BuildWatchCssTypeOptions} from './cssTypeCompiler';
//import yargsa from 'yargs';

export {tsxBuild, tsxWatch, solBuild, cssTypeBuild, cssTypeWatch};

const yargsLib = require('yargs');

// workaround for current version of package @types/yargs not exporting all interfaces
type yargArguments = any;


/////////////////// Solidity ///////////////////////////////////////////////////

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


/////////////////// tsx ////////////////////////////////////////////////////////

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
        })
        .option('tsconfig', {
            type: 'string',
            describe: 'path to custom tsconfig.json'
        });
};

interface BuildWatchTsx {
    (a: string, b: string, c: string, d: BuildWatchTsxOptions): void;
}
const tsxWrapper = (func: BuildWatchTsx) => (yargs: yargArguments) => {
    let tmp = {
        tsconfig: yargs.tsconfig
    };
    func(yargs.inputRootDir, yargs.inputFile, yargs.outputDirectory, tmp);
};


/////////////////// CSS types //////////////////////////////////////////////////

const cssTypeBuildWatchArgs = (yargs: yargArguments) => {
    yargs
        .positional('inputRootDir', {
            type: 'string',
            describe: 'root directory of source codes'
        })
};

interface BuildWatchCssType {
    (a: string, b: BuildWatchCssTypeOptions): void;
}
const cssTypeWrapper = (func: BuildWatchCssType) => (yargs: yargArguments) => {
    let tmp = {
    };
    func(yargs.inputRootDir, tmp);
};


/////////////////// MAIN ///////////////////////////////////////////////////////

const isScriptCalledDirectly = () => require.main === module;

(() => {
    if (!isScriptCalledDirectly()) {
        return;
    }

    const argv = yargsLib
        .usage('$0 <cmd> [args]')
        .command('solBuild <solidityInputFile> <outputDirectory> [options]', 'compile solidity contract', solBuildArgs, solBuildWrapper)
        .command('tsxBuild <inputRootDir> <inputFile> <outputDirectory> [options]', 'build GUI', tsxBuildWatchArgs, tsxWrapper(tsxBuild))
        .command('tsxWatch <inputRootDir> <inputFile> <outputDirectory> [options]', 'watch project an rebuild on changes', tsxBuildWatchArgs, tsxWrapper(tsxWatch))
        .command('cssTypeBuild <inputRootDir> [options]', 'build css TS type definitions', cssTypeBuildWatchArgs, cssTypeWrapper(cssTypeBuild))
        .command('cssTypeWatch <inputRootDir> [options]', 'watch css TS type definitions', cssTypeBuildWatchArgs, cssTypeWrapper(cssTypeWatch))
        .strict()
        .help()
        .argv;

    // show help when no parameters passed
    if (!argv._[0]) {
        yargsLib.showHelp();
    }
})();
