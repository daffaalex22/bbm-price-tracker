require("dotenv").config();
const { CohereClientV2 } = require('cohere-ai');
const fs = require('fs').promises;

const cohere = new CohereClientV2({
    token: process.env.COHERE_API_KEY,
});

async function summarizeText(text) {
    const prompt = `Convert this fuel price update into a structured JSON format. Include date (YYYY-MM), currency (IDR), 
    current USD exchange rate, and prices for Pertamina, Shell, and BP-AKR brands. Format numbers as integers without 
    'k' or thousand separators. Don't give me any other text other than the JSON.

    ${text}`;

    const response = await cohere.chat({
        messages: [{
            role: 'user',
            content: prompt
        }],
        model: 'command-a-03-2025',
        responseFormat: {
            type: 'json_object'
        }
    });

    const generatedText = response.message.content[0].text;

    return generatedText;
}

// Main execution
async function main() {
    try {
        const articleData = JSON.parse(await fs.readFile('./data/sample-article.json', 'utf8'));
        const summary = await summarizeText(articleData.content);
        console.log('Summary:', summary);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();