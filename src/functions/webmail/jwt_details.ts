import { Request, Response } from 'express';
import jwt from "jsonwebtoken";

export async function handleJWTDetailsWebmailRequest(req: Request, res: Response) {
  try {
    const { token, onlyVerify } = await req.body;

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    let verificationResult;
    try {
      verificationResult = jwt.verify(token, JWT_SECRET_KEY as string);
    } catch (error) {
      console.error("Error verifying token:", error);
      return res.status(403).json({ message: "Token verification failed" });
    }

    if (onlyVerify) {
        return res.status(200).json({ isValid: true });
    } else {
        return res.status(200).json(verificationResult);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}