"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCsvFile = void 0;
// Usa require en lugar de import si persiste el error
const csv = require('csv-parser');
const fs_1 = require("fs");
const processCsvFile = async (filePath) => {
    const results = [];
    return new Promise((resolve, reject) => {
        (0, fs_1.createReadStream)(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};
exports.processCsvFile = processCsvFile;
