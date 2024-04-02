import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User, User_Aliases } from 'solun-database-package';
import { getJWTData } from '../../../utils/jwt';

export async function handleGetAliasRequest(req: Request, res: Response) {
  try {
    
    const jwt_data = getJWTData(req.body.token) as { user_id: string } | null;

    if (jwt_data == null) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await dbConnect();

    let user_id = jwt_data.user_id;

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const aliases = await User_Aliases.find({ user_id: user_id });

    return res.status(200).json(aliases);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}