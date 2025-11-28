const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async (req, res) => {
    try {
        // We can combine multiple feeds here
        const feed = await parser.parseURL('https://feeds.bbci.co.uk/sport/football/rss.xml');
        
        const newsItems = feed.items.slice(0, 10).map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            snippet: item.contentSnippet,
            source: 'BBC Sport'
        }));

        res.status(200).json(newsItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
};