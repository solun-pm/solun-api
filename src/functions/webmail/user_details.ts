import { dbConnect, findOneDocument, User } from "solun-database-package";
import { Request, Response } from 'express';
import { getJWTData } from "../../utils/jwt";

export async function handleUserDetailsWebmailRequest(req: Request, res: Response) {
  try {

    const jwt_data = getJWTData(req.body.token) as { user_id: string } | null;

    if (jwt_data == null) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await dbConnect();

    const user = await findOneDocument(User, { user_id: jwt_data.user_id });

    if (user == null) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}