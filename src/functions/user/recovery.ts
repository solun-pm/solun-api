import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User } from 'solun-database-package';
import { getJWTData } from '../../utils/jwt';

export async function handleRecoveryUserRequest(req: Request, res: Response) {
  try {
    const jwt_data = getJWTData(req.body.token) as { user_id: string } | null;

    if (jwt_data == null) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await dbConnect();

    let user_id = jwt_data.user_id;
    let recovery = req.body.enableRecovery;
    let code = req.body.recoveryCode;

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    await updateOneDocument(User, { user_id: user_id }, { recoverable: recovery, recovery_key: code });

    return res.status(200).json({ message: "Recovery settings updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}