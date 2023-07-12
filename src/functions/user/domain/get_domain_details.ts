import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User_Domains } from 'solun-database-package';

export async function handleGetDomainDetailsRequest(req: Request, res: Response) {
  try {

    await dbConnect();

    let user_id = req.body.user_id;
    let domain_id = req.body.domain_id;

    if (!domain_id || !user_id) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }
    
    const domainDetails = await findOneDocument(User_Domains, { _id: domain_id, user_id: user_id });

    if (!domainDetails) {
        return res.status(400).json({ message: "Domain does not exist or does not belong to user" });
    }

    return res.status(200).json( domainDetails );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}