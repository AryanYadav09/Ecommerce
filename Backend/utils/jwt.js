import { SignJWT, jwtVerify } from 'jose'

let cachedSecretKey = null;
let lastSecret = null;

const getSecretKey = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    if (cachedSecretKey && lastSecret === secret) {
        return cachedSecretKey;
    }
    lastSecret = secret;
    cachedSecretKey = new TextEncoder().encode(secret);
    return cachedSecretKey;
};

const createUserToken = async (id) => {
    return new SignJWT({ id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .sign(getSecretKey())
}

const createAdminToken = async (adminKey) => {
    return new SignJWT({ adminKey })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .sign(getSecretKey())
}

const verifyToken = async (token) => {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] })
    return payload
}

export { createUserToken, createAdminToken, verifyToken }
