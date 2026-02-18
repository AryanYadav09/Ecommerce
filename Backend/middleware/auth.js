import { verifyToken } from '../utils/jwt.js'

const authUser = async (req, res , next)=>{

    const {token} = req.headers;

    if (!token) {
        return res.json({success: false, message: "not authorized Login Again"})
    }

    try {
        const tokenDecode = await verifyToken(token)
        req.body = req.body || {}
        req.body.userId = tokenDecode.id
        next()

    } catch (error) {
        console.error(error);
        res.json({success:false, message: error.message})
        
        
    }

}

export default authUser

