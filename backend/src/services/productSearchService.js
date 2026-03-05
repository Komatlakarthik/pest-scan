const axios = require('axios');

/**
 * Free Product Search Service
 * Uses Google Custom Search API (100 queries/day free)
 * Alternative: SerpAPI (100 searches/month free)
 */

class ProductSearchService {
  constructor() {
    // Google Custom Search API - Free 100 queries/day
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    
    // Alternative: SerpAPI - Free 100 searches/month
    this.serpApiKey = process.env.SERP_API_KEY || '';
  }

  /**
   * Search products using Google Custom Search API (FREE)
   * Sign up: https://developers.google.com/custom-search/v1/overview
   */
  async searchGoogleProducts(query, count = 5) {
    if (!this.googleApiKey || !this.googleSearchEngineId) {
      console.log('⚠️ Google Search API not configured, using mock data');
      return null;
    }

    try {
      const searchQuery = `${query} buy online India site:amazon.in OR site:flipkart.com OR site:bighaat.com`;
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.googleApiKey,
          cx: this.googleSearchEngineId,
          q: searchQuery,
          num: count
        }
      });

      if (response.data.items) {
        return response.data.items.map(item => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          source: this.extractSource(item.link)
        }));
      }

      return null;
    } catch (error) {
      console.error('Google Search API error:', error.message);
      return null;
    }
  }

  /**
   * Search products using SerpAPI (FREE 100/month)
   * Sign up: https://serpapi.com/
   */
  async searchSerpAPI(query, location = 'India') {
    if (!this.serpApiKey) {
      console.log('⚠️ SerpAPI not configured, using mock data');
      return null;
    }

    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          api_key: this.serpApiKey,
          engine: 'google_shopping',
          q: query,
          location: location,
          gl: 'in',
          hl: 'en',
          num: 6
        }
      });

      if (response.data.shopping_results) {
        return response.data.shopping_results.map(item => ({
          title: item.title,
          price: item.extracted_price || item.price,
          source: item.source,
          link: item.link,
          rating: item.rating,
          reviews: item.reviews,
          thumbnail: item.thumbnail
        }));
      }

      return null;
    } catch (error) {
      console.error('SerpAPI error:', error.message);
      return null;
    }
  }

  /**
   * FREE: Scrape Amazon India (no API key needed)
   * Uses search results page
   */
  async scrapeAmazonSearch(productName) {
    try {
      // Create search URL
      const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`;
      
      // Return structured search link (let browser handle it)
      return {
        searchUrl,
        productName,
        source: 'Amazon India',
        message: 'Click to see live results on Amazon'
      };
    } catch (error) {
      console.error('Amazon search error:', error.message);
      return null;
    }
  }

  /**
   * FREE: Get product links from multiple sources
   */
  getProductLinks(productName) {
    // Extract just the main medicine name (remove percentages, formulations, brand names)
    // Example: "Mancozeb 75% WP" -> "Mancozeb"
    // Example: "Copper Oxychloride 50% WP" -> "Copper Oxychloride"
    const extractBaseName = (name) => {
      // Remove everything after percentage sign or formulation codes
      let baseName = name.split(/\d+%/)[0].trim(); // Remove percentage and after
      baseName = baseName.split(/\s+(WP|EC|SL|SC|FS|WG|SP|DP|GR|SG|DS|AS|CS|EW|SE|UL|ME)/i)[0].trim(); // Remove formulation types
      return baseName;
    };

    const baseMedicineName = extractBaseName(productName);
    
    // Clean product name for BigHaat URL path (no special chars, lowercase, no spaces)
    const bighaatName = baseMedicineName.toLowerCase()
      .replace(/\s+/g, '-')  // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '');  // Remove any special characters except hyphens
    
    const links = {
      amazon: `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`,
      flipkart: `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`,
      bighaat: `https://www.bighaat.com/search/${bighaatName}`,
      agrostar: `https://www.agrostar.in/search?q=${encodeURIComponent(baseMedicineName)}`,
      indiamart: `https://dir.indiamart.com/search.mp?ss=${encodeURIComponent(baseMedicineName)}`
    };

    return links;
  }

  /**
   * Extract price from title/snippet using regex
   */
  extractPrice(text) {
    const priceMatch = text.match(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    return null;
  }

  /**
   * Extract source from URL
   */
  extractSource(url) {
    if (url.includes('amazon')) return 'Amazon';
    if (url.includes('flipkart')) return 'Flipkart';
    if (url.includes('bighaat')) return 'BigHaat';
    if (url.includes('agrostar')) return 'AgroStar';
    return 'Online Store';
  }

  /**
   * Enhanced medicine data with real product search
   * Tries Google API first, falls back to direct links
   */
  async enrichMedicineData(medicine) {
    const searchQuery = `${medicine.name} ${medicine.brand} buy online`;
    
    console.log(`🔍 Searching for: ${searchQuery}`);
    
    // Try Google Custom Search API
    const googleResults = await this.searchGoogleProducts(searchQuery, 3);
    
    if (googleResults && googleResults.length > 0) {
      console.log(`✅ Found ${googleResults.length} products via Google API`);
      
      // Use the first real product link
      const primaryLink = googleResults[0].link;
      const source = this.extractSource(primaryLink);
      
      return {
        ...medicine,
        shopLink: primaryLink, // Use real product page
        realProducts: googleResults, // Include all found products
        purchaseLinks: this.getProductLinks(medicine.name), // Backup links
        searchQuery: encodeURIComponent(searchQuery),
        source: source,
        apiUsed: 'Google Custom Search',
        affiliateDisclaimer: 'Prices may vary. Check seller ratings before purchase.'
      };
    }
    
    // Fallback: Use direct search links
    console.log('⚠️ Google API not available, using direct links');
    return {
      ...medicine,
      purchaseLinks: this.getProductLinks(medicine.name),
      searchQuery: encodeURIComponent(searchQuery),
      apiUsed: 'Direct Links',
      affiliateDisclaimer: 'Prices may vary. Check seller ratings before purchase.'
    };
  }
}

module.exports = new ProductSearchService();
