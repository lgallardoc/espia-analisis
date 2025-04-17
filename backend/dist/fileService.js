"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFiles = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const analyzeFiles = async (dirPath) => {
    try {
        const files = await promises_1.default.readdir(dirPath);
        return files
            .filter((file) => file.endsWith('.csv'))
            .map((file) => {
            const [pais, entorno, nodo, esquema, tabla, fechaStr] = file.split('_');
            return {
                nombreCompleto: file,
                pais,
                entorno,
                nodo,
                esquema,
                tabla,
                fecha: `${fechaStr.slice(0, 4)}-${fechaStr.slice(4, 6)}-${fechaStr.slice(6, 8)}`
            };
        });
    }
    catch (error) {
        console.error('[FILE SERVICE] Error al analizar archivos:', error);
        throw error;
    }
};
exports.analyzeFiles = analyzeFiles;
