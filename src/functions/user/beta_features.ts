import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User } from 'solun-database-package';

export async function handleBetaFeaturesUserRequest(req: Request, res: Response) {
  try {
    const res = await req.body;

    await dbConnect();

    let user_id = res.user_id;
    let beta_features = res.beta_features;

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    await updateOneDocument(
      User,
      { user_id: user_id },
      { beta: beta_features }
    );

    return res.status(200).json({ message: "Beta features updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}