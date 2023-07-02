import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User } from 'solun-database-package';
import { generateKey } from "openpgp";
import { comparePassword, hashPassword, encryptAuthPM, checkPassword } from 'solun-general-package';
const { SolunApiClient } = require("../../../mail/mail");


export async function handleResetPasswordRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    await dbConnect();
    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let fqe = requestData.fqe;
    let password = requestData.password;
    let confirmPassword = requestData.confirmPassword;
    let oldRecoveryCode = requestData.oldRecoveryCode;
    let newRecoveryCode = requestData.newRecoveryCode;

    if (fqe === "" || password === "" || confirmPassword === "" || newRecoveryCode === "") {
        return res.status(400).json({ message: "Please fill out all fields" });
    }

    const passwordCheck = checkPassword(password, confirmPassword);
    if (passwordCheck.message !== "") {
        return res.status(400).json({ message: passwordCheck.message });
    }

    const user = await findOneDocument(User, { fqe: fqe });

    if (!user) {
        return res.status(400).json({ message: "User does not exist or code is incorrect" });
    }

    if (!(await comparePassword(oldRecoveryCode, user.recovery_key))) {
        return res.status(400).json({ message: "Recovery code is incorrect" });
    }

    // Generate OpenPGP key pair
    const { privateKey, publicKey } = await generateKey({
        type: "rsa",
        rsaBits: 4096,
        userIDs: [{ name: user.username, email: fqe }],
        //passphrase: password, idk if we need this
      });
  
    // Encrypt private key with password
    const encryptedPrivateKey = encryptAuthPM(privateKey, password);

    // Set password in mailserver
    const updateMailbox = await mcc.updateMailbox({
      attr: {
        force_pw_update: 0,
        password: password,
        password2: password,
      },
      items: [user.fqe],
    });

    if (!updateMailbox) {
        return res.status(500).json({ message: "Something went wrong" });
    }

    if (user.two_fa) {
      await updateOneDocument(
        User,
        { user_id: user.user_id },
        { two_fa: false, two_fa_secret: "" }
      );
    }
    const hashedPassword = await hashPassword(password);

    await updateOneDocument(
      User,
      { user_id: user.user_id },
      { 
        password: hashedPassword, 
        private_key: encryptedPrivateKey,
        public_key: publicKey,
        recovery_key: newRecoveryCode
      }
    );

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}