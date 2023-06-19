import jwt from "jsonwebtoken";
import { Request, Response } from 'express';

export async function handleJWTDetailsUserRequest(req: Request, res: Response) {
  try {
    const token = req.body.token;

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

    if (token == null || token == undefined) {
      return res.status(401).json({ message: "No token provided" });
    }

    // @ts-ignore
    return res.status(200).json(jwt.verify(token, JWT_SECRET_KEY));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
