import { Request, Response } from 'express';
import { dbConnect, findOneDocument, updateOneDocument, User } from 'solun-database-package';
import { comparePassword, hashPassword } from 'solun-general-package';
import { decrypt, encrypt } from "solun-server-encryption-package";
const { SolunApiClient } = require("solun-general-package");


export async function handleChangePWDUserRequest(req: Request, res: Response) {
  try {
    const res = req.body;

    await dbConnect();
    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let user_id = res.user_id;
    let currentPassword = res.currentPassword;
    let newPassword = res.newPassword;

    if (currentPassword === "" || newPassword === "") {
        return res.status(400).json({ message: "Please fill out all fields" });
    }

    if (newPassword.length < 6 || !newPassword.match(/[^a-zA-Z0-9]/)) {
        return res.status(400).json({ message: "Password must be at least 6 characters long and contain at least 1 special character" });
    }

    const user = await findOneDocument(User, { user_id: user_id });

    if (!user) {
        return res.status(400).json({ message: "User does not exist or password is incorrect" });
    }

    if (!(await comparePassword(currentPassword, user.password))) {
        return res.status(400).json({ message: "Password is incorrect" });
    }

    const decryptedPrivateKey = decrypt(user.private_key, currentPassword) as any;
    const encryptedPrivateKey = encrypt(decryptedPrivateKey, newPassword);

    // Set password in mailserver
    const updateMailbox = await mcc.updateMailbox({
      attr: {
        force_pw_update: 0,
        password: newPassword,
        password2: newPassword,
      },
      items: [user.fqe],
    });

    if (!updateMailbox) {
        return res.status(500).json({ message: "Something went wrong" });
    }

    if (user.two_fa) {
      const decryptedTwoFASecret = decrypt(user.two_fa_secret, currentPassword) as any;
      const encryptedTwoFASecret = encrypt(decryptedTwoFASecret, newPassword);

      await updateOneDocument(
        User,
        { user_id: user_id },
        { two_fa_secret: encryptedTwoFASecret }
      );
    }
    const hashedPassword = await hashPassword(newPassword);

    await updateOneDocument(
      User,
      { user_id: user_id },
      { password: hashedPassword, private_key: encryptedPrivateKey }
    );

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}