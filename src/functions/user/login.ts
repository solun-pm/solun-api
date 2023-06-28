import { dbConnect, findOneCASEDocument, User } from "solun-database-package";
import jwt from "jsonwebtoken";
import { decryptAuthPM } from "solun-general-package";
import { comparePassword } from "solun-general-package";
import { generateTempToken } from '../../generate/generate';
import { Request, Response } from 'express';

export async function handleLoginUserRequest(req: Request, res: Response) {
  try {
    await dbConnect();

    let fqe = req.body.fqe;
    let password = req.body.password;
    let service = req.body.service;

    const user = await findOneCASEDocument(User, { fqe: fqe });

    if (!user) {
      return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    if (!(await comparePassword(password, user.password))) {
      return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(
      {
        fqe: user.fqe,
        username: user.username,
        user_id: user.user_id
      },
      // @ts-ignore
      JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    const two_fa = user.two_fa;

    if (service === "Mail" && user.active) {
      if (!two_fa) {
        const url = await generateTempToken(
          user.user_id,
          user.fqe,
          "Mail",
          token,
          password,
          user.fast_login
        );

        if (typeof url === "string") {
          return res.status(200).json(
            {
              redirect: true,
              redirectUrl: url,
              service: service,
              two_fa: two_fa,
            }
          );
        } else {
          return res.status(500).json({ message: "Something went wrong" });
        }
      }
      return res.status(200).json(
        { redirect: false, message: "2FA is needed to login", two_fa: two_fa }
      );
    } else if (user.active) {
      return res.status(200).json(
        {
          redirect: false,
          token: token,
          message: "Logged in successfully",
          two_fa: two_fa,
        }
      );
    } else {
      return res.status(400).json({ redirect: false, message: "User is not active" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}