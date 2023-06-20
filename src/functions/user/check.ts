import { Request, Response } from 'express';
import { dbConnect, findOneCASEDocument, User } from 'solun-database-package';
import { checkUsername } from 'solun-general-package';

export async function handleCheckUserRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    await dbConnect();

    let username = requestData.username;
    let domain = requestData.domain;

    const trimmedUsername = username.trim();

    const usernameCheck = checkUsername(username);
    if (usernameCheck.message !== "") {
        return res.status(400).json({ message: usernameCheck.message, exists: true });
    }

    let fqe = `${trimmedUsername}${domain}`;

    const user = await findOneCASEDocument(User, { fqe: fqe });

    if (user) {
        return res.status(200).json({ message: "User already exists", exists: true });
    }

    return res.status(200).json({ message: "User does not exist", exists: false });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
}