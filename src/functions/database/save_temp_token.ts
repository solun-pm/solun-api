import { Request, Response } from 'express';
import { dbConnect, temp_token } from 'solun-database-package'

export async function handleSaveTempTokenDatabaseRequest(req: Request, res: Response) {
  try {
    const res = await req.body;

    await dbConnect();

    let user_id = res.user_id;
    let fqe = res.fqe;
    let service = res.service;
    let tempToken = res.token;
    let password = res.password;
    let fast_login = res.fast_login;

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