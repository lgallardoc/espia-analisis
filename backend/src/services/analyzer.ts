import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import path from 'path';
import csv from 'csv-parser';
import fs from 'fs/promises';

interface FileMetadata {
  nombreCompleto: string;
  pais: string;
  nodo: string;
  esquema: string;
  esquemaCompleto: string;
  tabla: string;
  fecha: string;
}

interface TableMapping {
  Libreria: string;
  Objeto: string;
  'Nombre campo clave': string;
  'Numero campo clave': string;
}

interface AnalysisResult {
  clave: string;
  [key: string]: any;
}

export class TableAnalyzer {
  private static instance: TableAnalyzer;
  private mapping: TableMapping[] = [];
  private isLoaded: boolean = false;

  private constructor() {}

  public static async getInstance(): Promise<TableAnalyzer> {
    if (!TableAnalyzer.instance) {
      TableAnalyzer.instance = new TableAnalyzer();
      await TableAnalyzer.instance.loadMapping();
    }
    return TableAnalyzer.instance;
  }

  private async loadMapping(): Promise<void> {
    if (this.isLoaded) return;

    console.log(`[BOOT] Cargando mapeo de índices desde: ${process.env.MAPPING_FILE}`);
    
    try {
      await new Promise<void>((resolve, reject) => {
        createReadStream(process.env.MAPPING_FILE!)
          .pipe(csv())
          .on('data', (data: any) => {
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
    } catch (error) {
      console.error('[BOOT] Error crítico al cargar mapeo:', error);
      throw new Error('No se pudo cargar el archivo de mapeo de índices');
    }
  }

  public async getAvailableFiles(): Promise<FileMetadata[]> {
    try {
      const files = await fs.readdir(process.env.PROD_DIR!);
      return files
        .filter((file: string) => file.endsWith('.csv'))
        .map((file: string) => this.parseFilename(file));
    } catch (error) {
      console.error('[FINDER] Error al listar archivos:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  public async findTableFiles(esquemaCompleto: string, tabla: string): Promise<FileMetadata[]> {
    try {
      const files = await fs.readdir(process.env.PROD_DIR!);
      return files
        .filter((file: string) => file.endsWith('.csv'))
        .map((file: string) => this.parseFilename(file))
        .filter(meta => {
          const match = meta.esquemaCompleto.slice(0, -2) === esquemaCompleto && meta.tabla === tabla;
          if (!match) {
            console.log(`[FINDER] Archivo no coincide: ${meta.nombreCompleto} (${meta.esquemaCompleto}.${meta.tabla})`);
          }
          return match;
        });
    } catch (error) {
      console.error('[FINDER] Error al buscar archivos:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async analyzeTable(esquemaCompleto: string, tabla: string): Promise<AnalysisResult[]> {
    if (!this.isLoaded) {
      throw new Error('El mapeo de índices no está cargado');
    }

    const esquema = esquemaCompleto;
    console.log(`[ANALYZER] Buscando mapeo para: ${esquema}.${tabla}`);

    const tableMapping = this.getTableMapping(esquema, tabla);
    const claves = tableMapping['Nombre campo clave']
      ? tableMapping['Nombre campo clave'].split(',').map(clave => clave.trim())
      : tableMapping['Numero campo clave'].split(',').map(clave => clave.trim());

    if (claves.length === 0 || claves.some(clave => !clave)) {
      throw new Error(`No existe índice definido para ${esquemaCompleto}.${tabla}`);
    }
    console.log(`[ANALYZER] índice definido para ${esquemaCompleto}.${tabla} Encontrado`);

    const files = await this.findTableFiles(esquemaCompleto, tabla);
    if (files.length === 0) {
      throw new Error(`No se encontraron archivos para ${esquemaCompleto}.${tabla}`);
    }

    const results: Record<string, AnalysisResult> = {};

    for (const file of files) {
      console.log(`[PROCESS] Procesando archivo: ${file.nombreCompleto}`);
      const fileData = await this.processFile(file, tableMapping);
      this.mergeResults(results, fileData, file.pais, claves);
    }

    console.log(`[ANALYZER] Análisis completado. Registros únicos: ${Object.keys(results).length}`);
    return Object.values(results);
  }

  private getTableMapping(esquema: string, tabla: string): TableMapping {
    const matches = this.mapping.filter(m => 
      m.Libreria === esquema && m.Objeto === tabla
    );
  
    if (matches.length === 0) {
      console.error(`[ERROR] No existe mapeo para ${esquema}.${tabla}`);
      return {
        Libreria: esquema,
        Objeto: tabla,
        'Nombre campo clave': '',
        'Numero campo clave': ''
      };
    }
  
    const nombreCampos = matches
      .map(m => m['Nombre campo clave'])
      .filter(Boolean)
      .join(',');
  
    const numeroCampos = matches
      .map(m => m['Numero campo clave'])
      .filter(Boolean)
      .join(',');
  
    return {
      Libreria: esquema,
      Objeto: tabla,
      'Nombre campo clave': nombreCampos,
      'Numero campo clave': numeroCampos
    };
  }
  

  private async processFile(file: FileMetadata, mapping: TableMapping): Promise<Record<string, any>[]> {
    const filePath = path.join(process.env.PROD_DIR!, file.nombreCompleto);
    const fileResults: any[] = [];
    
    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => {
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

  private mergeResults(
    results: Record<string, AnalysisResult>,
    fileData: any[],
    pais: string,
    claves: string[]
  ): void {
    console.log(`[MERGER] Usando campo clave compuesto: ${claves.join(', ')}`);

    fileData.forEach((row, index) => {
      const clave = claves.map(k => row[k]?.trim() || '').join('|');
   //   if (!clave || clave.includes('|undefined') || clave.includes('|')) {
     //   console.warn(`[MERGER] Registro ${index} sin clave válida en ${pais}`);
     //   return;
      //}

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

  private parseFilename(filename: string): FileMetadata {
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
}

export async function analyzeTable(req: Request, res: Response) {
  try {
    const { esquema, tabla } = req.body;
    console.log('[API] Solicitud recibida:', { esquema, tabla });

    const analyzer = await TableAnalyzer.getInstance();
    const results = await analyzer.analyzeTable(esquema, tabla);
    
    res.json(results);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[API] Error:', errorMessage);
    
    const statusCode = errorMessage.includes('No existe índice') ? 400 : 500;
    res.status(statusCode).json({ 
      error: errorMessage,
      details: `No se pudo analizar ${req.body.esquema}.${req.body.tabla}`
    });
  }
}
