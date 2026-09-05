import axios from 'axios';
import { listProducts } from './productService.js';
import { getEventsForUser } from './eventService.js';

const RECOMMENDATION_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8001';
const SEARCH_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:8002';
const AI_TIMEOUT_MS = 2500;

export const getRecommendations = async ({ userId = null, productId = null, limit = 8 }) => {
  try {
    const products = await listProducts();
    const userEvents = userId ? await getEventsForUser(userId) : [];

    // Call Python Recommendation Service
    const response = await axios.post(
      `${RECOMMENDATION_URL}/recommendations`,
      {
        user_id: userId,
        product_id: productId,
        limit,
        catalog: products,
        events: userEvents
      },
      { timeout: AI_TIMEOUT_MS }
    );

    if (response.data && Array.isArray(response.data.recommendations)) {
      return {
        source: 'ai-microservice',
        recommendations: response.data.recommendations
      };
    }
  } catch (error) {
    console.warn(`[AIGateway] Recommendation service unavailable (${error.message}). Falling back to catalog engine.`);
  }

  // Graceful Fallback Strategy: Cold-start / popular / category similarity
  const catalog = await listProducts();
  let candidateProducts = [...catalog];

  if (productId) {
    const current = catalog.find((p) => p.id === productId || p._id === productId);
    if (current) {
      candidateProducts = candidateProducts.filter((p) => p.id !== current.id && p._id !== current._id);
      const sameCategory = candidateProducts.filter((p) => p.category === current.category);
      if (sameCategory.length > 0) {
        candidateProducts = sameCategory;
      }
    }
  }

  // Sort bestsellers first
  const fallbackList = candidateProducts
    .sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0))
    .slice(0, limit)
    .map((p) => ({
      product_id: p._id || p.id,
      product: p,
      score: p.bestseller ? 0.95 : 0.80,
      reason: p.bestseller ? 'Best Seller Pick' : 'Popular in Catalog'
    }));

  return {
    source: 'fallback-engine',
    recommendations: fallbackList
  };
};

export const performIntelligentSearch = async ({ query, userId = null, limit = 20 }) => {
  const normalizedQuery = (query || '').trim();
  if (!normalizedQuery) {
    const all = await listProducts();
    return {
      query: '',
      source: 'catalog',
      parsed_intent: {},
      results: all.slice(0, limit)
    };
  }

  try {
    const catalog = await listProducts();
    const response = await axios.post(
      `${SEARCH_URL}/search`,
      {
        query: normalizedQuery,
        user_id: userId,
        limit,
        catalog
      },
      { timeout: AI_TIMEOUT_MS }
    );

    if (response.data && Array.isArray(response.data.results)) {
      return {
        query: normalizedQuery,
        source: 'ai-search-microservice',
        parsed_intent: response.data.parsed_intent || {},
        results: response.data.results
      };
    }
  } catch (error) {
    console.warn(`[AIGateway] Search microservice unavailable (${error.message}). Falling back to local semantic filter.`);
  }

  // Graceful Fallback: Query parsing for price constraints and keywords
  const catalog = await listProducts();
  const lower = normalizedQuery.toLowerCase();

  // Extract price intent (e.g. "under 5000", "below 100", "< 50")
  let maxPrice = null;
  const underMatch = lower.match(/(?:under|below|less than|<)\s*₹?\s*(\d+)/i);
  if (underMatch) {
    maxPrice = Number(underMatch[1]);
  }

  // Extract category intent
  const categories = ['men', 'women', 'kids'];
  const matchedCategory = categories.find((c) => lower.includes(c));

  // Extract subcategories
  const subCategories = ['topwear', 'bottomwear', 'winterwear'];
  const matchedSub = subCategories.find((s) => lower.includes(s));

  // Score candidates
  const scored = catalog
    .map((item) => {
      let score = 0;
      const itemName = (item.name || '').toLowerCase();
      const itemDesc = (item.description || '').toLowerCase();
      const itemCat = (item.category || '').toLowerCase();
      const itemSub = (item.subCategory || item.sub_category || '').toLowerCase();

      // Clean terms excluding keywords like 'under', 'below', 'for'
      const terms = lower
        .replace(/under\s*\d+/g, '')
        .replace(/below\s*\d+/g, '')
        .split(/\s+/)
        .filter((t) => t.length > 2 && !['for', 'the', 'and', 'with'].includes(t));

      terms.forEach((term) => {
        if (itemName.includes(term)) score += 3;
        if (itemCat.includes(term)) score += 2;
        if (itemSub.includes(term)) score += 2;
        if (itemDesc.includes(term)) score += 1;
      });

      if (matchedCategory && itemCat === matchedCategory) score += 4;
      if (matchedSub && itemSub === matchedSub) score += 4;

      if (maxPrice !== null) {
        if (item.price <= maxPrice) {
          score += 2;
        } else {
          score -= 10; // Penalize products exceeding price filter
        }
      }

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);

  return {
    query: normalizedQuery,
    source: 'fallback-intent-parser',
    parsed_intent: {
      max_price: maxPrice,
      category: matchedCategory || null,
      sub_category: matchedSub || null
    },
    results: scored
  };
};
