import { Request, Response } from 'express';
import { generateKey } from "openpgp";
import { dbConnect, findOneDocument, User, User_Mailboxes, User_Aliases, User_Domains } from 'solun-database-package';
import { hashPassword, checkUsername, checkPassword, encryptAuthPM } from 'solun-general-package';
const { SolunApiClient } = require("../../../mail/mail");
import { checkPlanCaps } from '../../../plans/check';

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
        return res.status(400).json({ message: "Please fill in all fields", valid: false });
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

    const user_details = await findOneDocument(User, { user_id: user_id });

    if (!user_details.admin) {
      const caps = checkPlanCaps(user_details.membership);
      const maxMailboxes = caps[0].maxMailboxes;
      if (user_details.mailboxes >= maxMailboxes) {
          return res.status(400).json({ message: "You have reached your maximum number of mailboxes for your plan", valid: false, code: "geringverdiener" });
      }
    }

    const user = await findOneDocument(User, { fqe: fqe });
    const user_alias = await findOneDocument(User_Aliases, { fqa: fqe });
    const user_domain = await findOneDocument(User_Domains, { domain: domain.replace('@', ''), user_id: user_id });
    const user_mailbox = await findOneDocument(User_Mailboxes, { fqe: fqe });

    if (user) {
        return res.status(400).json({ message: "This mailbox already exists", valid: false });
    }

    if (user_alias) {
        return res.status(400).json({ message: "This mail is already in use as an alias", valid: false });
    }

    if (!user_domain) {
        return res.status(400).json({ message: "This domain does not exist or does not belong to you", valid: false });
    }

    if (user_mailbox) {
        return res.status(400).json({ message: "This mailbox already exists", valid: false });
    }

    const checkIfCheckAllIsEnabled = await findOneDocument(User_Domains, { user_id: user_id, domain: domain.replace('@', ''), catch_all: true });

    if (checkIfCheckAllIsEnabled) {
        return res.status(400).json({ message: "You cannot create a mailbox on a domain with catch all enabled", valid: false });
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
        return res.status(500).json({ message: "Something went wrong", valid: false });
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
        return res.status(500).json({ message: "Something went wrong", valid: false });
      }

      const updateUserACL = await mcc.updateMailboxACL(
        fqe,
        []
      );

      if (!updateUserACL) {
        return res.status(500).json({ message: "Something went wrong", valid: false });
      }

    const newMailbox = new User_Mailboxes({
      user_id: user_id,
      username: username,
      domain: domain,
      fqe: fqe,
      password: passwordHashed,
      private_key: encryptedPrivateKey,
      public_key: publicKey,
      quota: quota,
      rate_limit: 100,
      rate_limit_interval: "D",
    });

    await newMailbox.save();

    await user_details.updateOne(
      { user_id: user_id },
      { $inc: { mailboxes: 1 } }
    );

    return res.status(200).json({ message: "Mailbox created successfully", valid: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}