import {build as tsxBuild, watch as tsxWatch} from '../tsxCompilers.ts';


const tsxBuildWatchArgs = (yargs) => {
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

const solWatchWrapper = (yargs) => {
    build(yargs.inputRootDir, yargs.inputFile, yargs.outputDirectory)
};

let solBuildArgs = (yargs) => {
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

const tsxWrapper = (func) => (yargs) => {
    func(yargs.inputRootDir, yargs.inputFile, yargs.outputDirectory);
};


const argv = yargsLib
    .usage('$0 <cmd> [args]')
    .command('solBuild <solidityInputFile> <outputDirectory>', 'compile solidity contract', solBuildArgs, solBuildWrapper)
    .command('tsxBuild <inputRootDir> <inputFile> <outputDirectory>', 'build project', tsxBuildWatchArgs, tsxWrapper(tsxBuild))
    .command('tsxWatch <inputRootDir> <inputFile> <outputDirectory>', 'watches project an rebuild on changes', tsxBuildWatchArgs, tsxWrapper(tsxWatch))
    .help()
    .argv;
