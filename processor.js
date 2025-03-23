import 'dotenv/config';
import { promises as fs } from 'fs';
import serp from './serp.js';
import { summarizeText } from './cohere.js';
import { extract } from '@extractus/article-extractor';

async function saveResults(data, path = './data/sample-results.json') {
    await fs.writeFile(path, JSON.stringify(data, null, 2));
}

export async function processData() {
    try {
        let newsArticles;
        if (process.env.NODE_ENV === 'production') {
            newsArticles = await serp.fetchFuelPriceNews();
            await saveResults(newsArticles, './data/sample-articles.json');
        } else {
            newsArticles = JSON.parse(await fs.readFile('./data/sample-articles.json', 'utf8'));
        }

        const newsUrls = newsArticles.map(article => article.link);

        const extractedContents = {};
        for (let i = 0; i < newsUrls.length; i++) {
            try {
                const extractResult = await extract(newsUrls[i]);
                if (extractResult && extractResult.content) {
                  // Cleaning up the extracted HTML
                    const cleanText = extractResult.content
                        .replace(/<[^>]*>/g, '')
                        .replace(/\s+/g, ' ')
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

        // Cleaning up the markdown code block
        const summaryClean = summary.substring(summary.indexOf('```json')).replace(/^```json\s*/g, '').replace(/\s*```$/g, '');
        const jsonData = JSON.parse(summaryClean);

        await saveResults(jsonData);

        return;
    } catch (error) {
        console.error('Error processing data:', error);
        throw error;
    }
}

// Schedule daily updates at 12 PM
function scheduleDataUpdate() {
    const now = new Date();
    const nextNoon = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        12, 0, 0
    );
    
    if (now > nextNoon) {
        nextNoon.setDate(nextNoon.getDate() + 1);
    }
    
    const msUntilNextUpdate = nextNoon.getTime() - now.getTime();
    
    setTimeout(() => {
        processData()
            .catch(error => console.error('Scheduled data processing failed:', error));
        scheduleDataUpdate(); // Schedule next update
    }, msUntilNextUpdate);
}

export { scheduleDataUpdate };