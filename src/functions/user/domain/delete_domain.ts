import { Request, Response } from 'express';
import { dbConnect, findOneDocument, deleteOneDocument, User, User_Domains, User_Mailboxes, User_Aliases } from 'solun-database-package';
const { SolunApiClient } = require("../../../mail/mail");


export async function handleDeleteDomainRequest(req: Request, res: Response) {
try {
    const requestData = req.body;

    await dbConnect();
        const mcc = new SolunApiClient(
        process.env.MAILSERVER_BASEURL,
        process.env.MAILSERVER_API_KEY
    );

    let user_id = requestData.user_id;
    let domain_id = requestData.domain_id;

    if (!user_id || !domain_id) {
        return res.status(400).json({ message: "Please fill out all fields" });
    }

    const user = await findOneDocument(User, { user_id: user_id });
    const user_domains = await findOneDocument(User_Domains, { user_id: user_id });
    const user_mailboxes = await findOneDocument(User_Mailboxes, { user_id: user_id, domain: '@'+user_domains.domain });
    const user_aliases = await findOneDocument(User_Aliases, { user_id: user_id, domain: '@'+user_domains.domain });

    if (!user || !user_domains) {
        return res.status(400).json({ message: "User does not exist or is not authorized" });
    }

    // Delete aliases on mailserver and database when domain is defined
    if(user_aliases) {
        while (await user_aliases.hasNext()) {
            const alias = await user_aliases.next();
            if(alias.domain === '@'+user_domains.domain) {
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

    // Delete mailboxes on mailserver and database when domain is defined
    if(user_mailboxes) {
        while (await user_mailboxes.hasNext()) {
            const mailbox = await user_mailboxes.next();
            if(mailbox.domain === '@'+user_domains.domain) {
                const deleteMailbox = await mcc.deleteMailbox([mailbox.fqa]);
                if (!deleteMailbox) {
                    return res.status(500).json({ message: "Something went wrong" });
                }
                await deleteOneDocument(
                    User_Mailboxes,
                    { user_id: user_id, _id: mailbox._id, domain: '@'+user_domains.domain }
                );
            }
        }
    }

    // Delete domain on mailserver
    const deleteDomain = await mcc.deleteDomain([user_domains.domain]);

    if (!deleteDomain) {
        return res.status(500).json({ message: "Something went wrong" });
    }

    // Delete domain on database
    await deleteOneDocument(
        User_Domains,
        { user_id: user_id, _id: domain_id }
    );

    return res.status(200).json({ message: "Deleted domain successfully" });
} catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
}
}