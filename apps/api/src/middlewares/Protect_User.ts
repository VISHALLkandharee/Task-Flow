import { Request, Response, NextFunction } from "express"
import ApiError from "../lib/ApiError";
import { verifyAccessToken } from "../lib/jwt";

const protectUser = (req:Request, res:Response, next:NextFunction) => {

    try {
    // get token
    const token = req.cookies.access_token || req.headers.authorization?.split(" ")[1];

    if(!token) throw new ApiError("Unauthorized", 401)
        

    const payload = verifyAccessToken(token)
    if(!payload) throw new ApiError("Invalid Token!", 401);

        //inject user in Request


        (req as any).user = payload 

        next()

}catch{
    next(new ApiError('Not authenticated', 401));
}
    }


    export default protectUser

