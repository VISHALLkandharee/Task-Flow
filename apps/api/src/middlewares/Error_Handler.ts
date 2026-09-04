import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface customErr extends Error {
    statusCode?: number;
}

function ErrorHandlerMiddleware(err: customErr, _req: Request, res: Response, _next: NextFunction): any {
    const message = err.message || "Internal Server Error";
    const statusCode = err.statusCode || 500;

    if (err instanceof ZodError || err.name === "ZodError") {
        const validationMessage = (err as any).issues?.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ') || err.message;
        
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: validationMessage || "Validation Error",
        });
    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
}

export default ErrorHandlerMiddleware;
