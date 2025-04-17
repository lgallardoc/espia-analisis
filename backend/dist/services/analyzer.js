"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableAnalyzer = void 0;
exports.analyzeTable = analyzeTable;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const promises_1 = __importDefault(require("fs/promises"));
class TableAnalyzer {
    constructor() {
        this.mapping = [];
        this.isLoaded = false;
    }
    async getAvailableFiles() {
        try {
            const files = await promises_1.default.readdir(process.env.PROD_DIR);
            return files
                .filter((file) => file.endsWith('.csv'))
                .map((file) => this.parseFilename(file));
        }
        catch (error) {
            console.error('[FINDER] Error al listar archivos:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    static async getInstance() {
        if (!TableAnalyzer.instance) {
            TableAnalyzer.instance = new TableAnalyzer();
            await TableAnalyzer.instance.loadMapping();
        }
        return TableAnalyzer.instance;
    }
    async loadMapping() {
        if (this.isLoaded)
            return;
        console.log(`[BOOT] Cargando mapeo de índices desde: ${process.env.MAPPING_FILE}`);
        try {
            await new Promise((resolve, reject) => {
                (0, fs_1.createReadStream)(process.env.MAPPING_FILE)
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (data) => {
                    this.mapping.push({
                        Libreria: data.Libreria,
                        Objeto: data.Objeto,
                        'Nombre campo clave': data['Nombre campo clave'],
                        'Numero campo clave': data['Numero campo clave']
                    });
                })
                    .on('end', () => {
                    console.log(`[BOOT] Mapeo cargado. Total de índices: ${this.mapping.length}`);
                    this.isLoaded = true;
                    resolve();
                })
                    .on('error', reject);
            });
        }
        catch (error) {
            console.error('[BOOT] Error crítico al cargar mapeo:', error);
            throw new Error('No se pudo cargar el archivo de mapeo de índices');
        }
    }
    async analyzeTable(esquemaCompleto, tabla) {
        if (!this.isLoaded) {
            throw new Error('El mapeo de índices no está cargado');
        }
        const esquema = esquemaCompleto.slice(0, -2);
        console.log(`[ANALYZER] Buscando mapeo para: ${esquema}.${tabla}`);
        const tableMapping = this.getTableMapping(esquema, tabla);
        if (!tableMapping['Nombre campo clave'] && !tableMapping['Numero campo clave']) {
            throw new Error(`No existe índice definido para ${esquemaCompleto}.${tabla}`);
        }
        const files = await this.findTableFiles(esquemaCompleto, tabla);
        if (files.length === 0) {
            throw new Error(`No se encontraron archivos para ${esquemaCompleto}.${tabla}`);
        }
        const results = {};
        for (const file of files) {
            console.log(`[PROCESS] Procesando archivo: ${file.nombreCompleto}`);
            const fileData = await this.processFile(file, tableMapping);
            this.mergeResults(results, fileData, file.pais, tableMapping);
        }
        console.log(`[ANALYZER] Análisis completado. Registros únicos: ${Object.keys(results).length}`);
        return Object.values(results);
    }
    // Cambiar visibilidad de private a public
    async findTableFiles(esquemaCompleto, tabla) {
        try {
            const files = await promises_1.default.readdir(process.env.PROD_DIR);
            return files
                .filter((file) => file.endsWith('.csv'))
                .map((file) => this.parseFilename(file))
                .filter(meta => {
                const match = meta.esquemaCompleto === esquemaCompleto && meta.tabla === tabla;
                if (!match) {
                    console.log(`[FINDER] Archivo no coincide: ${meta.nombreCompleto} (${meta.esquemaCompleto}.${meta.tabla})`);
                }
                return match;
            });
        }
        catch (error) {
            console.error('[FINDER] Error al buscar archivos:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    parseFilename(filename) {
        const [pais, , nodo, esquemaCompleto, tabla, fechaStr] = filename.split('_');
        const esquema = esquemaCompleto.slice(0, -2);
        return {
            nombreCompleto: filename,
            pais,
            nodo,
            esquema,
            esquemaCompleto,
            tabla,
            fecha: `${fechaStr.slice(0, 4)}-${fechaStr.slice(4, 6)}-${fechaStr.slice(6, 8)}`
        };
    }
    getTableMapping(esquema, tabla) {
        const found = this.mapping.find(m => m.Libreria.slice(0, -2) === esquema && m.Objeto === tabla);
        if (!found) {
            console.error(`[ERROR] No existe mapeo para ${esquema}.${tabla}`);
            return {
                Libreria: esquema,
                Objeto: tabla,
                'Nombre campo clave': '',
                'Numero campo clave': ''
            };
        }
        return found;
    }
    async processFile(file, mapping) {
        const filePath = path_1.default.join(process.env.PROD_DIR, file.nombreCompleto);
        const fileResults = [];
        return new Promise((resolve, reject) => {
            (0, fs_1.createReadStream)(filePath)
                .pipe((0, csv_parser_1.default)())
                .on('data', (data) => {
                fileResults.push(data);
                if (fileResults.length % 100 === 0) {
                    console.log(`[PROCESS] ${file.nombreCompleto}: ${fileResults.length} registros procesados`);
                }
            })
                .on('end', () => {
                console.log(`[PROCESS] ${file.nombreCompleto}: completado con ${fileResults.length} registros`);
                resolve(fileResults);
            })
                .on('error', reject);
        });
    }
    mergeResults(results, fileData, pais, mapping) {
        const campoClave = mapping['Nombre campo clave'] || mapping['Numero campo clave'];
        console.log(`[MERGER] Usando campo clave: ${campoClave}`);
        fileData.forEach((row, index) => {
            const clave = row[campoClave];
            if (!clave) {
                console.warn(`[MERGER] Registro ${index} sin clave válida en ${pais}`);
                return;
            }
            if (!results[clave]) {
                console.log(`[MERGER] Nueva llave detectada: ${clave}`);
                results[clave] = { clave };
            }
            Object.keys(row).forEach(campo => {
                if (!results[clave][campo]) {
                    results[clave][campo] = {};
                }
                results[clave][campo][pais] = row[campo];
            });
        });
    }
}
exports.TableAnalyzer = TableAnalyzer;
// Modificar el manejo de errores en analyzeTable
async function analyzeTable(req, res) {
    try {
        const { esquema, tabla } = req.body;
        console.log('[API] Solicitud recibida:', { esquema, tabla });
        const analyzer = await TableAnalyzer.getInstance();
        const results = await analyzer.analyzeTable(esquema, tabla);
        res.json(results);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[API] Error:', errorMessage);
        const statusCode = errorMessage.includes('No existe índice') ? 400 : 500;
        res.status(statusCode).json({
            error: errorMessage,
            details: `No se pudo analizar ${req.body.esquema}.${req.body.tabla}`
        });
    }
}
