import 'dotenv/config';
import { CohereClientV2 } from 'cohere-ai';

const cohere = new CohereClientV2({
    token: process.env.COHERE_API_KEY,
});

export async function summarizeText(inputText, documents) {
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
