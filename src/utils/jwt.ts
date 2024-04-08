import jwt from 'jsonwebtoken';

export function getJWTData(token: string) {
    const jwt_secret = process.env.JWT_SECRET_KEY as string;
    try {
        const decoded = jwt.verify(token, jwt_secret);
        return decoded;
    } catch (err) {
        return null;
    }
}