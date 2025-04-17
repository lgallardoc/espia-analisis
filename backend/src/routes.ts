import { Router } from 'express';
import { getFiles, analyzeTable } from './controllers/analysis';

const router = Router();

router.get('/api/files', getFiles);
router.get('/api/analyze-table', analyzeTable);

export default router;