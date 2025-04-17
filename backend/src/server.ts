import express from 'express';
import cors from 'cors';
import router from './routes';
import 'dotenv/config';
import { TableAnalyzer } from './services/analyzer';

const app = express();

// Precargar índices al iniciar
TableAnalyzer.getInstance()
  .then(() => {
    console.log('[BOOT] Mapeo de índices cargado correctamente');
  })
  .catch((error) => {
    console.error('[BOOT] Error crítico al cargar índices:', error);
    process.exit(1);
  });

// Configuración middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use(router);

// Manejo de errores global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[APP] Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[BOOT] Servidor iniciado en http://localhost:${PORT}`);
});