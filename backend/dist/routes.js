"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analysis_1 = require("./controllers/analysis");
const router = (0, express_1.Router)();
router.get('/api/files', analysis_1.getFiles);
router.post('/api/analyze-table', analysis_1.analyzeTable);
exports.default = router;
