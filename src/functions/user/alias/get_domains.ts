import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User, User_Domains } from 'solun-database-package';

export async function handleGetDomainsAliasRequest(req: Request, res: Response) {
  try {
    await dbConnect();

    let user_id = req.body.user_id;

    const user = await findOneDocument(User, { user_id: user_id });
    const user_domains = await findOneDocument(User_Domains, { user_id: user_id });

    if (user == null) {
      return res.status(404).json({ message: "User not found" });
    }

    const domains = ['@solun.pm', '@6crypt.com', '@seal.pm', '@xolus.de', '@cipher.pm'];
    
    if (user_domains && user_domains.domains) {
      user_domains.domains.forEach((domain: any) => {
        domains.push(`@${domain}`);
      });
    }

    return res.status(200).json(domains);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}