import { dbConnect, findOneDocument, User } from "solun-database-package";
import { Request, Response } from 'express';

export async function handleUserDetailsWebmailRequest(req: Request, res: Response) {
  try {
    const requestData = await req.body;

    await dbConnect();

    let user_id = requestData.user_id;

    const user = await findOneDocument(User, { user_id: user_id });

    if (user == null) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}