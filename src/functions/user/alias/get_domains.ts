import { Request, Response } from 'express';
import { dbConnect, findDocuments, findOneDocument, User, User_Domains } from 'solun-database-package';

export async function handleGetDomainsAliasRequest(req: Request, res: Response) {
  try {
    await dbConnect();
    console.log('Connected to database');

    let user_id = req.body.user_id;
    console.log(`User ID: ${user_id}`);

    const user = await findOneDocument(User, { user_id: user_id });
    console.log(`User: ${JSON.stringify(user)}`);

    const user_domains = await findDocuments(User_Domains, { user_id: user_id });
    console.log(`User Domains: ${JSON.stringify(user_domains)}`);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: "User not found" });
    }

    const domains = ['@solun.pm', '@6crypt.com', '@seal.pm', '@xolus.de', '@cipher.pm'];
    
    if (user_domains && user_domains.length) {
      console.log(`Found ${user_domains.length} user domain(s)`);
      user_domains.forEach((user_domain: any) => {
        console.log(`User Domain: ${JSON.stringify(user_domain)}`);
        if (user_domain.domains && user_domain.domains.length) {
          user_domain.domains.forEach((domain: any) => {
            console.log(`Domain: ${domain}`);
            domains.push(`@${domain}`);
          });
        }
      });
    }

    console.log(`Returning domains: ${JSON.stringify(domains)}`);
    return res.status(200).json(domains);
  } catch (error) {
    console.error('An error occurred:', error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}