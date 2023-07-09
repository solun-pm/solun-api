import { Request, Response } from 'express';
import { dbConnect, findOneDocument, findDocuments, User, User_Aliases, User_Domains} from 'solun-database-package';

export async function handleGetDomainDomainRequest(req: Request, res: Response) {
    let mailbox_cap = 0;
    let alias_cap = 0;
  try {
    await dbConnect();

    let user_id = req.body.user_id;

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const membership = user.membership;
    if (membership === "free") {
        mailbox_cap = 2;
        alias_cap = 2;
    } // TODO: Add more membership types

    const user_domains = await findDocuments(User_Domains, { user_id: user_id });
      
    let domains = [];
    for (let i = 0; i < user_domains.length; i++) {
      const domain = user_domains[i];
      const domain_name = domain.domain;
      const domain_status = domain.status;
      
      // Find aliases for this domain @TODO: add mailbox count
      const user_aliases = await findDocuments(User_Aliases, { domain: `@${domain_name}` });
    
      const domain_mailbox_count = 0;
      const domain_alias_count = user_aliases.length;
    
      domains.push({
        domain: domain_name,
        status: domain_status,
        mailbox_count: domain_mailbox_count,
        alias_count: domain_alias_count,
        mailbox_cap: mailbox_cap,
        alias_cap: alias_cap,
      });
    }
  
    return res.status(200).json({ domains: domains });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}