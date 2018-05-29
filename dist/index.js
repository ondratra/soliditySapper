"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tsxCompiler_1 = require("./tsxCompiler");
var solidityCompiler_1 = require("./solidityCompiler");
//import yargsa from 'yargs';
var yargsLib = require('yargs');
var tsxBuildWatchArgs = function (yargs) {
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
var solBuildWrapper = function (yargs) {
    solidityCompiler_1.default(yargs.solidityInputFile, yargs.outputDirectory);
};
var solBuildArgs = function (yargs) {
    yargs
        .positional('solidityInputFile', {
        type: 'string',
        describe: 'root directory of source codes'
    })
        .positional('outputDirectory', {
        type: 'string',
        describe: 'path to your .tsx file'
    });
};
var tsxWrapper = function (func) { return function (yargs) {
    func(yargs.inputRootDir, yargs.inputFile, yargs.outputDirectory);
}; };
var isScriptCalledDirectly = function () { return require.main === module; };
/////////////////// MAIN ///////////////////////////////////////////////////////
(function () {
    if (!isScriptCalledDirectly()) {
        return;
    }
    var argv = yargsLib
        .usage('$0 <cmd> [args]')
        .command('solBuild <solidityInputFile> <outputDirectory>', 'compile solidity contract', solBuildArgs, solBuildWrapper)
        .command('tsxBuild <inputRootDir> <inputFile> <outputDirectory>', 'build project', tsxBuildWatchArgs, tsxWrapper(tsxCompiler_1.build))
        .command('tsxWatch <inputRootDir> <inputFile> <outputDirectory>', 'watches project an rebuild on changes', tsxBuildWatchArgs, tsxWrapper(tsxCompiler_1.watch))
        .strict()
        .help()
        .argv;
    // show help when no parameters passed
    if (!argv._[0]) {
        yargsLib.showHelp();
    }
})();
