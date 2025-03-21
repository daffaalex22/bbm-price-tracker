import 'dotenv/config';
import { CohereClientV2 } from 'cohere-ai';
import { promises as fs } from 'fs';
import { extract } from '@extractus/article-extractor';
import fetchFuelPriceNews from './serp.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const cohere = new CohereClientV2({
    token: process.env.COHERE_API_KEY,
});

async function summarizeText(inputText, documents) {
    const prompt = `I have some articles from some news source which contain fuel price data. Extract fuel prices from the multiple articles that I provide if there are conflict or different value from different article, stick to the one that's published the latest. Return the result in JSON format with this exact structure:
    {
        "date": "<YYYY-MM>",
        "currency": "IDR",
        "prices": {
            "Pertamina": {
                "<fuel name (RON/CN)>": Rp <price>,
                ...
            },
            "Shell": {
                "<fuel name (RON/CN)>": Rp <price>,
                ...
            },
            "BP-AKR": {
                "<fuel name (RON/CN)>": Rp <price>,
                ...
            },
            "Vivo": {
                "<fuel name (RON/CN)>": Rp <price>,
                ...
            }
        }
    }

    Upon finding conflict in price, pick the one that are backed by most document.

    Ensure each company's prices are at the same level under "prices" and not nested within each other. Also ensure that the price is accurate to the last three digits. Only return a JSON string. Don't do JSON markdown.`;


    const response = await cohere.chat({
        messages: [{
            role: 'user',
            content: prompt
        }],
        model: 'command-a-03-2025',
        documents,
    });

    const generatedText = response.message.content[0].text;

    return generatedText;
}

// Main execution
// TODO: For BP, Shell and Pertamina, just scrape their main site. Can use Google News for Vivo
// TODO: Remove html tags from extracted extracted contents
// TODO: Ask about this problem in Stackoverflow, Cohere Community, Cohere Support
// TODO: Revise the prompting, might have consistent result with better prompts
// TODO: Separate scheduler function and API function
async function main() {
    try {
        // Fetch news articles
        const newsArticles = JSON.parse(await fs.readFile('./data/sample-articles.json', 'utf8'));

        // Obtain news fullcontent
        const newsUrls = newsArticles.map(article => article.link);

        // Summarize text
        const extractedContents = {};
        for (let i = 0; i < newsUrls.length; i++) {
            try {
                const extractResult = await extract(newsUrls[i]);
                if (extractResult && extractResult.content) {
                    const cleanText = extractResult.content
                        .replace(/<[^>]*>/g, '') // Remove HTML tags
                        .replace(/\s+/g, ' ')    // Normalize whitespace
                        .trim();
                    extractedContents[newsUrls[i]] = cleanText;
                }
            } catch (error) {
                console.error(`Error extracting content from ${newsUrls[i]}:`, error);
            }
        }

        const fullArticles = newsArticles.map(article => ({
            ...article,
            content: extractedContents[article.link]
        }));

        const articlesContent = fullArticles.map(article => article.content || "");

        await fs.writeFile(
            './data/sample-full-articles.json',
            JSON.stringify(fullArticles, null, 2)
        );

        const summary = await summarizeText(fullArticles, articlesContent);
        const summaryClean = summary.substring(summary.indexOf('```json')).replace(/^```json\s*/g, '').replace(/\s*```$/g, '');

        console.log("summaryClean", summaryClean)

        const jsonData = JSON.parse(summaryClean)

        console.log('Summary:', jsonData);

        await fs.writeFile(
            './data/sample-results.json',
            JSON.stringify(jsonData, null, 2)
        );
    } catch (error) {
        console.error('Error:', error);
    }
}

const app = express();
app.use(cors());
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files
app.use(express.static('public'));

// Serve the JSON data
app.get('/api/prices', async (req, res) => {
    try {
        const data = await fs.readFile('./data/sample-results.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server after main processing
main().then(() => {
    app.listen(3000, () => {
        console.log('Server running at http://localhost:3000');
    });
});