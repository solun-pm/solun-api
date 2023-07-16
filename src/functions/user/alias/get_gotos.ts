import { Request, Response } from 'express';
import { dbConnect, findDocuments, findOneDocument, User, User_Domains, User_Mailboxes } from 'solun-database-package';

export async function handleGetGotosAliasRequest(req: Request, res: Response) {
  try {
    await dbConnect();

    let user_id = req.body.user_id;

    const user = await findOneDocument(User, { user_id: user_id });
    const user_domains = await findDocuments(User_Domains, { user_id: user_id, verification_status: "active" });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // example: test@domain.tld
    const gotos = [];
    gotos.push(user.fqe); // solun address

    for (let domain of user_domains) {
        const user_mailboxes = await findDocuments(User_Mailboxes, { user_id: user_id, domain: '@' + domain.domain });
        for (let mailbox of user_mailboxes) {
            gotos.push(mailbox.fqe);
        }
    }

    return res.status(200).json(gotos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}