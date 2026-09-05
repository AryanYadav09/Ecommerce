# AI-Powered Composable Headless Commerce Platform

An enterprise-grade, composable e-commerce architecture upgraded from a monolithic MERN application. This platform integrates a **React.js Storefront**, **Node.js/Express API Gateway**, **Supabase (PostgreSQL)** as primary application database, **Shopify** for headless commerce & checkout, **Salesforce CRM** for customer lifecycle & case management, and **Python FastAPI microservices** for hybrid AI recommendations and intelligent natural language search.

---

## 1. System Architecture

```
                     ┌──────────────────────────────────────┐
                     │    React.js Customer Storefront      │
                     │       & React Admin Dashboard        │
                     └──────────────────┬───────────────────┘
                                        │ (REST / JSON)
                                        ▼
                     ┌──────────────────────────────────────┐
                     │     Node.js / Express API Gateway    │
                     │    (Auth, Cache, Resilient Router)   │
                     └───────┬──────────┬───────────┬───────┘
                             │          │           │
          ┌──────────────────┼──────────┴───────────┼──────────────────┐
          │                  │                      │                  │
          ▼                  ▼                      ▼                  ▼
  ┌───────────────┐  ┌───────────────┐      ┌───────────────┐  ┌───────────────┐
  │   Supabase    │  │    Shopify    │      │  Salesforce   │  │ Python FastAPI│
  │  PostgreSQL   │  │  Storefront   │      │  Service CRM  │  │ AI Services   │
  │ (Primary App  │  │  & Admin API  │      │ (OAuth2 Sync  │  │ (Recs: 8001,  │
  │     Data)     │  │  + Webhooks   │      │  & Support)   │  │ Search: 8002) │
  └───────────────┘  └───────────────┘      └───────────────┘  └───────────────┘
          ▲                                                            │
          └────────────────────────────────────────────────────────────┘
                         (Event Analytics & Telemetry)
```

---

## 2. Technology Stack & Key Decisions

| Layer | Technology | Role & Why Chosen |
|---|---|---|
| **Frontend Storefront** | React 18, Vite, TailwindCSS | High-performance SPA preserved from original app; augmented with AI search badges & personalized recommendation carousels. |
| **Admin Dashboard** | React 18, Vite, TailwindCSS | Catalog management, order delivery status, plus new **AI Analytics & Salesforce CRM Support** monitoring tabs. |
| **API Gateway** | Node.js, Express.js (ES Modules) | Single entrypoint enforcing authentication, webhook signature verification, rate limiting, and graceful circuit-breaking fallbacks. |
| **Primary Database** | Supabase (PostgreSQL) | Replaced MongoDB to achieve full ACID relational integrity across normalized `users`, `products`, `categories`, `cart_items`, `orders`, `reviews`, `user_events`, and `support_cases`. |
| **Headless Commerce** | Shopify Storefront & Admin APIs | Decouples commerce inventory, product variants, and checkout sessions while keeping secrets server-side. |
| **Enterprise CRM** | Salesforce REST API (OAuth2) | Bi-directional customer contact synchronization, order activity tracking, and automated customer support Case creation. |
| **AI Recommendation** | Python 3.11, FastAPI, Scikit-learn, Pandas | Standalone microservice executing hybrid content-based (TF-IDF cosine similarity) and collaborative filtering (behavioral interaction matrix) with cold-start resolution. |
| **Intelligent Search** | Python 3.11, FastAPI, Scikit-learn | Standalone microservice parsing natural language queries (e.g. *"men jacket under 100"*), extracting price bounds, category intent, and relevance ranking. |

---

## 3. Data Ownership & Separation of Concerns

To prevent data duplication and maintain clear domain boundaries, ownership is strictly defined:

- **Supabase (PostgreSQL)**:
  - Application users, authentication credentials, and profiles
  - Application-specific product metadata, sizes, categories, and reviews
  - Normalized shopping cart items (`cart_items`)
  - Application orders, order history, and payment status
  - Behavioral telemetry events (`user_events`)
  - Local cache of support cases (`support_cases`)
- **Shopify**:
  - Source of truth for commerce products, variants, and global inventory counts
  - Hosted checkout sessions & PCI-compliant transaction processing
  - Real-time order fulfillment events dispatched via secure webhooks
- **Salesforce**:
  - Source of truth for enterprise customer identity (Contacts)
  - Customer interaction timeline and purchase activity
  - Customer service tickets and support lifecycle (Cases)
- **Python AI Microservices**:
  - Stateless inference computing similarity vectors, behavioral affinities, and natural language query intent parsing

---

## 4. API Documentation

### Gateway Endpoints (Node.js `:4000`)

#### Authentication & Profile (`/api/user`)
- `POST /api/user/login`: Email & password login, returns JWT
- `POST /api/user/register/send-otp`: Sends signup OTP email
- `POST /api/user/register/verify-otp`: Verifies OTP, persists user in Supabase, and triggers async Salesforce Contact sync
- `POST /api/user/profile`: Fetches authenticated user profile
- `POST /api/user/wishlist`: Retrieves user wishlist
- `POST /api/user/wishlist/toggle`: Toggles item in wishlist

#### Catalog & Products (`/api/product`)
- `GET /api/product/list`: Lists all catalog items formatted with `_id` and relational category IDs
- `POST /api/product/single`: Retrieves single product details and logs view event
- `POST /api/product/add`: Admin upload with Cloudinary image processing
- `POST /api/product/update`: Admin update for details, price, and stock status
- `POST /api/product/reviews`: Fetches reviews with computed average rating

#### Cart & Orders (`/api/cart`, `/api/order`)
- `POST /api/cart/get`: Fetches normalized cart items as `{ [itemId]: { [size]: quantity } }`
- `POST /api/cart/add`: Upserts item in `cart_items` table
- `POST /api/cart/update`: Adjusts item quantity (or deletes if <= 0)
- `POST /api/order/place`: Creates order in `orders` and `order_items`, clears cart, logs purchase event, and triggers async Salesforce sync
- `POST /api/order/stripe`: Initiates Stripe checkout session
- `POST /api/order/verifyStripe`: Confirms payment and updates order status

#### AI & Intelligent Search (`/api`)
- `POST /api/search`: Natural language query search (e.g. `{"query": "men jacket under 100"}`)
- `POST /api/recommendations`: Hybrid personalized recommendations (e.g. `{"productId": "...", "limit": 4}`)
- `POST /api/events`: Ingests behavioral interaction (`view`, `search`, `add_to_cart`, `purchase`)
- `GET /api/analytics/summary`: AI and commerce telemetry for admin dashboard

#### Headless Commerce & CRM (`/api`)
- `POST /api/webhooks/shopify`: Receives Shopify webhooks with HMAC SHA256 verification
- `GET /api/shopify/products`: Queries headless Shopify Storefront catalog
- `POST /api/support`: Submits customer support inquiry and generates Salesforce CRM Case

---

## 5. MongoDB to Supabase Migration Strategy

The migration from MongoDB to Supabase PostgreSQL was conducted with zero data loss:

1. **Extraction**: Raw documents were extracted from MongoDB Atlas (`14 users`, `16 products`, `10 orders`).
2. **Relational Transformation**:
   - Unique categories were normalized into `categories` (`cat_men`, `cat_women`, `cat_kids`).
   - Embedded product reviews were normalized into `reviews` table.
   - Embedded user `cartData` was split into relational `cart_items` table with composite unique key `(user_id, product_id, size)`.
   - Embedded user `wishlist` arrays were split into `wishlist_items`.
   - Embedded order items arrays were normalized into `order_items` table with foreign key to `orders(id)`.
3. **Execution**: Automated migration executed via `npm run migrate` in `Backend/scripts/migrate-mongodb-to-supabase.js`.
4. **Validation Assertions**:
   - `Users count check: MongoDB=14 | Supabase=14`
   - `Products count check: MongoDB=16 | Supabase=16`
   - `Orders count check: MongoDB=10 | Supabase=10`
   - `Cart items normalized: 12`
   - `Order items normalized: 28`
5. **Backward Compatibility**: All service responses map `id` to `_id` and preserve existing JSON contracts, ensuring the React storefront and admin dashboard require zero breaking changes.

---

## 6. AI Algorithms & Cold-Start Strategy

### Recommendation Engine (`:8001`)
- **Content-Based Similarity**: Computes TF-IDF vectors over product name, category, subcategory, and description. Determines pairwise cosine similarity between items.
- **Collaborative Filtering**: Builds a weighted behavioral affinity matrix from `user_events` (`purchase: 5.0`, `add_to_cart: 3.0`, `wishlist: 2.5`, `view: 1.0`).
- **Hybrid Score**: `FinalScore = 0.6 * CollaborativeAffinity + 0.4 * ContentSimilarity + BestsellerBoost`.
- **Cold-Start Handling**: If a visitor has no event history, the engine automatically falls back to trending catalog items, weighted by bestseller status and customer ratings (`"Trending bestseller pick"` / `"Popular customer favorite"`).

### Intelligent Search Engine (`:8002`)
- **Query Intent Parsing**: Regular expression tokenizers detect price ceilings (`"under 5000"`, `"below 100"`, `"between 50 and 150"`), category keywords (`"men"`, `"women"`, `"kids"`), item types (`"topwear"`, `"jacket"`, `"shoes"`), and sorting preferences (`"cheap"`, `"best"`).
- **Relevance Scoring**: Combines keyword match boosts (+6 name, +4 type, +2 desc) with budget compliance filters. Products exceeding user price ceiling receive hard score penalties.

---

## 7. Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- npm or yarn

### Step 1: Clone Repository & Configure Environment
```bash
git clone <repo-url>
cd EcommerceSite
```

Copy the environment template:
```bash
cp Backend/.env.example Backend/.env
```
Fill in your credentials or keep defaults (the platform includes resilient local fallback adapters for Supabase, Shopify, and Salesforce).

### Step 2: Install Backend Dependencies & Run Migration
```bash
cd Backend
npm install
npm run migrate    # Normalizes MongoDB data into Supabase
npm test           # Runs 21 automated integration tests
npm start          # Starts gateway on http://localhost:4000
```

### Step 3: Start Python AI Microservices
In separate terminal windows:

**Recommendation Service (:8001)**
```bash
cd services/recommendation-service
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8001 --reload
```

**Search Service (:8002)**
```bash
cd services/search-service
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8002 --reload
```

### Step 4: Start Frontend Applications
**Customer Storefront (:5173)**
```bash
cd Frontend
npm install
npm run dev
```

**Admin Dashboard (:5174)**
```bash
cd admin
npm install
npm run dev
```

---

## 8. Software Engineering Interview Guide & Talking Points

When presenting this architecture in technical interviews, speak directly to these design principles:

### Q1: Why did you transition from MongoDB to Supabase / PostgreSQL?
> *"MongoDB was convenient during early prototyping, but e-commerce core data is fundamentally relational: users own orders, orders contain immutable order items, and items reference products and inventory. MongoDB embedded documents led to data duplication, inconsistent cart states, and lacked relational integrity. Supabase provides PostgreSQL's ACID guarantees, foreign key constraints, and relational queries, while offering cloud scalability and optional pgvector embeddings for semantic search."*

### Q2: Why are the AI Recommendation and Search services separate Python microservices instead of running inside Express?
> *"Separation of concerns and language ecosystem alignment. Node.js excels at asynchronous I/O and acting as an API gateway. However, machine learning, natural language processing, vector similarity, and tensor operations are native to the Python ecosystem (NumPy, Pandas, Scikit-learn, PyTorch). By isolating them into microservices, we can scale inference workers horizontally and independently without blocking the Node.js event loop."*

### Q3: What happens if an external integration (Salesforce, Shopify, or Python AI) fails?
> *"We implemented a resilient circuit-breaker and graceful degradation pattern. If the Python AI search service is unreachable or times out (>2.5s), the Node.js gateway falls back to local regex intent parsing and Supabase text filtering without dropping the customer's request. If Salesforce is unavailable during user registration or checkout, the event is saved to the Supabase database and queued for retry, ensuring the customer's checkout is never blocked."*

### Q4: How is security handled in this headless architecture?
> *"Strict credential isolation: Shopify Admin API tokens, Salesforce OAuth secrets, and database service keys are stored exclusively in backend environment variables and NEVER exposed to the React frontend. Webhooks from Shopify are cryptographically validated using HMAC SHA256 timing-safe comparisons. All protected customer routes enforce signed JWT authentication."*

### Q5: What trade-offs were made?
> *"We balanced microservice modularity with operational simplicity. Rather than introducing heavy message brokers like Kafka or complex distributed clusters for a portfolio application, we used clean REST contracts with timeouts, async background event processing, and modular service separation. This keeps the architecture fully demonstrable, highly reliable, and easily explainable without artificial complexity."*
