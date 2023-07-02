import { Request, Response } from 'express';
import { dbConnect, findOneDocument, User } from 'solun-database-package';
import { comparePassword } from 'solun-general-package';


export async function handleCheckRecoveryCodeRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    await dbConnect();

    let fqe = requestData.fqe;
    let recoveryCode = requestData.recoveryCode;

    if (fqe === "" || recoveryCode === "") {
        return res.status(400).json({ message: "Please fill out all fields" });
    }

    const user = await findOneDocument(User, { fqe: fqe });

    if (!user) {
        return res.status(400).json({ message: "User does not exist or code is incorrect", correct: false });
    }

    if (!(await comparePassword(recoveryCode, user.recovery_key))) {
        return res.status(400).json({ message: "Code is incorrect", correct: false });
    }

    return res.status(200).json({ message: "Code is correct", correct: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}