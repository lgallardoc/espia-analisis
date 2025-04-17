"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTable = exports.getFiles = void 0;
const analyzer_1 = require("../services/analyzer");
const getFiles = async (req, res) => {
    try {
        const analyzer = await analyzer_1.TableAnalyzer.getInstance();
        // Usar el nuevo método público getAvailableFiles
        const files = await analyzer.getAvailableFiles();
        res.json(files);
    }
    catch (error) {
        console.error('[CONTROLLER] Error en getFiles:', error instanceof Error ? error.message : String(error));
        res.status(500).json({ error: 'Error al leer archivos' });
    }
};
exports.getFiles = getFiles;
const analyzeTable = async (req, res) => {
    try {
        const { esquema, tabla } = req.body;
        if (!esquema || !tabla) {
            return res.status(400).json({ error: 'Faltan parámetros: esquema y tabla son requeridos' });
        }
        const analyzer = await analyzer_1.TableAnalyzer.getInstance();
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
};
exports.analyzeTable = analyzeTable;
