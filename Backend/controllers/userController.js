import userModel from '../models/userModel.js'
import pendingUserModel from '../models/pendingUserModel.js'
import validator from 'validator'
import bcrypt from 'bcrypt'
import dns from 'node:dns/promises'
import { createUserToken, createAdminToken } from '../utils/jwt.js'
import { OTP_EXPIRY_MINUTES, generateOtp, getOtpExpiryDate, hashOtp, sendOtpEmail } from '../utils/emailOtp.js'
import getFirebaseAuth from '../config/firebaseAdmin.js'


const createToken = (id) => {
    return createUserToken(id)
}

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const findUserByEmail = async (email) => {
    if (!email) {
        return null
    }
    const safeEmail = escapeRegex(email)
    return userModel.findOne({ email: { $regex: new RegExp(`^${safeEmail}$`, 'i') } })
}

const findUserByPhone = async (phone) => {
    if (!phone) {
        return null
    }
    return userModel.findOne({ phone })
}

const hasMailExchange = async (email) => {
    const domain = email.split('@')[1]
    if (!domain) return false
    try {
        const records = await dns.resolveMx(domain)
        return Array.isArray(records) && records.length > 0
    } catch {
        return false
    }
}

const validateSignupFields = ({ name, email, password }) => {
    const normalizedName = name?.trim()
    const normalizedEmail = email?.trim().toLowerCase()

    if (!normalizedName) {
        return { error: "Please enter your name" }
    }

    if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
        return { error: "Please enter a valid email" }
    }

    if (!password || password.length < 8) {
        return { error: "Please enter a Strong password" }
    }

    return { normalizedName, normalizedEmail }
}

const buildUserProfilePayload = (user) => {
    const memberSince = user?._id?.getTimestamp?.()
    return {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        authProvider: user.authProvider || 'password',
        memberSince: memberSince ? memberSince.toISOString() : null
    }
}


// route for login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        const user = await findUserByEmail(normalizedEmail)

        if (!user) {
            return res.json({ success: false, message: "No account found with this email" })
        }

        if (!user.password) {
            return res.json({ success: false, message: "This account uses social sign-in. Please continue with your provider." })
        }

        if (!password) {
            return res.json({ success: false, message: "Please enter your password" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = await createToken(user._id)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "invalid credentials" })
        }


    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })

    }


}

// route for sending signup otp
const sendRegisterOtp = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const { error, normalizedName, normalizedEmail } = validateSignupFields({ name, email, password })

        if (error) {
            return res.json({ success: false, message: error })
        }

        const canReceiveEmails = await hasMailExchange(normalizedEmail)
        if (!canReceiveEmails) {
            return res.json({ success: false, message: "Email domain is not valid for receiving emails" })
        }

        const exists = await findUserByEmail(normalizedEmail);
        if (exists) {
            return res.json({ success: false, message: "user already exists" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const otp = generateOtp()
        const otpHash = hashOtp(otp)
        const otpExpiresAt = getOtpExpiryDate()

        await pendingUserModel.findOneAndUpdate(
            { email: normalizedEmail },
            {
                name: normalizedName,
                email: normalizedEmail,
                password: hashedPassword,
                otpHash,
                otpExpiresAt,
                createdAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        await sendOtpEmail(normalizedEmail, otp)

        res.json({
            success: true,
            message: `OTP sent successfully. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`
        })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

// route for verifying signup otp and creating user
const verifyRegisterOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        const normalizedEmail = email?.trim().toLowerCase()
        const normalizedOtp = String(otp || '').trim()

        if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        if (!/^\d{6}$/.test(normalizedOtp)) {
            return res.json({ success: false, message: "Please enter a valid 6-digit OTP" })
        }

        const pendingUser = await pendingUserModel.findOne({ email: normalizedEmail })
        if (!pendingUser) {
            return res.json({ success: false, message: "OTP expired. Please request a new OTP." })
        }

        if (pendingUser.otpExpiresAt < new Date()) {
            await pendingUser.deleteOne()
            return res.json({ success: false, message: "OTP expired. Please request a new OTP." })
        }

        if (pendingUser.otpHash !== hashOtp(normalizedOtp)) {
            return res.json({ success: false, message: "Invalid OTP" })
        }

        const exists = await findUserByEmail(normalizedEmail);
        if (exists) {
            await pendingUser.deleteOne()
            return res.json({ success: false, message: "user already exists" })
        }

        const newUser = new userModel({
            name: pendingUser.name,
            email: normalizedEmail,
            password: pendingUser.password
        })

        const user = await newUser.save()
        await pendingUser.deleteOne()

        const token = await createToken(user._id)

        res.json({ success: true, token })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const user = await userModel.findById(userId).select('name email phone avatar authProvider wishlist _id')

        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        return res.json({
            success: true,
            user: buildUserProfilePayload(user),
            wishlist: user.wishlist || []
        })
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: error.message })
    }
}

const getUserWishlist = async (req, res) => {
    try {
        const { userId } = req.body
        const user = await userModel.findById(userId).select('wishlist')

        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        return res.json({ success: true, wishlist: user.wishlist || [] })
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: error.message })
    }
}

const toggleWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body
        const normalizedProductId = String(productId || '').trim()

        if (!normalizedProductId) {
            return res.json({ success: false, message: 'Product id is required' })
        }

        const user = await userModel.findById(userId).select('wishlist')
        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        const wishlist = Array.isArray(user.wishlist) ? user.wishlist : []
        const existingIndex = wishlist.indexOf(normalizedProductId)
        const isWishlisted = existingIndex === -1

        if (isWishlisted) {
            wishlist.push(normalizedProductId)
        } else {
            wishlist.splice(existingIndex, 1)
        }

        user.wishlist = wishlist
        await user.save()

        return res.json({
            success: true,
            wishlist: user.wishlist,
            isWishlisted
        })
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: error.message })
    }
}

// route for login/signup with firebase providers
const loginWithSocialProvider = async (req, res) => {
    try {
        const { idToken } = req.body

        if (!idToken || typeof idToken !== 'string') {
            return res.json({ success: false, message: "Missing provider token" })
        }

        const firebaseAuth = getFirebaseAuth()
        const decodedToken = await firebaseAuth.verifyIdToken(idToken)

        const providerId = decodedToken.firebase?.sign_in_provider || 'unknown'
        const normalizedEmail = decodedToken.email?.trim().toLowerCase()
        const normalizedPhone = decodedToken.phone_number?.trim() || ''
        const fallbackEmail = `${decodedToken.uid}@firebase.local`

        let user = await findUserByEmail(normalizedEmail || fallbackEmail)
        if (!user && normalizedPhone) {
            user = await findUserByPhone(normalizedPhone)
        }

        if (!user) {
            user = await userModel.create({
                name: decodedToken.name || normalizedPhone || normalizedEmail || 'New User',
                email: normalizedEmail || fallbackEmail,
                phone: normalizedPhone,
                authProvider: providerId,
                authProviderId: decodedToken.uid,
                avatar: decodedToken.picture || '',
                password: ''
            })
        } else {
            user.authProvider = providerId || user.authProvider
            user.authProviderId = decodedToken.uid || user.authProviderId
            user.phone = user.phone || normalizedPhone
            user.avatar = user.avatar || decodedToken.picture || ''

            if (!user.email && (normalizedEmail || fallbackEmail)) {
                user.email = normalizedEmail || fallbackEmail
            }

            await user.save()
        }

        const token = await createToken(user._id)
        return res.json({ success: true, token })
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: "Failed to authenticate with provider" })
    }
}

// route for logining admin
const adminLogin = async (req, res) => {

    try {

        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

        if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        const canReceiveEmails = await hasMailExchange(normalizedEmail)
        if (!canReceiveEmails) {
            return res.json({ success: false, message: "Email domain is not valid for receiving emails" })
        }

        if (normalizedEmail === adminEmail && password === process.env.ADMIN_PASSWORD) {
            const token = await createAdminToken(adminEmail + password)
            res.json({success: true, token})
        }else{
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }

}

const verifyAdminLogin = async (req, res) => {
    res.json({ success: true })
}

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
}
