import {FilePath, readFile} from './misc';
import {CompilerOptions} from 'typescript'

type BrowserifyInstance = any;

const path = require('path');
const fs = require('fs');
const browserify = require('browserify');
const watchify = require('watchify');
const tsify = require('tsify');
const errorify = require('errorify');
const pathmodify = require('pathmodify')
const cssModulesify = require('css-modulesify');
const yargsLib = require('yargs');
const tinyify = require('tinyify')


interface ITsConfig {
    compilerOptions: CompilerOptions
    extends?: string
    aliases?: [string, string, string][]
}

function loadTsConfig(filePath: FilePath): ITsConfig {
    const tmpPath = filePath || __dirname + '/../tsconfig.json';
    const content = JSON.parse(readFile(tmpPath))

    if (!content.extends) {
        return content
    }

    const pathAbsolute = content.extends.charAt(0) == '/'
    const extendPath = pathAbsolute ? content : path.join(path.dirname(tmpPath), content.extends)

    const baseContent = loadTsConfig(extendPath)
    const result = {...baseContent, ...content}

    return result
}

/////////////////// Browserify plugins /////////////////////////////////////////
function pluginsCommon(outputDir: FilePath, outputFile: FilePath, options: IBuildWatchTsxOptions, tsconfig: ITsConfig) {
    const result = (browserifyInstance: BrowserifyInstance) => {
        const instance = browserifyInstance
            .plugin(errorify, {})
            .plugin(pathmodify, {
                mods: tsconfig.aliases.map((item: string[]) => {
                    if (item[0] == 'id') {
                        return pathmodify.mod.id(item[1], item[2])
                    }

                    throw `Unkown alias module '${item[0]}'`
                })
            })
            .plugin(tsify, tsconfig.compilerOptions)

        if (options.tinyify) {
            instance.plugin(tinyify, {})
        }

        instance.plugin(cssModulesify, {
            rootDir: __dirname,
            output: outputDir + '/' + outputFile + '.css',
            after: [
                'postcss-cssnext'
            ]
        });

        return instance
    }

    return result
}

function pluginsWatchify(outputDir: FilePath, outputFile: FilePath) {
    return (browserifyInstance: BrowserifyInstance) => browserifyInstance.plugin(watchify, {
        ignoreWatch: ['**/node_modules/**'],
        verbose: true
    }).on('update', function() {
        console.log('rebundling')
        browserifyBundle(outputDir, outputFile)(browserifyInstance);
    })
}


/////////////////// Browserify init and bundle /////////////////////////////////
function browserifyBundle(outputDir: FilePath, outputFile: FilePath) {
    return (browserifyInstance: BrowserifyInstance) => browserifyInstance
        .bundle()
        .pipe(fs.createWriteStream(outputDir + '/' + outputFile + '.js'));
}

async function getBrowserify(inputRootDir: FilePath, sourceFile: FilePath, options: IBuildWatchTsxOptions, tsconfig: ITsConfig) {
    return browserify({
        debug: tsconfig.compilerOptions.declaration,
        //entries: [inputRootDir + "/" + sourceFile],
        entries: [sourceFile],
        cache: {},
        packageCache: {},


        // TODO: decide how to pass parameter
        basedir: inputRootDir
    })
}

export interface IBuildWatchTsxOptions {
    tsconfig: FilePath;
    tinyify: boolean
}

export function build(inputRootDir: FilePath, inputFile: FilePath, outputDir: FilePath, options: IBuildWatchTsxOptions) {
    const outputFile = path.basename(inputFile, path.extname(inputFile));
    const tsconfig = loadTsConfig(options.tsconfig)

    return getBrowserify(inputRootDir, inputFile, options, tsconfig)
        .then(pluginsCommon(outputDir, outputFile, options, tsconfig))
        .then(browserifyBundle(outputDir, outputFile));
}

export function watch(inputRootDir: FilePath, inputFile: FilePath, outputDir: FilePath, options: IBuildWatchTsxOptions) {
    const outputFile = path.basename(inputFile, path.extname(inputFile));
    const tsconfig = loadTsConfig(options.tsconfig)

    return getBrowserify(inputRootDir, inputFile, options, tsconfig)
        .then(pluginsCommon(outputDir, outputFile, options, tsconfig))
        .then(pluginsWatchify(outputDir, outputFile))
        .then(browserifyBundle(outputDir, outputFile));
}
