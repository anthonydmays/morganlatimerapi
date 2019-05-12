"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var storage_1 = require("@google-cloud/storage");
var storage = new storage_1.Storage();
function readFile(bucket, name) {
    return new Promise(function (resolve, reject) {
        var file = storage.bucket(bucket).file(name);
        var stream = file.createReadStream();
        var buf = '';
        stream
            .on('data', function (d) {
            buf += d;
        })
            .on('error', function (err) {
            reject(err);
        })
            .on('end', function () {
            resolve(buf);
        });
    });
}
exports.readFile = readFile;
function writeFile(bucket, name, content) {
    return new Promise(function (resolve, reject) {
        var file = storage.bucket(bucket).file(name);
        var stream = file.createWriteStream();
        stream
            .on('error', function (err) {
            reject(err);
        })
            .on('finish', function () {
            resolve();
        });
        stream.end(content);
    });
}
exports.writeFile = writeFile;
exports.CONFIG_BUCKET = 'morganlatimerapi-config';
//# sourceMappingURL=gcloud-storage-utils.js.map