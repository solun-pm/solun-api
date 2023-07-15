import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User, User_Domains, User_Mailboxes } from 'solun-database-package';
const { SolunApiClient } = require("../../../mail/mail");


export async function handleChangeQuotaMailboxRequest(req: Request, res: Response) {
try {
    const requestData = req.body;

    await dbConnect();
        const mcc = new SolunApiClient(
        process.env.MAILSERVER_BASEURL,
        process.env.MAILSERVER_API_KEY
    );

    let user_id = requestData.user_id;
    let domain_id = requestData.domain_id;
    let mailbox_id = requestData.mailbox_id;
    let quota = requestData.quota;

    if (!user_id || !domain_id || !mailbox_id || !quota) {
        return res.status(400).json({ message: "Please fill out all fields" });
    }

    const user = await findOneDocument(User, { user_id: user_id });
    const membership = user.membership;
    const user_domains = await findOneDocument(User_Domains, { user_id: user_id });
    const user_mailboxes = await findOneDocument(User_Mailboxes, { user_id: user_id, _id: mailbox_id, domain: '@'+user_domains.domain });

    if (!user || !user_domains || !user_mailboxes) {
        return res.status(400).json({ message: "User does not exist or is not authorized" });
    }

    if (membership === 'free') {
        if (quota !== 512 || quota !== 1024) {
            return res.status(400).json({ message: "Quota must be 512 or 1024 for this membership" });
        }
    }

    // Set quota in mailserver
    const updateMailbox = await mcc.updateMailbox({
        attr: {
            quota: quota,
        },
        items: [user_mailboxes.fqe],
    });

    if (!updateMailbox) {
        return res.status(500).json({ message: "Something went wrong" });
    }

    await updateOneDocument(
        User_Mailboxes,
        { user_id: user_id, _id: mailbox_id, domain: '@'+user_domains.domain },
        { quota: quota }
    );

    return res.status(200).json({ message: "Quota updated successfully" });
} catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
}
}