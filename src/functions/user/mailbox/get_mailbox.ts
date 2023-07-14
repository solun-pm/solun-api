import { Request, Response } from 'express';
import { dbConnect, findOneDocument, findDocuments, User, User_Mailboxes, User_Domains } from 'solun-database-package';
const { SolunApiClient } = require("../../../mail/mail");

export async function handleGetMailboxRequest(req: Request, res: Response) {
    try {
        await dbConnect();

        const mcc = new SolunApiClient(
            process.env.MAILSERVER_BASEURL,
            process.env.MAILSERVER_API_KEY
        );

        let user_id = req.body.user_id;
        let domain_id = req.body.domain_id;

        const user = await findOneDocument(User, { user_id: user_id });

        if (!user) {
        return res.status(404).json({ message: "User not found" });
        }

        const domain = await findOneDocument(User_Domains, { _id: domain_id, user_id: user_id });
        const domain_name = domain.domain;
        const user_mailboxes = await findDocuments(User_Mailboxes, { user_id: user_id, domain: '@'+domain_name });

        if (!domain) {
            return res.status(404).json({ message: "Domain not found" });
        }

        if (!user_mailboxes) {
            return res.status(404).json({ message: "No mailboxes found" });
        }

        let mailboxes = [];
        for (let i = 0; i < user_mailboxes.length; i++) {
            const mailbox = user_mailboxes[i];
            const mailbox_id = mailbox._id;
            const mailbox_name = mailbox.fqe;
            
            const mailbox_details = await mcc.getMailbox(mailbox_name);

            const mailbox_quota = mailbox_details.quota;
            const mailbox_quota_used = mailbox_details.quota_used;
            const mailbox_messages = mailbox_details.messages;

            const mailbox_rate_limit = mailbox.rate_limit;
            const mailbox_rate_limit_interval = mailbox.rate_limit_interval;

            const mailbox_active = mailbox.active;
            const mailbox_created = mailbox.createdAt;

            mailboxes.push({
                mailbox_id: mailbox_id,
                fqe: mailbox_name,
                quota: mailbox_quota,
                quota_used: mailbox_quota_used,
                messages: mailbox_messages,
                rate_limit: mailbox_rate_limit,
                rate_limit_interval: mailbox_rate_limit_interval,
                active: mailbox_active,
                created: mailbox_created
            });
        }
    
        return res.status(200).json(mailboxes);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
}