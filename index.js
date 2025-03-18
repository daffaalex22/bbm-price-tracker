require("dotenv").config();
const { CohereClientV2 } = require('cohere-ai');
const fs = require('fs').promises;
const { fetchFuelPriceNews } = require('./serp');

const cohere = new CohereClientV2({
    token: process.env.COHERE_API_KEY,
});

async function summarizeText(text) {
    const prompt = `Extract fuel prices from the text and return them in JSON format with this exact structure:
    {
        "date": "<YYYY-MM>",
        "currency": "IDR",
        "usd_exchange_rate": <number>,
        "prices": {
            "Pertamina": {
            "<fuel name (RON/CN)>": <price>,
            ...
            },
            "Shell": {
            "<fuel name (RON/CN)>": <price>,
            ...
            },
            "BP-AKR": {
            "<fuel name (RON/CN)>": <price>,
            ...
            }
        }
    }

    Ensure each company's prices are at the same level under "prices" and not nested within each other.

    ${text}`;

    const response = await cohere.chat({
        messages: [{
            role: 'user',
            content: "Hello"
        }],
        model: 'command-a-03-2025',
        responseFormat: {
            type: 'json_object',
            schema: {
                type: "object",
                required: ["prices"],
                properties: {
                    prices: {
                        type: "object",
                        required: ["Pertamina", "Shell", "BP-AKR"],
                        properties: {
                            Pertamina: {
                                type: "object",
                                required: [
                                    "pertalite",
                                    "pertamax",
                                    "pertamax-turbo",
                                    "pertamina-dex",
                                    "pertamina-dexlite",
                                ],
                                properties: {
                                    "pertalite": {
                                        type: "number"
                                    },
                                    "pertamax": {
                                        type: "number"
                                    },
                                    "pertamax-turbo": {
                                        type: "number"
                                    },
                                    "pertamina-dex": {
                                        type: "number"
                                    },
                                    "pertamina-dexlite": {
                                        type: "number"
                                    }
                                }
                            },
                            Shell: {
                                type: "object",
                                required: [
                                    "super",
                                    "v-power",
                                    "v-power-diesel",
                                ],
                                properties: {
                                    super: {
                                        type: "number"
                                    },
                                    "v-power": {
                                        type: "number"
                                    },
                                    "v-power-diesel": {
                                        type: "number"
                                    }
                                }
                            },
                            "BP-AKR": {
                                type: "object",
                                required: ["bp-92", "bp-ultimate", "bp-diesel"],
                                properties: {
                                    "bp-92": {
                                        type: "number"
                                    },
                                    "bp-ultimate": {
                                        type: "number"
                                    },
                                    "bp-diesel": {
                                        type: "number"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const generatedText = response.message.content[0].text;

    return generatedText;
}

// Main execution
async function main() {
    try {
        const newsArticles = JSON.parse(await fs.readFile('./data/sample-articles.json', 'utf8'));
        console.log('Found news articles:', newsArticles);
        const articleData = JSON.parse(await fs.readFile('./data/sample-article.json', 'utf8'));
        const summary = await summarizeText(articleData.content);
        const jsonData = JSON.parse(summary);

        console.log('Summary:', jsonData);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();