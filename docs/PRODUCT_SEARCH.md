# Product Search Integration - FREE OPTIONS

## Overview
The Shop page now provides **multiple purchase links** for each medicine recommendation, allowing users to compare prices across different platforms.

## Current Implementation (FREE - No API needed)

### Direct Store Links
Each medicine now includes links to:
- **Amazon India** - Search results for the product
- **Flipkart** - Search results for the product  
- **BigHaat** - Agricultural products specialist
- **AgroStar** - Farm input marketplace
- **IndiaMART** - B2B agricultural supplies

**How it works:**
- No API keys required
- Direct search URLs to e-commerce platforms
- Users can see real-time prices and availability
- Works immediately without any configuration

## Optional: Enable Real-Time Product Search

### Option 1: Google Custom Search API (Recommended)
**Free Tier:** 100 queries per day

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Custom Search API"
3. Create credentials (API Key)
4. Create a Custom Search Engine at [Programmable Search Engine](https://programmablesearchengine.google.com/)
5. Configure to search: `amazon.in`, `flipkart.com`, `bighaat.com`
6. Add to `.env`:
```env
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

**Benefits:**
- Gets real product titles and snippets
- Can extract prices from search results
- 100 free searches per day

### Option 2: SerpAPI
**Free Tier:** 100 searches per month

**Setup:**
1. Sign up at [SerpAPI](https://serpapi.com/)
2. Get your API key from dashboard
3. Add to `.env`:
```env
SERP_API_KEY=your_serpapi_key
```

**Benefits:**
- Structured JSON data
- Direct access to Google Shopping results
- Product prices, ratings, reviews
- Images and thumbnails

## API Comparison

| Feature | No API (Current) | Google Custom Search | SerpAPI |
|---------|------------------|---------------------|---------|
| Cost | FREE | FREE (100/day) | FREE (100/month) |
| Setup Time | 0 minutes | 10 minutes | 5 minutes |
| Product Info | Basic links | Titles, snippets | Full details |
| Price Data | No | Manual extraction | Yes |
| Images | No | Limited | Yes |
| Real-time | Yes | Yes | Yes |

## How It Works

### Without API (Default)
```javascript
// Backend generates multi-platform links
purchaseLinks: {
  amazon: "https://www.amazon.in/s?k=mancozeb+fungicide",
  flipkart: "https://www.flipkart.com/search?q=mancozeb+fungicide",
  bighaat: "https://www.bighaat.com/search?q=mancozeb+fungicide"
}
```

### With API (Optional)
```javascript
// Backend fetches real product data
const results = await productSearchService.searchGoogleProducts('mancozeb fungicide');
// Returns: titles, prices, ratings, links
```

## Testing

### Test without API (Works now):
1. Scan a crop image
2. Click "Shop Now" button
3. See medicine recommendations
4. Click "Amazon", "Flipkart", or "BigHaat" buttons
5. Opens search results in new tab

### Test with API:
1. Add API keys to `.env`
2. Restart backend: `npm run dev`
3. Medicines will show enriched data (prices, ratings)

## Recommendation

**For MVP/Testing:** Use current implementation (no API needed) ✅

**For Production:** Add Google Custom Search API for:
- Better product matching
- Price extraction
- Stock availability
- User ratings

## Cost Analysis

### Free Tier Limits
- **Google Custom Search:** 100 queries/day = 3000/month
- **SerpAPI:** 100 queries/month

### If you exceed free tier:
- Google Custom Search: $5 per 1000 queries
- SerpAPI: $50/month for 5000 searches

### Recommendation for 100 users/day:
- Assume 2 product searches per user
- 100 users × 2 searches = 200 searches/day
- Use Google Custom Search (100/day free) + cache results
- Total cost: $0-10/month

## Alternative: Affiliate Marketing

Instead of search APIs, you can:
1. Join Amazon Associates program
2. Generate affiliate links for each product
3. Earn 1-10% commission on sales
4. Add tracking to product links

Example:
```javascript
const affiliateLink = `https://www.amazon.in/dp/B08XYZ123?tag=youraffiliateId`;
```

This way, the feature pays for itself! 💰
