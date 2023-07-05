import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User_Domains } from 'solun-database-package';
import dnsPromises from 'dns/promises';

export async function handleCheckDomainRequest(req: Request, res: Response) {
  try {

    await dbConnect();

    let domain = req.body.domain.toLowerCase();

    if (!domain) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    const dbDomain = await findOneDocument(User_Domains, { domain: domain });

    if (dbDomain) {
        return res.status(400).json({ message: "Domain already exists", valid: false });
    }
    
    try {
        const soa = await dnsPromises.resolveSoa(domain);
        return res.status(200).json({ message: "Domain successfully checked", valid: true });
      } catch (error) {
        return res.status(400).json({ message: "Domain is not valid", valid: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}