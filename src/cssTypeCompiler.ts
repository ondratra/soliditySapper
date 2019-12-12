import DtsCreator from 'typed-css-modules'
import {DtsContent} from 'typed-css-modules/lib/dts-content'
import * as path from 'path'
import * as fs from 'fs'
const chokidar = require('chokidar')
const glob = require('glob')

const globSuffix = '/**/*.css'

export interface BuildWatchCssTypeOptions {
    followCssImport?: boolean
}

const defaultOptions: BuildWatchCssTypeOptions = {
    followCssImport: true
}


const resolvePossibleImports = (options: BuildWatchCssTypeOptions, dtsCreator: DtsCreator) => async (content: DtsContent): Promise<DtsContent> => {
    const folder = path.dirname(content.inputFilePath)
    const cssContent = fs.readFileSync(content.inputFilePath, 'utf8')

    let resultContent: DtsContent = content
    const importPaths = findImportsInCss(cssContent)
    await Promise.all(importPaths.map(async importPath => {
        const absolutePath = path.join(folder, importPath)

        // process css import
        const importContent = await processCssFile(options, dtsCreator, absolutePath)
        if (importContent instanceof Error) {
            return
        }

        // add imported definitions
        resultContent = new DtsContent({
            ...resultContent,
            rawTokenList: resultContent.tokens.concat(importContent.tokens),
            resultList: resultContent.contents.concat(importContent.contents),
        } as any)
    }))

    // left only unique values
    resultContent = new DtsContent({
        ...resultContent,
        rawTokenList: [...new Set(resultContent.tokens)],
        resultList: [...new Set(resultContent.contents)],
    } as any)

    return resultContent
}

async function processCssFile(options: BuildWatchCssTypeOptions, dtsCreator: DtsCreator, filePath: string): Promise<DtsContent | Error> {
    const clearCache = true

    const content = await dtsCreator.create(filePath, null, clearCache)
        .catch((error: Error) => {
            console.error('ERROR: ' + error)
            return error
        })
    if (content instanceof Error || !options.followCssImport) {
        return content
    }

    const possibleImports = await resolvePossibleImports(options, dtsCreator)(content)

    return possibleImports
}

const writeFile = (options: BuildWatchCssTypeOptions, dtsCreator: DtsCreator) => async (filePath: string) => {
    const content = await processCssFile(options, dtsCreator, filePath)
    if (content instanceof Error) {
        return
    }

    content.writeFile()
}

export function build(srcDir: string, options: BuildWatchCssTypeOptions = defaultOptions) {
    const finalOptions = {
        ...defaultOptions,
        ...options
    }

    let dtsCreator = new DtsCreator({
        searchDir: srcDir
    });

    return glob(srcDir + globSuffix, {}, (error: any, files: string[]) => files.forEach(writeFile(finalOptions, dtsCreator)));
}

export function watch(srcDir: string, options: BuildWatchCssTypeOptions = defaultOptions) {
    const finalOptions = {
        ...defaultOptions,
        ...options
    }
    let dtsCreator = new DtsCreator({
        searchDir: srcDir
    });

    let watcher = chokidar.watch([srcDir + globSuffix])
        .on('add', writeFile(finalOptions, dtsCreator))
        .on('change', writeFile(finalOptions, dtsCreator));
}

function findImportsInCss(cssContent: string) {
    const regexp = new RegExp('@import "(.*?)";', 'g')

    const importPaths = []
    let match
    while ((match = regexp.exec(cssContent)) !== null) {
        importPaths.push(match[1])
    }

    return importPaths
}
