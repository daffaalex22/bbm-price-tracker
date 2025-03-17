require("dotenv").config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Add new imports
const fs = require('fs').promises;

async function summarizeText(text) {
    try {
        const prompt = `Convert this fuel price update into a structured JSON format. Include date (YYYY-MM), currency (IDR), 
        current USD exchange rate, and prices for Pertamina, Shell, and BP-AKR brands. Format numbers as integers without 
        'k' or thousand separators.

        ${text}`;

        const response = await fetch(
            "https://api.cohere.ai/v1/generate",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: 'command',
                    max_tokens: 500,
                    temperature: 0.1,
                    format: 'json'
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        // Parse and validate the generated JSON
        const generatedText = result.generations[0].text;
        // const parsedData = JSON.parse(generatedText);

        return generatedText;
    } catch (error) {
        console.error("Error:", error.message);
        throw error;
    }
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