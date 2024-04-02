import { Request, Response } from 'express';
import { dbConnect, findOneCASEDocument, User, User_Aliases, User_Mailboxes } from 'solun-database-package';
import { checkUsername } from 'solun-general-package';

export async function handleCheckUserRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    await dbConnect();

    let username = requestData.username;
    let domain = requestData.domain;

    // TODO: Move to config file.
    const SolunOwnedDomains = [
      "@solun.pm",
    ];

    const isSolunDomain = SolunOwnedDomains.includes(domain) ? true : false;

    const trimmedUsername = username.trim();

    const usernameCheck = checkUsername(username, !isSolunDomain);
    if (usernameCheck.message !== "") {
        return res.status(400).json({ message: usernameCheck.message, exists: true });
    }

    let fqe = `${trimmedUsername}${domain}`;

    const user = await findOneCASEDocument(User, { fqe: fqe });
    const user_alias = await findOneCASEDocument(User_Aliases, { fqa: fqe });
    const user_mailbox = await findOneCASEDocument(User_Mailboxes, { fqe: fqe });

    if (user) {
        return res.status(200).json({ message: "User already exists", exists: true });
    }

    if (user_alias) {
        return res.status(200).json({ message: "This mail is already in use as an alias", exists: true });
    }

    if (user_mailbox) {
        return res.status(200).json({ message: "This mail is already in use as a mailbox", exists: true });
    }

    return res.status(200).json({ message: "User does not exist", exists: false });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
}