import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config();

const authenticate_jwt = (req,res,next)=>{

    const authHeader = req.headers.authorization;
    if(authHeader && authHeader.startsWith('Bearer ')){
        const token = authHeader.split(" ")[1];
        
        jwt.verify(token,process.env.JWT_SECRET ,(err,decoded)=>{
            if(err){
                return res.status(403).json({message:err});
            }

            req.user = decoded;
            next();
        })
    }
    else{
        return res.status(401).json({message : "No token Provided"});
    }

}

export default authenticate_jwt;