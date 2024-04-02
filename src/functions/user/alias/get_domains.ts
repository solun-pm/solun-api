import { Request, Response } from 'express';
import { dbConnect, findDocuments, findOneDocument, User, User_Domains } from 'solun-database-package';
import { getJWTData } from '../../../utils/jwt';

export async function handleGetDomainsAliasRequest(req: Request, res: Response) {
  try {
    
    const jwt_data = getJWTData(req.body.token) as { user_id: string } | null;

    if (jwt_data == null) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await dbConnect();

    let user_id = jwt_data.user_id;

    const user = await findOneDocument(User, { user_id: user_id });
    const user_domains = await findDocuments(User_Domains, { user_id: user_id, verification_status: "active" });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const domains = ['@solun.pm', '@6crypt.com', '@seal.pm', '@xolus.de', '@cipher.pm'];
    
    if (user_domains && user_domains.length) {
      user_domains.forEach((user_domain: any) => {
        if (user_domain.domain) {
          domains.push(`@${user_domain.domain}`);
        }
      });
    }

    return res.status(200).json(domains);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}