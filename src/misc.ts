const fs = require('fs');

const fileSettings = {
    encoding: 'utf8'
};

export type FilePath = string;

export function readFile(path: string) {
    return fs.readFileSync(path, fileSettings).toString();
};

export function writeFile(path: string, data: string) {
    return fs.writeFileSync(path, data, fileSettings);
};

export function fileExists(path: string) {
    return fs.existsSync(path);
}