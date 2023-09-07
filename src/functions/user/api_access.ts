import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User, api_keys, deleteOneDocument } from 'solun-database-package';
import { generateToken } from 'solun-general-package';

export async function handleApiAccessUserRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    await dbConnect();

    let user_id = requestData.user_id;
    let api_access = requestData.api_access;

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    await updateOneDocument(
      User,
      { user_id: user_id },
      { api_access: api_access }
    );
    
    let token = null;

    console.log('api_access', api_access);
    if (api_access) {
      token = generateToken();
      console.log('token', token);

      const result = await findOneDocument(api_keys, { user_id: user_id });
      console.log('result', result);
      if (!result) {
        console.log('already exists');
        return res.status(400).json({ message: "Api access already exists" });
      }

      const newToken = new api_keys({
        user_id: user_id,
        token: token,
      });

      await newToken.save();
      console.log(newToken);
    } else {
      console.log('deleting');
      const deletedCount = await deleteOneDocument(api_access, { user_id: user_id });
      console.log('deletedCount', deletedCount);
    }

    return res.status(200).json({ message: "Api access updated successfully", token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}