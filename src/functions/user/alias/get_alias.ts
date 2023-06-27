import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User, User_Aliases } from 'solun-database-package';

export async function handleGetAliasRequest(req: Request, res: Response) {
  try {
    await dbConnect();

    let user_id = req.body.user_id;

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const aliases = await User_Aliases.find({ user_id: user_id });

    return res.status(200).json(aliases);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}