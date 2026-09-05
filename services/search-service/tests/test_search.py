import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.search_engine import search_engine

sample_catalog = [
    {
        '_id': 'p1',
        'name': 'Men Running Cotton T-Shirt',
        'description': 'Breathable sports t-shirt for running',
        'category': 'Men',
        'subCategory': 'Topwear',
        'price': 40.0,
        'sizes': ['M', 'L']
    },
    {
        '_id': 'p2',
        'name': 'Men Heavy Winter Jacket',
        'description': 'Insulated outdoor jacket for winter',
        'category': 'Men',
        'subCategory': 'Winterwear',
        'price': 120.0,
        'sizes': ['L', 'XL']
    },
    {
        '_id': 'p3',
        'name': 'Women Daily Running Shoes',
        'description': 'Lightweight footwear for jogging',
        'category': 'Women',
        'subCategory': 'Footwear',
        'price': 80.0,
        'sizes': ['M']
    }
]

def test_price_constraint_under():
    intent, results = search_engine.search('men shirt under 50', sample_catalog)
    assert intent['max_price'] == 50.0
    assert intent['category'] == 'Men'
    assert len(results) > 0
    assert results[0]['_id'] == 'p1'
    # Expensive jacket (120) should not appear or should be penalized
    assert all(p['price'] <= 50.0 for p in results)

def test_intent_category_sub_parsing():
    intent = search_engine.parse_query_intent('women winterwear jacket')
    assert intent['category'] == 'Women'
    assert intent['sub_category'] == 'Winterwear'

def test_size_extraction():
    intent = search_engine.parse_query_intent('running t-shirt size M')
    assert intent['size'] == 'M'

def test_empty_query_returns_all():
    intent, results = search_engine.search('', sample_catalog)
    assert len(results) == len(sample_catalog)

if __name__ == '__main__':
    test_price_constraint_under()
    test_intent_category_sub_parsing()
    test_size_extraction()
    test_empty_query_returns_all()
    print("All search engine tests passed successfully!")
