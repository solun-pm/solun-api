import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User } from 'solun-database-package';
import { getJWTData } from '../../utils/jwt';

export async function handleBetaFeaturesUserRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    const jwt_data = getJWTData(req.body.token) as { user_id: string } | null;

    if (jwt_data == null) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await dbConnect();

    let beta_features = requestData.beta_features;

    const user = await findOneDocument(User, { user_id: jwt_data.user_id });

    if (!user) {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    await updateOneDocument(
      User,
      { user_id: jwt_data.user_id },
      { beta: beta_features }
    );

    return res.status(200).json({ message: "Beta features updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}