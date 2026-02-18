import crypto from 'node:crypto'

const OTP_EXPIRY_MINUTES = 10

const generateOtp = () => {
    return String(Math.floor(100000 + Math.random() * 900000))
}

const hashOtp = (otp) => {
    return crypto.createHash('sha256').update(String(otp)).digest('hex')
}

const getOtpExpiryDate = () => {
    return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
}

const sendOtpEmail = async (toEmail, otp) => {
    const resendApiKey = process.env.RESEND_API_KEY?.trim()
    const fromEmail = process.env.OTP_EMAIL_FROM?.trim()

    if (!resendApiKey || !fromEmail) {
        throw new Error('Email service is not configured. Set RESEND_API_KEY and OTP_EMAIL_FROM in Backend/.env')
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject: 'Your OTP for account verification',
            html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>`
        })
    })

    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Failed to send OTP email: ${errorBody}`)
    }
}

export { OTP_EXPIRY_MINUTES, generateOtp, hashOtp, getOtpExpiryDate, sendOtpEmail }
