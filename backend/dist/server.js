"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
require("dotenv/config");
const analyzer_1 = require("./services/analyzer");
const app = (0, express_1.default)();
// Precargar índices al iniciar
analyzer_1.TableAnalyzer.getInstance()
    .then(() => {
    console.log('[BOOT] Mapeo de índices cargado correctamente');
})
    .catch((error) => {
    console.error('[BOOT] Error crítico al cargar índices:', error);
    process.exit(1);
});
// Configuración middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rutas
app.use(routes_1.default);
// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('[APP] Error no manejado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`[BOOT] Servidor iniciado en http://localhost:${PORT}`);
});
