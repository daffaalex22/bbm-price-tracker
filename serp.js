import { getJson } from 'serpapi';

async function fetchFuelPriceNews() {
    try {
        const response = await getJson({
            api_key: process.env.SERPAPI_API_KEY,
            engine: "google",
            q: "harga bbm pertamina shell bp",
            location: "Indonesia",
            google_domain: "google.co.id",
            gl: "id",
            hl: "id",
            tbm: "nws",  // This parameter is for news results
            num: 5       // Number of results to return
        });

        if (!response.news_results) {
            throw new Error('No news results found');
        }

        // Extract relevant information from news results
        const newsArticles = response.news_results.map(article => ({
            title: article.title,
            link: article.link,
            snippet: article.snippet,
            source: article.source,
            date: article.date
        }));

        return newsArticles;
    } catch (error) {
        console.error('Error fetching news:', error);
        throw error;
    }
}

export default { fetchFuelPriceNews };