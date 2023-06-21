import { Request, Response } from 'express';
import jwt from "jsonwebtoken";
import { decryptAuthPM, comparePassword, generateToken } from "solun-general-package";
import { dbConnect, findOneCASEDocument, findOneDocument, deleteOneDocument, temp_token, User, app_password } from "solun-database-package";
const { SolunApiClient } = require("../../mail/mail");

export async function handleLoginWebmailRequest(req: Request, res: Response) {
  try {
    const requestData = await req.body;

    await dbConnect();
    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let fqe = requestData.fqe;
    let password = requestData.password;
    let tempToken = requestData.tempToken;
    let decryptToken = requestData.decryptToken;
    let fast_login = requestData.fast_login;

    const db = await findOneCASEDocument(User, { fqe: fqe });
    const dbTemp = await findOneDocument(temp_token, { token: tempToken });

    if (fast_login) {
        password = decryptAuthPM(dbTemp.password, decryptToken);
    }

    if (!await comparePassword(password, db.password)) {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    };

    const decryptedPrivateKey = decryptAuthPM(db.private_key, password);

    if (decryptedPrivateKey == ""){
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    // Create Unique App Password for User Session and save to Mailserver
    const app_name = 'webmail_' + db.user_id + '_' + Date.now();
    const appPwd = generateToken();
    const addAppPassword = await mcc.addAppPassword({
      active: 1,
      username: fqe,
      app_name: app_name,
      app_passwd: appPwd,
      app_passwd2: appPwd,
      protocols: [
        'imap_access',
        'smtp_access',
        'pop3_access'
      ]
    });

    if (!addAppPassword) {
        return res.status(500).json({ message: "Something went wrong" });
    }

    // Save App Password to Solun Database
    const newAppPassword = new app_password({
      user_id: db.user_id,
      app_name: app_name,
    })

    await newAppPassword.save();

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(
        {
            fqe: fqe,
            username: db.username,
            user_id: db.user_id,
            private_key: decryptedPrivateKey,
            password: appPwd,
        },
        // @ts-ignore
        JWT_SECRET_KEY,
        { expiresIn: "3h" }
    );

    await deleteOneDocument(temp_token, { token: tempToken });

    return res.status(200).json({ token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}