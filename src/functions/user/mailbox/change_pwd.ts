import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User_Domains, User_Mailboxes } from 'solun-database-package';
import { comparePassword, hashPassword, encryptAuthPM, decryptAuthPM } from 'solun-general-package';
const { SolunApiClient } = require("../../../mail/mail");


export async function handleChangePWDMailboxRequest(req: Request, res: Response) {
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
    let currentPassword = requestData.currentPassword;
    let newPassword = requestData.newPassword;

    if (!user_id || !domain_id || !mailbox_id || !currentPassword || !newPassword) {
        return res.status(400).json({ message: "Please fill out all fields" });
    }

    if (newPassword.length < 6 || !newPassword.match(/[^a-zA-Z0-9]/)) {
        return res.status(400).json({ message: "Password must be at least 6 characters long and contain at least 1 special character" });
    }

    const user_domains = await findOneDocument(User_Domains, { user_id: user_id });
    const user_mailboxes = await findOneDocument(User_Mailboxes, { user_id: user_id, _id: mailbox_id, domain: '@'+user_domains.domain });

    if (!user_domains || !user_mailboxes) {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    if (!(await comparePassword(currentPassword, user_mailboxes.password))) {
        return res.status(400).json({ message: "Password is incorrect" });
    }

    const decryptedPrivateKey = decryptAuthPM(user_mailboxes.private_key, currentPassword) as any;
    const encryptedPrivateKey = encryptAuthPM(decryptedPrivateKey, newPassword);

    // Set password in mailserver
    const updateMailbox = await mcc.updateMailbox({
    attr: {
        force_pw_update: 0,
        password: newPassword,
        password2: newPassword,
    },
    items: [user_mailboxes.fqe],
    });

    if (!updateMailbox) {
        return res.status(500).json({ message: "Something went wrong" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await updateOneDocument(
    User_Mailboxes,
    { user_id: user_id, _id: mailbox_id, domain: '@'+user_domains.domain },
    { password: hashedPassword, private_key: encryptedPrivateKey }
    );

    return res.status(200).json({ message: "Password updated successfully" });
} catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
}
}