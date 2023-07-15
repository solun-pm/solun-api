import { Request, Response } from 'express';
import { dbConnect, findOneDocument, deleteOneDocument, User, User_Domains, User_Mailboxes, User_Aliases } from 'solun-database-package';
const { SolunApiClient } = require("../../../mail/mail");


export async function handleDeleteMailboxRequest(req: Request, res: Response) {
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

    if (!user_id || !domain_id || !mailbox_id) {
        return res.status(400).json({ message: "Please fill out all fields" });
    }

    const user = await findOneDocument(User, { user_id: user_id });
    const user_domains = await findOneDocument(User_Domains, { user_id: user_id });
    const user_mailboxes = await findOneDocument(User_Mailboxes, { user_id: user_id, _id: mailbox_id, domain: '@'+user_domains.domain });
    const user_aliases = await findOneDocument(User_Aliases, { user_id: user_id, domain: '@'+user_domains.domain });

    if (!user || !user_domains || !user_mailboxes) {
        return res.status(400).json({ message: "User does not exist or is not authorized" });
    }

    // Delete aliases on mailserver and database when mailbox is defined as goto address
    if(user_aliases) {
        while (await user_aliases.hasNext()) {
            const alias = await user_aliases.next();
            if(alias.goto === user_mailboxes.fqe) {
                const deleteAlias = await mcc.deleteAlias([alias.fqa]);
                if (!deleteAlias) {
                    return res.status(500).json({ message: "Something went wrong" });
                }
                await deleteOneDocument(
                    User_Aliases,
                    { user_id: user_id, _id: alias._id, domain: '@'+user_domains.domain }
                );
            }
        }
    }

    // Delete mailbox on mailserver
    const deleteMailbox = await mcc.deleteMailbox([user_mailboxes.fqe]);

    if (!deleteMailbox) {
        return res.status(500).json({ message: "Something went wrong" });
    }

    // Delete mailbox on database
    await deleteOneDocument(
        User_Mailboxes,
        { user_id: user_id, _id: mailbox_id, domain: '@'+user_domains.domain }
    );

    return res.status(200).json({ message: "Deleted mailbox successfully" });
} catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
}
}