import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User } from 'solun-database-package';

export async function handleUserDetailsUserRequest(req: Request, res: Response) {
  try {
    await dbConnect();

    let user_id = req.body.user_id;

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