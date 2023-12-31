import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User } from 'solun-database-package';

export async function handleEnableTwoFactorRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    await dbConnect();

    let user_id = requestData.user_id;
    let secret = requestData.secret;

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
        return res.status(400).json({ message: 'User doest not exist or password is incorrect' });
    }

    await updateOneDocument(
      User,
      { user_id: user_id },
      { two_fa: true, two_fa_secret: secret }
    );

    return res.status(200).json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}
