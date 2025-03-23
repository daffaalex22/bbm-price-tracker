import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { processData } from './dataProcessor.js';

const app = express();
app.use(cors());
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static('public'));

app.get('/api/prices', async (req, res) => {
    try {
        const data = await fs.readFile('./data/sample-results.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/keep-alive', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Initialize data processing and start server
processData().then(() => {
    app.listen(3000, () => {
        console.log('Server running at http://localhost:3000');
    });
}).catch(error => {
    console.error('Failed to process initial data:', error);
    process.exit(1);
});