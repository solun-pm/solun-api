import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User, User_Domains } from 'solun-database-package';
const { SolunApiClient } = require("../../../mail/mail");

export async function handleDisableCatchAllRequest(req: Request, res: Response) {
  try {

    await dbConnect();
  
    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let user_id = req.body.user_id;
    let domain_id = req.body.domain_id;

    if (!user_id || !domain_id) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    const user = await findOneDocument(User, { user_id: user_id });
    const domain = await findOneDocument(User_Domains, { user_id: user_id, _id: domain_id });
    const domainName = domain.domain;

    if (!user) {
        return res.status(400).json({ message: "User does not exist" });
    }

    // Delete aliases on mailserver
    const deleteAlias = await mcc.deleteAlias(['@'+domainName]);
  
      if (!deleteAlias) {
        return res.status(500).json({ message: "Something went wrong" });
      }


    await User_Domains.updateOne(
        { user_id: user_id, _id: domain_id },
        { catch_all: false },
    );

    return res.status(200).json({ message: "Catch all disabled" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}