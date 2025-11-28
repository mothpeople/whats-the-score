const axios = require('axios');
const NodeCache = require('node-cache');

// Cache data for 60 seconds. 
// This prevents you from hitting the API limit if 100 users open the app at once.
const myCache = new NodeCache({ stdTTL: 60 });

// League IDs from API-Football
const LEAGUES = {
    'Premier League': 39,
    'La Liga': 140,
    'Serie A': 135,
    'Ligue 1': 61,
    'SPL (Singapore)': 333,
    'J1 League': 98,
    'K League 1': 292,
    'V.League 1': 307,
    'Champions League': 2,
    'ACL Elite': 17, // Asian Champions League
    'World Cup Qualifiers': 10 // Approximation
};

module.exports = async (req, res) => {
    const { league } = req.query; // The frontend sends ?league=Premier League
    
    // 1. Check Cache
    const cacheKey = `matches_${league || 'all'}`;
    const cachedData = myCache.get(cacheKey);
    if (cachedData) {
        return res.json(cachedData);
    }

    // 2. Prepare API Call
    // If no league selected, we fetch a few popular ones to save bandwidth
    const leagueId = LEAGUES[league];
    
    // Get Today's Date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    try {
        const options = {
            method: 'GET',
            url: 'https://v3.football.api-sports.io/fixtures',
            params: {
                date: today,
                league: leagueId, // If undefined, API might error or return all, handle carefully
                season: '2024'    // You will need to update this annually
            },
            headers: {
                'x-rapidapi-key': process.env.API_KEY, // We set this in Vercel Dashboard later
                'x-rapidapi-host': 'v3.football.api-sports.io'
            }
        };

        // If 'All', we might need a different strategy or multiple calls, 
        // but for free tier safety, let's just fetch live matches globally if 'All'
        if (league === 'All') {
            options.params = { live: 'all' };
            delete options.params.date;
            delete options.params.league;
            delete options.params.season;
        }

        const response = await axios.request(options);
        
        // 3. Save to Cache
        myCache.set(cacheKey, response.data.response);
        
        // 4. Send to Frontend
        res.status(200).json(response.data.response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};