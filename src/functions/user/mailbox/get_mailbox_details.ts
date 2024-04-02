import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User_Domains, User_Mailboxes } from 'solun-database-package';
import { getJWTData } from '../../../utils/jwt';

export async function handleGetMailboxDetailsRequest(req: Request, res: Response) {
    try {

    const jwt_data = getJWTData(req.body.token) as { user_id: string } | null;

    if (jwt_data == null) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await dbConnect();

    let user_id = jwt_data.user_id;
    let domain_id = req.body.domain_id;
    let mailbox_id = req.body.mailbox_id;

    if (!user_id || !domain_id || !mailbox_id) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }
    
    const domainDetails = await findOneDocument(User_Domains, { _id: domain_id, user_id: user_id });
    const mailboxDetails = await findOneDocument(User_Mailboxes, { _id: mailbox_id, user_id: user_id, domain: '@'+domainDetails.domain });

    if (!domainDetails) {
        return res.status(400).json({ message: "Domain does not exist or does not belong to user" });
    }

    if (!mailboxDetails) {
        return res.status(400).json({ message: "Mailbox does not exist or does not belong to user" });
    }

    return res.status(200).json( mailboxDetails );
    } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
    }
}