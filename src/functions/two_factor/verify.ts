import { Request, Response } from 'express';
import { dbConnect, findOneCASEDocument, User } from 'solun-database-package';
import { generateTempToken, comparePassword, decryptAuthPM } from 'solun-general-package';
import jwt from "jsonwebtoken";
import { totp } from "otplib";
import { KeyEncodings } from "otplib/core";
const base32Decode = require("base32-decode");

export async function handleVerifyTwoFactorRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    await dbConnect();

    let fqe = requestData.fqe;
    let twoFACode = requestData.twoFACode;
    let password = requestData.password;
    let service = requestData.service;

    const user = await findOneCASEDocument(User, { fqe: fqe });

    if (!user) {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    if (!(await comparePassword(password, user.password))) {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    const decryptedPrivateKey = decryptAuthPM(user.private_key, password) as any;

    if (decryptedPrivateKey == "") {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    const decryptedSecret = decryptAuthPM(user.two_fa_secret, password) as any;

    if (decryptedSecret == "") {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    const hexSecret = Buffer.from(
      base32Decode(decryptedSecret, "RFC4648")
    ).toString("hex");
    totp.options = { encoding: KeyEncodings.HEX };
    const isValid = totp.verify({ token: twoFACode, secret: hexSecret });

    if (isValid) {
      const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
      const token = jwt.sign(
        {
          fqe: user.fqe,
          username: user.username,
          user_id: user.user_id,
          private_key: decryptedPrivateKey,
          password: password,
        },
        // @ts-ignore: Works fine with it
        JWT_SECRET_KEY,
        { expiresIn: "1h" }
      );

      const two_fa = user.two_fa;

      if (service === "Mail" && user.active) {
        const url = await generateTempToken(
          user.user_id,
          user.fqe,
          "Mail",
          token,
          password,
          user.fast_login
        );

        if (typeof url === "string") {
            return res.status(200).json({redirect: true, redirectUrl: url, service: service, two_fa: two_fa});
        } else {
            return res.status(500).json({message: "Something went wrong"});
        }
      } else if (user.active) {
        return res.status(200).json({redirect: false, token: token, message: "Logged in successfully", two_fa: two_fa});
      } else {
        return res.status(400).json({redirect: false, message: "User is not active"});
      }
    } else {
        return res.status(400).json({ message: "2FA code is incorrect" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}