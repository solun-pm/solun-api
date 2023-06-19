import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User } from 'solun-database-package';

export async function handleFastLoginUserRequest(req: Request, res: Response) {
  try {
    await dbConnect();

    let user_id = req.body.user_id;
    let fast_login = req.body.fast_login;

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
      return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    await updateOneDocument(User, { user_id: user_id }, { fast_login: fast_login });

    return res.status(200).json({ message: "Fast login settings updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}