import 'dotenv/config';
import { promises as fs } from 'fs';
import { extract } from '@extractus/article-extractor';
import { summarizeText } from './cohereService.js';

export async function processData() {
    try {
        const newsArticles = JSON.parse(await fs.readFile('./data/sample-articles.json', 'utf8'));
        const newsUrls = newsArticles.map(article => article.link);

        const extractedContents = {};
        for (let i = 0; i < newsUrls.length; i++) {
            try {
                const extractResult = await extract(newsUrls[i]);
                if (extractResult && extractResult.content) {
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
        const summaryClean = summary.substring(summary.indexOf('```json')).replace(/^```json\s*/g, '').replace(/\s*```$/g, '');
        const jsonData = JSON.parse(summaryClean);

        await fs.writeFile(
            './data/sample-results.json',
            JSON.stringify(jsonData, null, 2)
        );

        return jsonData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}