import { Request, Response } from 'express';
import { dbConnect, findOneDocument, deleteOneDocument, User, User_Aliases } from 'solun-database-package';
const { SolunApiClient } = require("../../../mail/mail");

export async function handleDeleteAliasRequest(req: Request, res: Response) {
  try {
    await dbConnect();

    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let user_id = req.body.user_id;
    let fqa = req.body.fqa;

    const user = await findOneDocument(User, { user_id: user_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alias = await findOneDocument(User_Aliases, { fqa: fqa });
    if (!alias) {
      return res.status(404).json({ message: "Alias not found" });
    }
    if (alias.user_id !== user_id) {
      return res.status(401).json({ message: "Alias does not belong to user" });
    }

    // Delete alias on mailserver
    const deleteAlias = await mcc.deleteAlias([fqa]);

    if (!deleteAlias) {
      return res.status(500).json({ message: "Something went wrong" });
    }

    await deleteOneDocument(User_Aliases, { fqa: fqa });

    return res.status(200).json({ message: "Alias deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}