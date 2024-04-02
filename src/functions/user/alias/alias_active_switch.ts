import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User, User_Aliases } from 'solun-database-package';
import { getJWTData } from '../../../utils/jwt';
const { SolunApiClient } = require("../../../mail/mail");

export async function handleSwitchStateAliasRequest(req: Request, res: Response) {
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
      let alias_state = req.body.alias_state;

    if (!user_id || !fqa) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    const user = await findOneDocument(User, { user_id: user_id });
    const alias = await findOneDocument(User_Aliases, { fqa: fqa, user_id: user_id });

    if (!user) {
        return res.status(400).json({ message: "User does not exist" });
    }

    if (!alias) {
        return res.status(400).json({ message: "Alias does not exist" });
    }

    // Update alias on mailserver
    const updateAlias = await mcc.updateAlias({
        active: alias_state ? 1 : 0,
    },
    [fqa]);

    if (!updateAlias) {
        return res.status(500).json({ message: "Something went wrong" });
    }

    await updateOneDocument(
      User_Aliases,
      { fqa: fqa },
      { active: alias_state }
    );

    return res.status(200).json({ message: "Alias updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}