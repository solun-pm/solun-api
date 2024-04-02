import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User, api_keys, deleteOneDocument } from 'solun-database-package';
import { generateToken } from 'solun-general-package';
import { getJWTData } from '../../utils/jwt';

export async function handleApiAccessUserRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    const jwt_data = getJWTData(req.body.token) as { user_id: string } | null;

    if (jwt_data == null) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await dbConnect();

    let api_access = requestData.api_access;

    const user = await findOneDocument(User, { user_id: jwt_data.user_id });

    if (!user) {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    await updateOneDocument(
      User,
      { user_id: jwt_data.user_id },
      { api_access: api_access }
    );
    
    let token = null;

    if (api_access) {
      token = generateToken();

      const result = await findOneDocument(api_keys, { user_id: jwt_data.user_id });
      if (result !== null) {
        return res.status(400).json({ message: "Api access already exists" });
      }

      const newToken = new api_keys({
        user_id: jwt_data.user_id,
        token: token,
      });

      await newToken.save();
    } else {
      await deleteOneDocument(api_keys, { user_id: jwt_data.user_id });
    }

    return res.status(200).json({ message: "Api access updated successfully", token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}