import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/index.js';


const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}


export const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '14d' });
};

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            message: "Authentication required"
        });
    };

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            message: "Invalid authorization format"
        });
    };

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (typeof decoded === 'string' || typeof decoded.userId !== 'string') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = decoded;// Attach user info to the gateway request object
        next();
    } catch (err) {
        res.status(403).json({ message: 'Invalid token' });
    }
};   