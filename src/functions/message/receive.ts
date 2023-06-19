import { comparePassword } from 'solun-general-package';
import { dbConnect, findOneDocument, Message } from 'solun-database-package';
import { decrypt } from 'solun-server-encryption-package';
import { Request, Response } from "express";
import { birdLog } from 'solun-database-package';

export async function handleReceiveMessageRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    await dbConnect();
    let id = requestData.id;
    let password = requestData.password;
    let secret_key = requestData.secret || null;

    if (!id) {
        return res.status(400).json({ message: "No message ID provided." });
    }

    const message = await findOneDocument(Message, { message_id: id });

    if (message) {
      secret_key = secret_key || message.secret;

      if (message.password) {
        if (!password) {
            return res.status(400).json({ message: "This message requires a password" });
        } else {
          if (!await comparePassword(password, message.password)) {
            return res.status(403).json({ message: "Incorrect password" });
          }
        }
      }

      const decrypted_message = await decrypt(message.message, secret_key);
      return res.status(200).json({ valid: true, message: decrypted_message });
    } else {
        return res.status(404).json({ valid: false, message: "No message found with this ID" });
    }
  } catch (err) {
    birdLog('receiveMessageRequest', err, 'error');
    return res.status(500).json({ valid: false, message: "An error occurred while retrieving the message, please check if the link is correct and try again" });
  }
};