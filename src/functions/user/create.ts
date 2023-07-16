import { Request, Response } from 'express';
import { generateKey } from "openpgp";
import { dbConnect, findOneDocument, findOneCASEDocument, User, User_Aliases } from 'solun-database-package';
import { hashPassword, checkUsername, checkPassword, encryptAuthPM } from 'solun-general-package';
const { SolunApiClient } = require("../../mail/mail");

export async function handleCreateUserRequest(req: Request, res: Response) {
  try {

    await dbConnect();
  
    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let username = req.body.username;
    let domain = req.body.domain;
    let fqe = `${username}${domain}`;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;
    let solution = req.body.solution;

    if (!username || !domain || !password || !confirmPassword) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    const usernameCheck = checkUsername(username);
    if (usernameCheck.message !== "") {
        return res.status(400).json({ message: usernameCheck.message });
    }

    const passwordCheck = checkPassword(password, confirmPassword);
    if (passwordCheck.message !== "") {
        return res.status(400).json({ message: passwordCheck.message });
    }

    const user = await findOneDocument(User, { fqe: fqe });
    const user_alias = await findOneCASEDocument(User_Aliases, { fqa: fqe });

    if (user) {
        return res.status(400).json({ message: "User already exists" });
    }

    if (user_alias) {
        return res.status(400).json({ message: "This mail is already in use as an alias" });
    }

    const solutionCheck = await fetch('https://api.friendlycaptcha.com/api/v1/siteverify',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solution: solution,
          secret: process.env.CAPTCHA_KEY,
          sitekey: process.env.NEXT_PUBLIC_SITE_KEY,
        }),
    });
    if (!solutionCheck.ok) {
        return res.status(400).json({ message: "Captcha failed" });
    }


    const passwordHashed = await hashPassword(password);

    // Generate OpenPGP key pair
    const { privateKey, publicKey } = await generateKey({
        type: "rsa",
        rsaBits: 4096,
        userIDs: [{ name: username, email: fqe }],
        //passphrase: password, idk if we need this
      });
  
    // Encrypt private key with password
    const encryptedPrivateKey = encryptAuthPM(privateKey, password);

    // Create user in mailserver
    const createMail = await mcc.addMailbox({
        active: 1,
        password: password,
        password2: password,
        quota: 1024,
        domain: domain.replace("@", ""),
        name: username,
        local_part: username,
      });
  
      if (!createMail) {
        return res.status(500).json({ message: "Something went wrong" });
      }
  
      // Set rate limit for user
      const updateRateLimit = await mcc.rateLimitMailbox({
        attr: {
          rl_value: "100",
          rl_frame: "d",
        },
        items: [fqe],
      });
  
      if (!updateRateLimit) {
        return res.status(500).json({ message: "Something went wrong" });
      }

      const updateUserACL = await mcc.updateMailboxACL(
        fqe,
        []
      );

      if (!updateUserACL) {
        return res.status(500).json({ message: "Something went wrong" });
      }

    const newUser = new User({
      user_id: Math.floor(Math.random() * 1000000000),
      username: username,
      domain: domain,
      fqe: fqe,
      password: passwordHashed,
      private_key: encryptedPrivateKey,
      public_key: publicKey,
    });

    await newUser.save();

    return res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}