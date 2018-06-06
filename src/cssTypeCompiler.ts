const DtsCreator = require('typed-css-modules');
const chokidar = require('chokidar')

const globSuffix = '/**/*.css';

const writeFile = (dtsCreator: any) => (filePath: string) => {
    const clearCache = true;

    dtsCreator.create(filePath, null, clearCache)
        .then((content: any) => content.writeFile())
        .catch((error: any) => console.error('ERROR: ' + error));
};

export interface BuildWatchCssTypeOptions {

}

export function build(srcDir: string, options = {}) {
    //const _dtsCreator = require('typed-css-modules');
    let dtsCreator = new DtsCreator({
        srcDir
    });

    const glob = require('glob');
    glob(srcDir + globSuffix, {}, (error: any, files: string[]) => files.forEach(writeFile(dtsCreator)));
}

export function watch(srcDir: string, options = {}) {
    let dtsCreator = new DtsCreator({
        srcDir
    });

    let watcher = chokidar.watch([srcDir + globSuffix])
        .on('add', writeFile(dtsCreator))
        .on('change', writeFile(dtsCreator));
}
