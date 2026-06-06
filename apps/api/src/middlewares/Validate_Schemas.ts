import { NextFunction, Request, Response } from "express";
import { z } from "zod";


// validating schemas while registering and logging in USERS
const validateSchema = (schema: z.ZodTypeAny) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            next(error);
        }
    };
};

export default validateSchema;