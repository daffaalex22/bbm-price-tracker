require("dotenv").config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function query(data) {
    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error:", error.message);
        throw error;
    }
}

query({inputs: "I love her so much"}).then((response) => {
    console.log(JSON.stringify(response, null, 2));
}).catch(error => {
    console.error("Failed to get sentiment:", error);
});