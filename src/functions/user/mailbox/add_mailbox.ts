import { Request, Response } from 'express';
import { generateKey } from "openpgp";
import { dbConnect, findOneDocument, User, User_Mailboxes, User_Aliases, User_Domains } from 'solun-database-package';
import { hashPassword, checkUsername, checkPassword, encryptAuthPM } from 'solun-general-package';
const { SolunApiClient } = require("../../../mail/mail");

export async function handleAddMailboxRequest(req: Request, res: Response) {
  try {

    await dbConnect();
  
    const mcc = new SolunApiClient(
      process.env.MAILSERVER_BASEURL,
      process.env.MAILSERVER_API_KEY
    );

    let user_id = req.body.user_id;
    let username = req.body.username;
    let domain = req.body.domain;
    let fqe = `${username}${domain}`;
    let password = req.body.password;
    let confirmPassword = req.body.confirm_password;
    let quota = req.body.quota;

    if (!user_id || !username || !domain || !password || !confirmPassword) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

     // TODO: Move to config file.
     const SolunOwnedDomains = [
      "@solun.pm",
      "@6crypt.com",
      "@seal.pm",
      "@xolus.de",
      "@cipher.pm",
    ];

    const isSolunDomain = SolunOwnedDomains.includes(domain) ? true : false;

    const usernameCheck = checkUsername(username, !isSolunDomain);
    if (usernameCheck.message !== "") {
        return res.status(400).json({ message: usernameCheck.message });
    }

    const passwordCheck = checkPassword(password, confirmPassword);
    if (passwordCheck.message !== "") {
        return res.status(400).json({ message: passwordCheck.message });
    }

    const user = await findOneDocument(User, { fqe: fqe });
    const user_alias = await findOneDocument(User_Aliases, { fqa: fqe });
    const user_domain = await findOneDocument(User_Domains, { domain: '@'+domain, user_id: user_id });
    const user_mailbox = await findOneDocument(User_Mailboxes, { fqe: fqe });

    if (user) {
        return res.status(400).json({ message: "User already exists" });
    }

    if (user_alias) {
        return res.status(400).json({ message: "This mail is already in use as an alias" });
    }

    if (!user_domain) {
        return res.status(400).json({ message: "This domain does not exist or does not belong to you" });
    }

    if (user_mailbox) {
        return res.status(400).json({ message: "This mailbox already exists" });
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
        quota: quota,
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

    const newMailbox = new User({
      user_id: user_id,
      username: username,
      domain: domain,
      fqe: fqe,
      password: passwordHashed,
      private_key: encryptedPrivateKey,
      public_key: publicKey,
      quota: quota,
      rate_limit: 100,
      rate_limit_interval: "d",
    });

    await newMailbox.save();

    return res.status(200).json({ message: "Mailbox created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}