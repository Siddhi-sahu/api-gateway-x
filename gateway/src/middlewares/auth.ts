import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/index.js';


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '14d' });
};

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied, no token.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === 'string' || typeof decoded.userId !== 'string') {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.id = decoded.userId;
        next();
    } catch (err) {
        res.status(403).json({ message: 'Invalid token' });
    }
};   