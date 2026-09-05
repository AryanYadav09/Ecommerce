import math
from typing import List, Dict, Any, Optional

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

EVENT_WEIGHTS = {
    'purchase': 5.0,
    'add_to_cart': 3.0,
    'wishlist': 2.5,
    'view': 1.0,
    'search': 0.8
}

def clean_text(text: str) -> str:
    return (text or "").lower().strip()

def get_product_id(prod: Dict[str, Any]) -> str:
    return str(prod.get('_id') or prod.get('id') or '')

def compute_similarity_matrix(catalog: List[Dict[str, Any]]):
    """Computes pairwise cosine similarity between products based on text metadata."""
    corpus = [
        f"{p.get('name', '')} {p.get('category', '')} {p.get('subCategory', '')} {p.get('description', '')}"
        for p in catalog
    ]

    if SKLEARN_AVAILABLE and len(corpus) > 0:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)
        return cosine_similarity(tfidf_matrix, tfidf_matrix)

    # Pure Python TF-IDF fallback
    vocab = {}
    docs_words = []
    for text in corpus:
        words = [w for w in clean_text(text).split() if len(w) > 2]
        docs_words.append(words)
        for w in set(words):
            vocab[w] = vocab.get(w, 0) + 1

    num_docs = len(corpus)
    matrix = []
    for words in docs_words:
        vec = {}
        for w in words:
            tf = words.count(w) / max(len(words), 1)
            idf = math.log((num_docs + 1) / (vocab.get(w, 0) + 1)) + 1
            vec[w] = tf * idf
        matrix.append(vec)

    sim = [[0.0] * num_docs for _ in range(num_docs)]
    for i in range(num_docs):
        for j in range(num_docs):
            if i == j:
                sim[i][j] = 1.0
                continue
            common = set(matrix[i].keys()) & set(matrix[j].keys())
            dot = sum(matrix[i][w] * matrix[j][w] for w in common)
            norm_i = math.sqrt(sum(v * v for v in matrix[i].values()))
            norm_j = math.sqrt(sum(v * v for v in matrix[j].values()))
            if norm_i > 0 and norm_j > 0:
                sim[i][j] = dot / (norm_i * norm_j)
    return sim

class HybridRecommendationEngine:
    def recommend(
        self,
        catalog: List[Dict[str, Any]],
        user_id: Optional[str] = None,
        product_id: Optional[str] = None,
        events: Optional[List[Dict[str, Any]]] = None,
        limit: int = 8
    ) -> List[Dict[str, Any]]:
        if not catalog:
            return []

        events = events or []
        target_prod_id = str(product_id) if product_id else None

        # Build ID index lookup
        id_to_idx = {get_product_id(p): i for i, p in enumerate(catalog)}
        sim_matrix = compute_similarity_matrix(catalog)

        # 1. Content-based scoring
        content_scores = [0.0] * len(catalog)
        if target_prod_id and target_prod_id in id_to_idx:
            target_idx = id_to_idx[target_prod_id]
            for j in range(len(catalog)):
                if j != target_idx:
                    content_scores[j] = float(sim_matrix[target_idx][j])

        # 2. Collaborative / behavioral scoring
        collab_scores = [0.0] * len(catalog)
        category_affinity = {}
        interacted_prod_ids = set()

        for ev in events:
            ev_type = ev.get('event_type')
            weight = EVENT_WEIGHTS.get(ev_type, 1.0)
            pid = str(ev.get('product_id') or '')
            if pid and pid in id_to_idx:
                interacted_prod_ids.add(pid)
                idx = id_to_idx[pid]
                prod = catalog[idx]
                cat = prod.get('category')
                if cat:
                    category_affinity[cat] = category_affinity.get(cat, 0.0) + weight

                # Propagate similarity from interacted items
                for j in range(len(catalog)):
                    if j != idx:
                        collab_scores[j] += float(sim_matrix[idx][j]) * weight

        # Normalize collaborative scores
        max_collab = max(collab_scores) if collab_scores and max(collab_scores) > 0 else 1.0
        norm_collab = [s / max_collab for s in collab_scores]

        # 3. Combine scores into hybrid ranking
        scored_items = []
        is_cold_start = len(events) == 0 and not target_prod_id

        for idx, prod in enumerate(catalog):
            pid = get_product_id(prod)
            if pid == target_prod_id:
                continue  # Don't recommend the item the user is currently viewing

            cat = prod.get('category')
            cat_boost = 0.2 if cat and cat in category_affinity else 0.0
            bestseller_boost = 0.15 if prod.get('bestseller') else 0.0

            if is_cold_start:
                # Cold start: prioritize bestsellers and average rating
                final_score = (0.6 if prod.get('bestseller') else 0.3) + (float(prod.get('averageRating', 0)) / 10.0)
                reason = "Trending bestseller pick" if prod.get('bestseller') else "Popular customer favorite"
            elif target_prod_id:
                # Item similarity dominant
                final_score = (0.7 * content_scores[idx]) + (0.3 * norm_collab[idx]) + cat_boost
                reason = f"Similar to current item in {prod.get('category', 'collection')}"
            else:
                # User personalization dominant
                final_score = (0.6 * norm_collab[idx]) + (0.3 * cat_boost) + bestseller_boost
                reason = "Based on your browsing and shopping interests"

            scored_items.append({
                'product_id': pid,
                'score': round(final_score, 3),
                'reason': reason,
                'product': prod
            })

        # Sort descending by score
        scored_items.sort(key=lambda x: x['score'], reverse=True)
        return scored_items[:limit]

recommender = HybridRecommendationEngine()
