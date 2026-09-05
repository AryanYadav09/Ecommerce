import express from 'express';
import { createSalesforceCase, isSalesforceConfigured } from '../integrations/salesforce/salesforceClient.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// Create customer support case
router.post('/support', async (req, res) => {
  try {
    const { name, email, subject, message, userId } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const createdCase = await createSalesforceCase({
      name,
      email,
      subject,
      message,
      userId
    });

    return res.json({
      success: true,
      message: 'Support case created successfully',
      case: createdCase
    });
  } catch (error) {
    console.error('[Support API Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get user or all support cases
router.get('/support/cases', async (req, res) => {
  try {
    const { email } = req.query;
    let query = supabase.from('support_cases').select('*').order('created_at', { ascending: false });

    if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return res.json({ success: true, cases: data || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Check Salesforce CRM integration status
router.get('/salesforce/status', (req, res) => {
  return res.json({
    success: true,
    configured: isSalesforceConfigured,
    mode: isSalesforceConfigured ? 'live-enterprise-sync' : 'resilient-local-queue'
  });
});

export default router;
