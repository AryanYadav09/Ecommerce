import axios from 'axios';
import 'dotenv/config';

const storeDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || '2024-01';

export const isShopifyConfigured = Boolean(
  storeDomain &&
  storefrontToken &&
  !storeDomain.includes('placeholder') &&
  !storefrontToken.includes('placeholder')
);

/**
 * Execute GraphQL query against Shopify Storefront API
 */
export const queryShopifyStorefront = async (query, variables = {}) => {
  if (!isShopifyConfigured) {
    return {
      data: null,
      warning: 'Shopify Storefront credentials not configured. Running in composable fallback mode.'
    };
  }

  const endpoint = `https://${storeDomain}/api/${apiVersion}/graphql.json`;
  const response = await axios.post(
    endpoint,
    { query, variables },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken
      },
      timeout: 5000
    }
  );

  return response.data;
};

/**
 * Fetch products from Shopify Storefront API
 */
export const getShopifyProducts = async (limit = 20) => {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            description
            handle
            availableForSale
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 4) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                  }
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await queryShopifyStorefront(query, { first: limit });
    if (result.data?.products?.edges) {
      return result.data.products.edges.map(({ node }) => ({
        shopify_id: node.id,
        name: node.title,
        description: node.description,
        slug: node.handle,
        price: Number(node.priceRange?.minVariantPrice?.amount || 0),
        currency: node.priceRange?.minVariantPrice?.currencyCode || 'INR',
        in_stock: node.availableForSale,
        images: (node.images?.edges || []).map((e) => e.node.url),
        variants: (node.variants?.edges || []).map((v) => ({
          id: v.node.id,
          title: v.node.title,
          price: Number(v.node.price?.amount || 0),
          in_stock: v.node.availableForSale
        }))
      }));
    }
    return [];
  } catch (error) {
    console.warn('[Shopify] Error querying storefront products:', error.message);
    return [];
  }
};

/**
 * Create a Shopify Checkout / Cart Session
 */
export const createShopifyCart = async (lines = []) => {
  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const formattedLines = lines.map((l) => ({
      merchandiseId: l.variantId,
      quantity: l.quantity
    }));

    const result = await queryShopifyStorefront(query, { input: { lines: formattedLines } });
    if (result.data?.cartCreate?.cart) {
      return {
        cartId: result.data.cartCreate.cart.id,
        checkoutUrl: result.data.cartCreate.cart.checkoutUrl
      };
    }
    return null;
  } catch (error) {
    console.warn('[Shopify] Cart creation fallback:', error.message);
    return null;
  }
};
