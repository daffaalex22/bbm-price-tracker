require('dotenv').config();
const cohere = require('cohere-ai');

// Initialize the client with environment variable
const cohereClient = cohere.init(process.env.COHERE_API_KEY);

// Example function to generate text
async function generateSummary(text) {
    try {
        const response = await cohereClient.generate({
            model: 'command',
            prompt: `Convert this fuel price update into a JSON format with the following structure:
            {
              "date": "YYYY-MM",
              "currency": "IDR",
              "exchange_rate_usd": <rate>,
              "pertamina": {
                "Pertalite_RON_90": <price>,
                ...other products
              },
              "shell": {
                "Super": <price>,
                ...other products
              },
              "bp_akr": {
                "prices_announced": <boolean>
              }
            }

            Text to convert: ${text}`,
            max_tokens: 500,
            temperature: 0.1,
            format: 'json'
        });
        
        const generatedText = response.body.generations[0].text;
        return JSON.parse(generatedText);
    } catch (error) {
        console.error('Error generating structured data:', error);
        throw error;
    }
}

module.exports = {
    generateSummary,
    cohereClient
};
