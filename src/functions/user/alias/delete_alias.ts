import { Request, Response } from 'express';
import { dbConnect, findOneDocument, deleteOneDocument, User, User_Aliases } from 'solun-database-package';
import { getJWTData } from '../../../utils/jwt';
const { SolunApiClient } = require("../../../mail/mail");

export async function handleDeleteAliasRequest(req: Request, res: Response) {
  try {
    
    const jwt_data = getJWTData(req.body.token) as { user_id: string } | null;

    if (jwt_data == null) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await dbConnect();

    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let user_id = jwt_data.user_id;
    let fqa = req.body.fqa;

    const user = await findOneDocument(User, { user_id: user_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alias = await findOneDocument(User_Aliases, { fqa: fqa, user_id: user_id });
    if (!alias) {
      return res.status(404).json({ message: "Alias not found or does not belong to user" });
    }

    // Delete alias on mailserver
    const deleteAlias = await mcc.deleteAlias([fqa]);

    if (!deleteAlias) {
      return res.status(500).json({ message: "Something went wrong" });
    }

    await deleteOneDocument(User_Aliases, { fqa: fqa });

    await User.updateOne(
      { user_id: user_id },
      { $inc: { aliases: -1 } }
    );

    return res.status(200).json({ message: "Alias deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}