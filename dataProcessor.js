import 'dotenv/config';
import { CohereClientV2 } from 'cohere-ai';
import { promises as fs } from 'fs';
import { extract } from '@extractus/article-extractor';

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
                "<fuel name (RON/CN)>": "Rp <price>",
                ...
            },
            "Shell": {
                "<fuel name (RON/CN)>": "Rp <price>",
                ...
            },
            "BP-AKR": {
                "<fuel name (RON/CN)>": "Rp <price>",
                ...
            },
            "Vivo": {
                "<fuel name (RON/CN)>": "Rp <price>",
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