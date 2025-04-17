// Usa require en lugar de import si persiste el error
const csv = require('csv-parser');
import { createReadStream } from 'fs';

export const processCsvFile = async (filePath: string): Promise<any[]> => {
  const results: any[] = [];
  return new Promise((resolve, reject) => {
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: any) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};