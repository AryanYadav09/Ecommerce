import { verifyToken } from '../utils/jwt.js'

const adminAuth = async (req, res, next) => {
    
    
    try {
        const { token } = req.headers
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
        if( !token  ){
            return res.json({success: false, message: "unautharized"})
        }
        const decodeToken = await verifyToken(token);
        if(decodeToken.adminKey !== adminEmail + process.env.ADMIN_PASSWORD){
            return res.json({success: false, message: "unauthorized"})
        }
        next()
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: error.message })
        
    }

}

export default adminAuth;
