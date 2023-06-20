import { Request, Response } from 'express';
import { dbConnect, temp_token } from 'solun-database-package'

export async function handleSaveTempTokenDatabaseRequest(req: Request, res: Response) {
  try {
    const requestData = await req.body;

    await dbConnect();

    let user_id = requestData.user_id;
    let fqe = requestData.fqe;
    let service = requestData.service;
    let tempToken = requestData.token;
    let password = requestData.password;
    let fast_login = requestData.fast_login;

    const newTempToken = new temp_token({
      user_id: user_id,
      fqe: fqe,
      token: tempToken,
      service: service,
      password: password,
      fast_login: fast_login,
    });
    await newTempToken.save();

    return res.status(200).json({ message: "TempToken saved" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}