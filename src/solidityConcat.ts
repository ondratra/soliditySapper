import {FilePath, readFile, writeFile, fileExists} from './misc'
import * as path from 'path'
import * as chokidar from 'chokidar'

const globSuffix = '/**/*.sol';

export function watch(watchDirectory: FilePath, sourcePath: FilePath, outputFolder: FilePath) {

    let watcher = chokidar.watch([watchDirectory + globSuffix])
        .on('add', () => build(sourcePath, outputFolder))
        .on('change', () => build(sourcePath, outputFolder));

    return watcher;
}

export async function build(sourcePath: FilePath, outputFolder: FilePath) {
    const {code} = await searchForImports(sourcePath)
    const contractName = path.basename(sourcePath, path.extname(sourcePath))

    const outputFile = outputFolder + '/' + contractName + '.sol'
    writeFile(outputFile, code);
}

interface IImportResults {
    usedFiles: {
        [key: string]: string
    }
    code: string
}


async function findSolidityFile(relativeFolder: FilePath, importText: string): Promise<string> {
    if (importText.startsWith('.')) {
        const filePath = path.normalize(`${relativeFolder}/${importText}`)
        return fileExists(filePath) ? filePath : null
    }

    try {
        return require.resolve(importText)
    } catch (e) {
        return null
    }
}

const importLinesReducer = (dependentFilePath: FilePath) => async (accumulatorPromise: Promise<IImportResults>, item: string): Promise<IImportResults> => {
    const accumulator = await accumulatorPromise
    const filesFolder = path.dirname(dependentFilePath)

    const importPath = await findSolidityFile(filesFolder, item)

    if (!importPath) {
        throw `Cannot find file '${item}' for import requested in ${dependentFilePath}`
    }

    if (accumulator.usedFiles[importPath]) {
        return accumulator
    }

    // TODO: handle case when multiple contracts are in the same file
    // but not all of them are used in file requesting them (tree-shaking)

    // TODO: handle circular dependencies

    const {usedFiles, code} = await searchForImports(importPath, accumulator.usedFiles)
    return {
        usedFiles: {
            ...accumulator.usedFiles,
            ...usedFiles,
            [importPath]: code
        },
        code: accumulator.code + '\n' + code
    }
}

async function searchForImports(filePath: FilePath, usedFiles = {}): Promise<IImportResults> {
    const content = readFile(filePath)
    const importRegex = /^import ['"](.*)['"];$/mg

    // due to missing matchAll() support in JS we need to iterate over regexpt match results
    //const importLines = matchAll(content, importRegex) // uncomment after matchAll available in ES
    const importLines = []
    let matchOne
    while ((matchOne = importRegex.exec(content)) !== null) {
        importLines.push(matchOne[1])
    }

    const {usedFiles: filesInner, code: importCode} = await importLines.reduce(importLinesReducer(filePath), Promise.resolve({usedFiles, code: ''}))

    const resultCode = importCode + content.replace(importRegex, '')
    const resultUsedFiles = {
        ...usedFiles,
        ...filesInner
    }

    return {usedFiles: resultUsedFiles, code: resultCode}
}
