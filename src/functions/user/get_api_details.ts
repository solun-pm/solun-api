import jwt from "jsonwebtoken";
import { Request, Response } from 'express';
import { findOneDocument, api_keys } from "solun-database-package";

export async function handleApiDetailsUserRequest(req: Request, res: Response) {
  try {
    const token = req.body.token;

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY as string;

    if (token == null || token == undefined) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token_content = jwt.verify(token, JWT_SECRET_KEY);
    const user_id = (<any>token_content).user_id;

    const data = await findOneDocument(api_keys, {user_id: user_id});

    if (!data) {
        return res.status(400).json({message: "Api access does not exist"});
    }

    return res.status(200).json({message: "Api access details retrieved successfully", data: data});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
