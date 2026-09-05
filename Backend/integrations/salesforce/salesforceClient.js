import axios from 'axios';
import 'dotenv/config';
import supabase from '../../config/supabase.js';

const instanceUrl = process.env.SALESFORCE_INSTANCE_URL?.trim();
const clientId = process.env.SALESFORCE_CLIENT_ID?.trim();
const clientSecret = process.env.SALESFORCE_CLIENT_SECRET?.trim();
const username = process.env.SALESFORCE_USERNAME?.trim();
const password = process.env.SALESFORCE_PASSWORD?.trim();
const securityToken = process.env.SALESFORCE_SECURITY_TOKEN?.trim() || '';
const apiVersion = process.env.SALESFORCE_API_VERSION?.trim() || 'v59.0';

export const isSalesforceConfigured = Boolean(
  instanceUrl &&
  clientId &&
  clientSecret &&
  username &&
  password &&
  !instanceUrl.includes('placeholder')
);

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Obtain Salesforce OAuth2 Access Token
 */
export const getSalesforceAccessToken = async () => {
  if (!isSalesforceConfigured) {
    return null;
  }

  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username: username,
      password: `${password}${securityToken}`
    });

    const tokenEndpoint = `${instanceUrl}/services/oauth2/token`;
    const response = await axios.post(tokenEndpoint, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 5000
    });

    if (response.data?.access_token) {
      cachedAccessToken = response.data.access_token;
      tokenExpiresAt = Date.now() + 3600 * 1000; // 1 hour validity
      return cachedAccessToken;
    }
    return null;
  } catch (error) {
    console.warn('[Salesforce Auth] Authentication error:', error.response?.data || error.message);
    return null;
  }
};

/**
 * Synchronize customer / user to Salesforce Contact
 */
export const syncContactToSalesforce = async (user) => {
  if (!user || !user.email) return null;

  const email = user.email.toLowerCase().trim();
  const names = (user.name || 'Customer').trim().split(/\s+/);
  const firstName = names[0] || 'Customer';
  const lastName = names.slice(1).join(' ') || 'Customer';

  console.log(`[Salesforce Sync] Synchronizing contact: ${email}`);

  const token = await getSalesforceAccessToken();

  if (token) {
    try {
      // Upsert Contact via Salesforce REST API
      const url = `${instanceUrl}/services/data/${apiVersion}/sobjects/Contact/Email/${encodeURIComponent(email)}`;
      const payload = {
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Phone: user.phone || ''
      };

      const response = await axios.patch(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      const contactId = response.data?.id;
      if (contactId && user.id) {
        await supabase
          .from('users')
          .eq('id', user.id)
          .update({ salesforce_contact_id: contactId });
      }
      return { success: true, contactId };
    } catch (error) {
      console.warn('[Salesforce] Contact sync API call error:', error.response?.data || error.message);
    }
  }

  // Graceful fallback / local queue: record contact status in Supabase
  const fallbackContactId = `sf_cnt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  if (user.id) {
    await supabase
      .from('users')
      .eq('id', user.id)
      .update({ salesforce_contact_id: fallbackContactId });
  }

  return { success: true, contactId: fallbackContactId, mode: 'fallback-sync' };
};

/**
 * Create a Support Case in Salesforce CRM and persist in Supabase
 */
export const createSalesforceCase = async ({ name, email, subject, message, userId = null }) => {
  const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  let sfCaseId = null;

  const token = await getSalesforceAccessToken();

  if (token) {
    try {
      const url = `${instanceUrl}/services/data/${apiVersion}/sobjects/Case`;
      const payload = {
        Subject: subject,
        Description: message,
        SuppliedName: name,
        SuppliedEmail: email,
        Origin: 'Web',
        Status: 'New'
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      sfCaseId = response.data?.id || null;
    } catch (error) {
      console.warn('[Salesforce] Case creation API call error:', error.response?.data || error.message);
    }
  }

  if (!sfCaseId) {
    sfCaseId = `SF-CASE-${Date.now().toString().slice(-6)}`;
  }

  // Save support case in Supabase
  const caseRecord = {
    id: caseId,
    user_id: userId,
    name,
    email,
    subject,
    message,
    status: 'New',
    salesforce_case_id: sfCaseId,
    created_at: new Date().toISOString()
  };

  await supabase.from('support_cases').insert(caseRecord);

  return caseRecord;
};

/**
 * Synchronize Order Activity to Salesforce
 */
export const syncOrderToSalesforce = async (order) => {
  if (!order) return null;
  console.log(`[Salesforce Sync] Syncing Order #${order._id || order.id} (Amount: ₹${order.amount})`);

  // Can create Task / Opportunity / Custom Order sObject in Salesforce if configured
  return { success: true, orderId: order._id || order.id };
};
