import { dbConnect, findOneDocument, temp_token } from "solun-database-package";
import { Request, Response } from 'express';

export async function handlePreAuthWebmailRequest(req: Request, res: Response) {
  try {
    const requestData = await req.body;

    await dbConnect();

    let tempToken = requestData.tempToken;

    const dbRes = await findOneDocument(temp_token, { token: tempToken });

    if (dbRes == null) {
        return res.status(400).json({ message: "Invalid token" });
    }

    return res.status(200).json({fqe: dbRes.fqe, fast_login: dbRes.fast_login});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}