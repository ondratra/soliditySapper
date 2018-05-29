"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require('fs');
var fileSettings = {
    encoding: 'utf8'
};
function readFile(path) {
    return fs.readFileSync(path, fileSettings).toString();
}
exports.readFile = readFile;
;
function writeFile(path, data) {
    return fs.writeFileSync(path, data, fileSettings);
}
exports.writeFile = writeFile;
;
function fileExists(path) {
    return fs.existsSync(path);
}
exports.fileExists = fileExists;
