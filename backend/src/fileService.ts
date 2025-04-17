import fs from 'fs/promises';

interface FileData {
  nombreCompleto: string;
  pais: string;
  entorno: string;
  nodo: string;
  esquema: string;
  tabla: string;
  fecha: string;
}

export const analyzeFiles = async (dirPath: string): Promise<FileData[]> => {
  try {
    const files = await fs.readdir(dirPath);
    return files
      .filter((file: string) => file.endsWith('.csv'))
      .map((file: string) => {
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
  } catch (error) {
    console.error('[FILE SERVICE] Error al analizar archivos:', error);
    throw error;
  }
};