import validator from 'validator';
import bcrypt from 'bcrypt';
import dns from 'node:dns/promises';
import { createUserToken, createAdminToken } from '../utils/jwt.js';
import { OTP_EXPIRY_MINUTES, generateOtp, getOtpExpiryDate, hashOtp, sendOtpEmail } from '../utils/emailOtp.js';
import getFirebaseAuth from '../config/firebaseAdmin.js';
import {
  findUserByEmail,
  findUserById,
  findUserByPhone,
  createUser,
  getUserWishlist as fetchUserWishlist,
  toggleWishlist as toggleUserWishlist,
  createOrUpdatePendingUser,
  findPendingUser,
  deletePendingUser
} from '../services/userService.js';
import { syncContactToSalesforce } from '../integrations/salesforce/salesforceClient.js';

const createToken = (id) => createUserToken(id);

const hasMailExchange = async (email) => {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
};

const validateSignupFields = ({ name, email, password }) => {
  const normalizedName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedName) return { error: 'Please enter your name' };
  if (!normalizedEmail || !validator.isEmail(normalizedEmail)) return { error: 'Please enter a valid email' };
  if (!password || password.length < 8) return { error: 'Please enter a Strong password' };

  return { normalizedName, normalizedEmail };
};

const buildUserProfilePayload = (user) => {
  return {
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    avatar: user.avatar || '',
    authProvider: user.auth_provider || user.authProvider || 'password',
    memberSince: user.created_at || null
  };
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
      return res.json({ success: false, message: 'Please enter a valid email' });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.json({ success: false, message: 'No account found with this email' });
    }

    if (!user.password && !user.password_hash) {
      return res.json({
        success: false,
        message: 'This account uses social sign-in. Please continue with your provider.'
      });
    }

    if (!password) {
      return res.json({ success: false, message: 'Please enter your password' });
    }

    const hashToCompare = user.password || user.password_hash;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (isMatch) {
      const token = await createToken(user._id || user.id);
      return res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: 'invalid credentials' });
    }
  } catch (error) {
    console.error('Error in loginUser:', error);
    return res.json({ success: false, message: error.message });
  }
};

const sendRegisterOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { error, normalizedName, normalizedEmail } = validateSignupFields({ name, email, password });

    if (error) {
      return res.json({ success: false, message: error });
    }

    const canReceiveEmails = await hasMailExchange(normalizedEmail);
    if (!canReceiveEmails) {
      return res.json({ success: false, message: 'Email domain is not valid for receiving emails' });
    }

    const exists = await findUserByEmail(normalizedEmail);
    if (exists) {
      return res.json({ success: false, message: 'user already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiresAt = getOtpExpiryDate();

    await createOrUpdatePendingUser({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      otpHash,
      otpExpiresAt
    });

    await sendOtpEmail(normalizedEmail, otp);

    return res.json({
      success: true,
      message: `OTP sent successfully. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`
    });
  } catch (error) {
    console.error('Error in sendRegisterOtp:', error);
    return res.json({ success: false, message: error.message });
  }
};

const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedOtp = String(otp || '').trim();

    if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
      return res.json({ success: false, message: 'Please enter a valid email' });
    }

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return res.json({ success: false, message: 'Please enter a valid 6-digit OTP' });
    }

    const pendingUser = await findPendingUser(normalizedEmail);
    if (!pendingUser) {
      return res.json({ success: false, message: 'OTP expired. Please request a new OTP.' });
    }

    if (pendingUser.otpExpiresAt < new Date()) {
      await deletePendingUser(normalizedEmail);
      return res.json({ success: false, message: 'OTP expired. Please request a new OTP.' });
    }

    if (pendingUser.otpHash !== hashOtp(normalizedOtp)) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    const exists = await findUserByEmail(normalizedEmail);
    if (exists) {
      await deletePendingUser(normalizedEmail);
      return res.json({ success: false, message: 'user already exists' });
    }

    const newUser = await createUser({
      name: pendingUser.name,
      email: normalizedEmail,
      password: pendingUser.password
    });

    await deletePendingUser(normalizedEmail);

    // Asynchronously synchronize new customer with Salesforce CRM Contact
    syncContactToSalesforce(newUser).catch((err) => {
      console.warn('[Salesforce] Async customer sync warning:', err.message);
    });

    const token = await createToken(newUser._id || newUser.id);
    return res.json({ success: true, token });
  } catch (error) {
    console.error('Error in verifyRegisterOtp:', error);
    return res.json({ success: false, message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await findUserById(userId);

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    const wishlist = await fetchUserWishlist(userId);

    return res.json({
      success: true,
      user: buildUserProfilePayload(user),
      wishlist
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return res.json({ success: false, message: error.message });
  }
};

const getUserWishlist = async (req, res) => {
  try {
    const { userId } = req.body;
    const wishlist = await fetchUserWishlist(userId);
    return res.json({ success: true, wishlist });
  } catch (error) {
    console.error('Error in getUserWishlist:', error);
    return res.json({ success: false, message: error.message });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const cleanProductId = String(productId || '').trim();

    if (!cleanProductId) {
      return res.json({ success: false, message: 'Product id is required' });
    }

    const { wishlist, isWishlisted } = await toggleUserWishlist(userId, cleanProductId);
    return res.json({ success: true, wishlist, isWishlisted });
  } catch (error) {
    console.error('Error in toggleWishlist:', error);
    return res.json({ success: false, message: error.message });
  }
};

const loginWithSocialProvider = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      return res.json({ success: false, message: 'Missing provider token' });
    }

    const firebaseAuth = getFirebaseAuth();
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);

    const providerId = decodedToken.firebase?.sign_in_provider || 'unknown';
    const normalizedEmail = decodedToken.email?.trim().toLowerCase();
    const normalizedPhone = decodedToken.phone_number?.trim() || '';
    const fallbackEmail = `${decodedToken.uid}@firebase.local`;

    let user = await findUserByEmail(normalizedEmail || fallbackEmail);
    if (!user && normalizedPhone) {
      user = await findUserByPhone(normalizedPhone);
    }

    if (!user) {
      user = await createUser({
        name: decodedToken.name || normalizedPhone || normalizedEmail || 'New User',
        email: normalizedEmail || fallbackEmail,
        phone: normalizedPhone,
        authProvider: providerId,
        authProviderId: decodedToken.uid,
        avatar: decodedToken.picture || '',
        password: ''
      });

      // Synchronize with Salesforce CRM
      syncContactToSalesforce(user).catch(() => {});
    }

    const token = await createToken(user._id || user.id);
    return res.json({ success: true, token });
  } catch (error) {
    console.error('Error in loginWithSocialProvider:', error);
    return res.json({ success: false, message: 'Failed to authenticate with provider' });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
      return res.json({ success: false, message: 'Please enter a valid email' });
    }

    const canReceiveEmails = await hasMailExchange(normalizedEmail);
    if (!canReceiveEmails) {
      return res.json({ success: false, message: 'Email domain is not valid for receiving emails' });
    }

    if (normalizedEmail === adminEmail && password === process.env.ADMIN_PASSWORD) {
      const token = await createAdminToken(adminEmail + password);
      return res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error in adminLogin:', error);
    return res.json({ success: false, message: error.message });
  }
};

const verifyAdminLogin = async (req, res) => {
  return res.json({ success: true });
};

export {
  loginUser,
  sendRegisterOtp,
  verifyRegisterOtp,
  getUserProfile,
  getUserWishlist,
  toggleWishlist,
  loginWithSocialProvider,
  adminLogin,
  verifyAdminLogin
};
