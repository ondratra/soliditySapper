"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// run:
// node --harmony-async-await build.js
var misc_1 = require("./misc");
var path = require('path');
var fs = require('fs');
var browserify = require('browserify');
var watchify = require('watchify');
var tsify = require('tsify');
var errorify = require('errorify');
var cssModulesify = require('css-modulesify');
var yargsLib = require('yargs');
/////////////////// Browserify plugins /////////////////////////////////////////
function pluginsCommon(outputDir, outputFile) {
    var tsconfigRelevant = JSON.parse(misc_1.readFile(__dirname + '/../tsconfig.json')).compilerOptions;
    return function (browserifyInstance) { return browserifyInstance
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
    }); };
}
function pluginsWatchify(outputDir, outputFile) {
    return function (browserifyInstance) { return browserifyInstance.plugin(watchify, {
        ignoreWatch: ['**/node_modules/**']
    }).on('update', function () {
        console.log('rebundling');
        //browserifyInstance.bundle().pipe(fs.createWriteStream(jsOutputPath));
        browserifyBundle(outputDir, outputFile)(browserifyInstance);
    }); };
}
/////////////////// Browserify init and bundle /////////////////////////////////
function browserifyBundle(outputDir, outputFile) {
    return function (browserifyInstance) { return browserifyInstance
        .bundle()
        .pipe(fs.createWriteStream(outputDir + '/' + outputFile + '.js')); };
}
function getBrowserify(inputRootDir, sourceFile) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, browserify({
                    debug: true,
                    //entries: [inputRootDir + "/" + sourceFile],
                    entries: [sourceFile],
                    cache: {},
                    packageCache: {},
                    // TODO: decide how to pass parameter
                    basedir: inputRootDir
                })];
        });
    });
}
function build(inputRootDir, inputFile, outputDir) {
    var outputFile = path.basename(inputFile, path.extname(inputFile));
    return getBrowserify(inputRootDir, inputFile)
        .then(pluginsCommon(outputDir, outputFile))
        .then(browserifyBundle(outputDir, outputFile));
}
exports.build = build;
function watch(inputRootDir, inputFile, outputDir) {
    var outputFile = path.basename(inputFile, path.extname(inputFile));
    return getBrowserify(inputRootDir, inputFile)
        .then(pluginsCommon(outputDir, outputFile))
        .then(pluginsWatchify(outputDir, outputFile))
        .then(browserifyBundle(outputDir, outputFile));
}
exports.watch = watch;
