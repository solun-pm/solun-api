import { Request, Response } from 'express';
import { dbConnect, findOneDocument, findOneCASEDocument, User, User_Aliases, User_Mailboxes } from 'solun-database-package';
import { isValidEmail } from 'solun-general-package';
const { SolunApiClient } = require("../../../mail/mail");
import { checkPlanCaps } from '../../../plans/check';

export async function handleCreateAliasRequest(req: Request, res: Response) {
  try {

    await dbConnect();
  
    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let user_id = req.body.user_id;
    let aliasName = req.body.aliasName;
    let domain = req.body.domain;
    let goto = req.body.goto;
    let fqa = `${aliasName}${domain}`;

    if (!user_id || !aliasName || !domain) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    if (!isValidEmail(goto)) {
        return res.status(400).json({ message: "Please enter a valid goto address" });
    }

    if(!isValidEmail(fqa)) {
        return res.status(400).json({ message: "Please enter a valid alias address" });
    }

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
        return res.status(400).json({ message: "User does not exist" });
    }

    const caps = checkPlanCaps(user.membership);
    const maxAliases = caps[0].maxAliases;
    if (user.aliases >= maxAliases) {
        return res.status(400).json({ message: "You have reached your maximum number of aliases for your plan" });
    }
    
    const checkIfFQAMailboxExists = await findOneCASEDocument(User, { fqe: fqa });

    if (checkIfFQAMailboxExists) {
        return res.status(400).json({ message: "Mailbox with this name already exists" });
    }

    const checkIfFQAExists = await findOneCASEDocument(User_Aliases, { fqa: fqa });

    if (checkIfFQAExists) {
        return res.status(400).json({ message: "Alias already exists" });
    }

    const checkIfFQAIsMailbox = await findOneCASEDocument(User_Mailboxes, { fqe: fqa });

    if (checkIfFQAIsMailbox) {
        return res.status(400).json({ message: "Mailbox with this name already exists" });
    }


    // Create alias on mailserver
    const addAlias = await mcc.addAlias({
        active: 1,
        address: fqa,
        goto: goto,
      });
  
      if (!addAlias) {
        return res.status(500).json({ message: "Something went wrong" });
      }

    const newAlias = new User_Aliases({
        user_id: user_id,
        fqa: fqa,
        alias_name: aliasName,
        domain: domain,
        goto: goto,
        active: true,
    });

    await newAlias.save();

    return res.status(200).json({ message: "Alias created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}