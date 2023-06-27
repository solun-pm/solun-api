import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User } from 'solun-database-package';

export async function handleGetDomainsUserRequest(req: Request, res: Response) {
  try {
    await dbConnect();

    let user_id = req.body.user_id;

    const user = await findOneDocument(User, { user_id: user_id });

    if (user == null) {
      return res.status(404).json({ message: "User not found" });
    }

    // @todo: get domains from database and return them
    const domains = ['@solun.pm'];

    return res.status(200).json(domains);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}