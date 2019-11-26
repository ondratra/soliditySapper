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

// custom tinyify
const commonShake = require('common-shakeify')
const uglify = require('minify-stream')
//const envify = require('./private_modules/envify/custom')
const uglifyify = require('uglifyify')

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

                    if (item[0] == 'dir') {
                        return pathmodify.mod.dir(item[1], item[2])
                    }

                    if (item[0] == 're') {
                        const regexp = (item[1] as any) instanceof RegExp ? item[1] : new RegExp(item[1])
                        return pathmodify.mod.re(regexp, item[2])
                    }

                    throw `Unkown alias module '${item[0]}'`
                })
            })
            .plugin(tsify, tsconfig.compilerOptions)

        if (options.tinyify) {
            customPluginTinyify(instance)
        }

        if (options.external) {
            instance.external(options.external)
        }

        instance.plugin(cssModulesify, {
            rootDir: options.projectRootDir,
            output: outputDir + '/' + outputFile + '.css',
            after: [
                'postcss-cssnext',
                'postcss-url'
            ],
            generateScopedName: options.cssGenerateScopedName,
            global: true,
            ...(options.cssModulesifyExtraOptions || {})
        });

        return instance
    }

    return result
}

function customPluginTinyify(browserifyInstance: BrowserifyInstance) {
    const env = Object.assign({
        NODE_ENV: 'production'
    }, process.env)

    // Replace `process.env.NODE_ENV` with "production".
    //browserifyInstance.transform(envify(env), {global: true})

    // Remove dead code.
    browserifyInstance.transform(uglifyify, {
        global: true,
        toplevel: true,
        // No need to mangle here, will do that at the end.

        exts: ['.tsx', '.ts', '.js'],

        mangle: false,
        output: {
            ascii_only: true
        }
    })

    browserifyInstance.plugin(commonShake)

    // minify result
    const parameters = {
        output: {
            ascii_only: true
        },
        mangle: {
            safari10: true
        },
        sourceMap: false
    }
    browserifyInstance.pipeline.get('pack').push(uglify(parameters))

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
    const parameters = {
        //debug: tsconfig.compilerOptions.declaration,
        debug: options.debug || false,
        fullPaths: options.fullPaths || false,
        entries: [sourceFile],
        cache: {},
        packageCache: {},


        // TODO: decide how to pass parameter
        basedir: inputRootDir
    }
    const instance = browserify(parameters)

    return instance
}

export interface IBuildWatchTsxOptions {
    tsconfig: FilePath;
    projectRootDir: FilePath
    cssGenerateScopedName?: (name: string, filename: string, css: string) => string
    cssModulesifyExtraOptions?: Object
    external?: string[]
    fullPaths?: boolean // default false
    debug?: boolean // default false
    tinyify?: boolean // default false
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
