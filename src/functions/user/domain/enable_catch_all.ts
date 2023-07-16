import { Request, Response } from 'express';
import { dbConnect, findOneDocument, findOneCASEDocument, findDocuments, User, User_Aliases, User_Domains, User_Mailboxes } from 'solun-database-package';
import { isValidEmail } from 'solun-general-package';
const { SolunApiClient } = require("../../../mail/mail");

export async function handleEnableCatchAllRequest(req: Request, res: Response) {
  try {

    await dbConnect();
  
    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let user_id = req.body.user_id;
    let domain_id = req.body.domain_id;
    let forwardingAddresses = req.body.forwarding_addresses;

    if (!user_id || !domain_id || !forwardingAddresses) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    if (forwardingAddresses.length < 1) {
        return res.status(400).json({ message: "Please enter at least one forwarding address" });
    }

    if (forwardingAddresses.length > 25) {
        return res.status(400).json({ message: "You can only enter a maximum of 25 forwarding addresses" });
    }

    for (let i = 0; i < forwardingAddresses.length; i++) {
        if (!isValidEmail(forwardingAddresses[i])) {
            return res.status(400).json({ message: "Please enter a valid forwarding address" });
        }
    }

    const user = await findOneDocument(User, { user_id: user_id });
    const domain = await findOneDocument(User_Domains, { user_id: user_id, _id: domain_id });
    const domainName = domain.domain;
    const mailboxes = await findDocuments(User_Mailboxes, { user_id: user_id, domain: '@'+domainName });
    const aliases = await findDocuments(User_Aliases, { user_id: user_id, domain: '@'+domainName });

    if(mailboxes.length > 0) {
        return res.status(400).json({ message: "You cannot enable catch all on a domain with existing mailboxes" });
    }

    if(aliases.length > 0) {
        return res.status(400).json({ message: "You cannot enable catch all on a domain with existing aliases" });
    }

    if (!user) {
        return res.status(400).json({ message: "User does not exist" });
    }

    // Create aliases on mailserver
    for (let i = 0; i < forwardingAddresses.length; i++) {
        const addAlias = await mcc.addAlias({
            active: 1,
            address: forwardingAddresses[i],
            goto: ['@'+domainName],
        });
    
        if (!addAlias) {
            return res.status(500).json({ message: "Something went wrong" });
        }
    }

    await User_Domains.updateOne(
        { user_id: user_id, _id: domain_id },
        { catch_all: true }
    );

    return res.status(200).json({ message: "Catch all enabled" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}