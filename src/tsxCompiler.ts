"use strict";

// run:
// node --harmony-async-await build.js

import {FilePath, readFile} from './misc';

type BrowserifyInstance = any;

const path = require('path');
const fs = require('fs');
const browserify = require('browserify');
const watchify = require('watchify');
const tsify = require('tsify');
const errorify = require('errorify');
const cssModulesify = require('css-modulesify');
const yargsLib = require('yargs');


/////////////////// Browserify plugins /////////////////////////////////////////
function pluginsCommon(outputDir: FilePath, outputFile: FilePath) {
    const tsconfigRelevant = JSON.parse(readFile(__dirname + '/../tsconfig.json')).compilerOptions;

    return (browserifyInstance: BrowserifyInstance) => browserifyInstance
        .plugin(errorify, {})
        .plugin(tsify, tsconfigRelevant)
        /*.plugin(tsify, {
            //noImplicitAny: true,
            //noImplicitReturns: true,
            target: 'es5',
            moduleResolution: 'node',
            jsx: 'react',
            jsxFactory: 'h',
            //traceResolution: true, // use this to debug npm dependencies

            lib: ["es2017", "dom"]
        })*/
        .plugin(cssModulesify, {
            rootDir: __dirname,
            output: outputDir + '/' + outputFile + '.css',
            after: [
                'postcss-cssnext'
            ]
        });
}

function pluginsWatchify(outputDir: FilePath, outputFile: FilePath) {
    return (browserifyInstance: BrowserifyInstance) => browserifyInstance.plugin(watchify, {
        ignoreWatch: ['**/node_modules/**']
    }).on('update', function() {
        console.log('rebundling')
        //browserifyInstance.bundle().pipe(fs.createWriteStream(jsOutputPath));
        browserifyBundle(outputDir, outputFile)(browserifyInstance);
    })
}


/////////////////// Browserify init and bundle /////////////////////////////////
function browserifyBundle(outputDir: FilePath, outputFile: FilePath) {
    return (browserifyInstance: BrowserifyInstance) => browserifyInstance
        .bundle()
        .pipe(fs.createWriteStream(outputDir + '/' + outputFile + '.js'));
}

async function getBrowserify(inputRootDir: FilePath, sourceFile: FilePath) {
    return browserify({
        debug: true,
        //entries: [inputRootDir + "/" + sourceFile],
        entries: [sourceFile],
        cache: {},
        packageCache: {},

        // TODO: decide how to pass parameter
        basedir: inputRootDir
    });

    //return pluginsCommon(browserifyInstance);
}

export function build(inputRootDir: FilePath, inputFile: FilePath, outputDir: FilePath) {
    const outputFile = path.basename(inputFile, path.extname(inputFile));

    return getBrowserify(inputRootDir, inputFile)
        .then(pluginsCommon(outputDir, outputFile))
        .then(browserifyBundle(outputDir, outputFile));
}

export function watch(inputRootDir: FilePath, inputFile: FilePath, outputDir: FilePath) {
    const outputFile = path.basename(inputFile, path.extname(inputFile));

    return getBrowserify(inputRootDir, inputFile)
        .then(pluginsCommon(outputDir, outputFile))
        .then(pluginsWatchify(outputDir, outputFile))
        .then(browserifyBundle(outputDir, outputFile));
}
