import { Request, Response } from 'express';
import { TableAnalyzer } from '../services/analyzer';

export const getFiles = async (req: Request, res: Response) => {
  try {
    const analyzer = await TableAnalyzer.getInstance();

     // Usar el nuevo método público getAvailableFiles
     const files = await analyzer.getAvailableFiles();
     res.json(files);
   } catch (error: unknown) {
     console.error('[CONTROLLER] Error en getFiles:', error instanceof Error ? error.message : String(error));
     res.status(500).json({ error: 'Error al leer archivos' });
   }
 };

type AnalyzeRequestQuery = {
  esquema: string;
  tabla: string;
};

export const analyzeTable = async (req: Request<null,null,null,AnalyzeRequestQuery>, res: Response) => {
  const { esquema, tabla } = req.query;
  try {
    
    if (!esquema || !tabla) {
      return res.status(401).json({ error: 'Faltan parámetros: esquema y tabla son requeridos' });
    }

    const analyzer = await TableAnalyzer.getInstance();
    const results = await analyzer.analyzeTable(esquema, tabla);
    
    res.json(results);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[API] Error:', errorMessage);
    
    const statusCode = errorMessage.includes('No existe índice') ? 400 : 500;
    res.status(statusCode).json({ 
      error: errorMessage,
      details: `No se pudo analizar ${esquema}.${tabla}`
    });
  }


};

