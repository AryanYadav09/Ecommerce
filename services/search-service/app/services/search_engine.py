import re
import math
import hashlib
from functools import lru_cache
from collections import OrderedDict
from typing import List, Dict, Any, Tuple

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

CATEGORIES = ['men', 'women', 'kids']
SUBCATEGORIES = {
    'topwear': ['shirt', 't-shirt', 'top', 'kurti', 'tee'],
    'bottomwear': ['pant', 'pants', 'trousers', 'palazzo', 'jeans'],
    'winterwear': ['jacket', 'sweater', 'hoodie', 'coat', 'sweatshirt']
}
SIZES = ['s', 'm', 'l', 'xl', 'xxl']

# Precompiled regex patterns for query parsing
RE_BETWEEN = re.compile(r'(?:between|from)\s*₹?\s*(\d+)\s*(?:and|to|-)\s*₹?\s*(\d+)')
RE_UNDER = re.compile(r'(?:under|below|less than|<=?)\s*₹?\s*(\d+)')
RE_ABOVE = re.compile(r'(?:above|over|more than|>=?)\s*₹?\s*(\d+)')
RE_CATEGORIES = {cat: re.compile(rf'\b{cat}\b') for cat in CATEGORIES}
RE_SUBCATEGORIES = {
    sub: [re.compile(rf'\b{syn}\b') for syn in synonyms]
    for sub, synonyms in SUBCATEGORIES.items()
}
RE_SIZES = {sz: re.compile(rf'\bsize\s*{sz}\b|\b{sz}\s*size\b') for sz in SIZES}
RE_CLEAN_UNDER = re.compile(r'under\s*₹?\s*\d+')
RE_CLEAN_BELOW = re.compile(r'below\s*₹?\s*\d+')
RE_CLEAN_BETWEEN = re.compile(r'between\s*₹?\s*\d+\s*(?:and|to)\s*₹?\s*\d+')
RE_CLEAN_SIZE = re.compile(r'size\s*[a-z0-9]+')
RE_WORDS = re.compile(r'\b[a-z0-9]+\b')
STOP_WORDS = frozenset({'for', 'in', 'with', 'the', 'a', 'an', 'and', 'or', 'to', 'of', 'under', 'below'})

# Search result cache
_SEARCH_CACHE: Dict[str, Any] = OrderedDict()
_MAX_SEARCH_CACHE = 64

def _get_catalog_signature(catalog: List[Dict[str, Any]]) -> str:
    sig = "|".join(f"{p.get('_id') or p.get('id') or ''}:{p.get('price', '')}" for p in catalog)
    return hashlib.md5(sig.encode('utf-8')).hexdigest()

@lru_cache(maxsize=256)
def _cached_parse_query_intent(query: str) -> Dict[str, Any]:
    text = (query or "").lower().strip()
    intent = {
        'max_price': None,
        'min_price': None,
        'category': None,
        'sub_category': None,
        'size': None,
        'keywords': [],
        'sort_preference': None
    }

    # 1. Price extraction
    between_match = RE_BETWEEN.search(text)
    if between_match:
        intent['min_price'] = float(between_match.group(1))
        intent['max_price'] = float(between_match.group(2))
    else:
        under_match = RE_UNDER.search(text)
        if under_match:
            intent['max_price'] = float(under_match.group(1))

        above_match = RE_ABOVE.search(text)
        if above_match:
            intent['min_price'] = float(above_match.group(1))

    # 2. Gender / Category extraction
    for cat, pattern in RE_CATEGORIES.items():
        if pattern.search(text):
            intent['category'] = cat.capitalize()
            break

    # 3. Subcategory extraction
    for sub, patterns in RE_SUBCATEGORIES.items():
        if sub in text or any(p.search(text) for p in patterns):
            intent['sub_category'] = sub.capitalize()
            break

    # 4. Size extraction
    for sz, pattern in RE_SIZES.items():
        if pattern.search(text):
            intent['size'] = sz.upper()
            break

    # 5. Sorting intent
    if any(w in text for w in ['cheap', 'cheapest', 'low price', 'affordable']):
        intent['sort_preference'] = 'price_low_high'
    elif any(w in text for w in ['expensive', 'premium', 'high price']):
        intent['sort_preference'] = 'price_high_low'
    elif any(w in text for w in ['best', 'top rated', 'popular', 'trending']):
        intent['sort_preference'] = 'rating_high'

    # 6. Residual keywords
    cleaned = RE_CLEAN_UNDER.sub('', text)
    cleaned = RE_CLEAN_BELOW.sub('', cleaned)
    cleaned = RE_CLEAN_BETWEEN.sub('', cleaned)
    cleaned = RE_CLEAN_SIZE.sub('', cleaned)
    words = [w for w in RE_WORDS.findall(cleaned) if w not in STOP_WORDS and len(w) > 1]
    intent['keywords'] = words

    return intent

class IntelligentSearchEngine:
    def parse_query_intent(self, query: str) -> Dict[str, Any]:
        return _cached_parse_query_intent(query)

    def search(self, query: str, catalog: List[Dict[str, Any]], limit: int = 20) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        if not query or not query.strip():
            intent = self.parse_query_intent("")
            return intent, catalog[:limit]

        cat_sig = _get_catalog_signature(catalog)
        cache_key = f"{query.strip().lower()}|{cat_sig}|{limit}"
        if cache_key in _SEARCH_CACHE:
            _SEARCH_CACHE.move_to_end(cache_key)
            return _SEARCH_CACHE[cache_key]

        intent = self.parse_query_intent(query)
        scored_results = []

        keywords = intent['keywords']
        max_price = intent['max_price']
        min_price = intent['min_price']
        cat_filter = intent['category']
        sub_filter = intent['sub_category']

        for prod in catalog:
            name = (prod.get('name') or '').lower()
            desc = (prod.get('description') or '').lower()
            cat = (prod.get('category') or '').capitalize()
            sub = (prod.get('subCategory') or prod.get('sub_category') or '').capitalize()
            price = float(prod.get('price') or 0.0)
            sizes = [str(s).upper() for s in (prod.get('sizes') or [])]

            score = 0.0
            reasons = []

            # 1. Price constraint check
            if max_price is not None:
                if price <= max_price:
                    score += 5.0
                    reasons.append(f"Within budget (₹{price} <= ₹{max_price})")
                else:
                    # Hard penalty for products exceeding price constraint
                    score -= 50.0

            if min_price is not None:
                if price >= min_price:
                    score += 2.0
                else:
                    score -= 50.0

            # 2. Category matching
            if cat_filter:
                if cat.lower() == cat_filter.lower():
                    score += 8.0
                    reasons.append(f"Matches category: {cat}")
                else:
                    score -= 10.0

            # 3. Subcategory matching
            if sub_filter:
                if sub.lower() == sub_filter.lower():
                    score += 8.0
                    reasons.append(f"Matches type: {sub}")

            # 4. Keyword matching
            matched_keywords = []
            for kw in keywords:
                if kw in name:
                    score += 6.0
                    matched_keywords.append(kw)
                elif kw in sub.lower():
                    score += 4.0
                    matched_keywords.append(kw)
                elif kw in desc:
                    score += 2.0
                    matched_keywords.append(kw)

            if matched_keywords:
                reasons.append(f"Keyword match: {', '.join(set(matched_keywords))}")

            # 5. Size matching
            if intent['size'] and intent['size'] in sizes:
                score += 3.0
                reasons.append(f"Available in size {intent['size']}")

            # 6. Quality boost
            if prod.get('bestseller'):
                score += 1.0

            rating = float(prod.get('averageRating') or 0.0)
            if rating > 0:
                score += (rating / 5.0)

            if score > 0:
                scored_results.append({
                    'item': prod,
                    'score': round(score, 2),
                    'match_reasons': reasons
                })

        # Apply sorting preference if parsed
        if intent['sort_preference'] == 'price_low_high':
            scored_results.sort(key=lambda x: float(x['item'].get('price', 0)))
        elif intent['sort_preference'] == 'price_high_low':
            scored_results.sort(key=lambda x: float(x['item'].get('price', 0)), reverse=True)
        elif intent['sort_preference'] == 'rating_high':
            scored_results.sort(key=lambda x: float(x['item'].get('averageRating', 0)), reverse=True)
        else:
            scored_results.sort(key=lambda x: x['score'], reverse=True)

        ranked_products = [entry['item'] for entry in scored_results[:limit]]
        result = (intent, ranked_products)

        if len(_SEARCH_CACHE) >= _MAX_SEARCH_CACHE:
            _SEARCH_CACHE.popitem(last=False)
        _SEARCH_CACHE[cache_key] = result

        return result

search_engine = IntelligentSearchEngine()
