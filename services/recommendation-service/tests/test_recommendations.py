import sys
import os

# Add service directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.engine import recommender

sample_catalog = [
    {
        '_id': 'prod_1',
        'name': 'Men Round Neck Pure Cotton T-shirt',
        'description': 'Lightweight cotton t-shirt with round neck',
        'category': 'Men',
        'subCategory': 'Topwear',
        'price': 25.0,
        'bestseller': True,
        'averageRating': 4.5
    },
    {
        '_id': 'prod_2',
        'name': 'Men Slim Fit Winter Jacket',
        'description': 'Warm fleece-lined winter jacket for men',
        'category': 'Men',
        'subCategory': 'Winterwear',
        'price': 85.0,
        'bestseller': False,
        'averageRating': 4.0
    },
    {
        '_id': 'prod_3',
        'name': 'Women High Waist Cotton Pants',
        'description': 'Stylish bottomwear cotton pants for women',
        'category': 'Women',
        'subCategory': 'Bottomwear',
        'price': 40.0,
        'bestseller': True,
        'averageRating': 4.8
    }
]

def test_cold_start_recommendations():
    """Validates cold start returns top rated / bestsellers without user history."""
    recs = recommender.recommend(sample_catalog, user_id=None, events=[], limit=2)
    assert len(recs) == 2
    assert recs[0]['score'] > 0
    assert 'Trending' in recs[0]['reason'] or 'Popular' in recs[0]['reason']

def test_product_similarity_recommendations():
    """Validates recommendations similar to currently viewed item."""
    recs = recommender.recommend(sample_catalog, product_id='prod_1', limit=2)
    assert len(recs) == 2
    # The viewed product itself should not be returned
    assert all(r['product_id'] != 'prod_1' for r in recs)
    assert any('Men' in r['reason'] for r in recs)

def test_collaborative_behavioral_boost():
    """Validates user events boost affinity for interacted categories."""
    events = [
        {'event_type': 'view', 'product_id': 'prod_3'},
        {'event_type': 'add_to_cart', 'product_id': 'prod_3'}
    ]
    recs = recommender.recommend(sample_catalog, user_id='u1', events=events, limit=3)
    assert len(recs) > 0
    assert any('browsing and shopping' in r['reason'] or 'Similar' in r['reason'] for r in recs)

def test_empty_catalog():
    """Handles empty catalog gracefully."""
    recs = recommender.recommend([], user_id='u1', limit=5)
    assert recs == []

if __name__ == '__main__':
    test_cold_start_recommendations()
    test_product_similarity_recommendations()
    test_collaborative_behavioral_boost()
    test_empty_catalog()
    print("All recommendation engine tests passed successfully!")
