import { comparePassword, decrypt } from 'solun-general-package';
import { dbConnect, findOneDocument, Message, birdLog } from 'solun-database-package';
import { Request, Response } from "express";

export async function handleReceiveMessageRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    await dbConnect();
    let id = requestData.id;
    let password = requestData.password;
    let secret_key = requestData.secret || null;

    console.log('id: ' + id)
    console.log('password:'+ password)
    console.log('secret_key: ' + secret_key)

    if (!id) {
        return res.status(400).json({ message: "No message ID provided." });
    }

    const message = await findOneDocument(Message, { message_id: id });

    if (message) {
      secret_key = secret_key || message.secret;
      console.log('secret_key: ' + secret_key)

      if (message.password) {
        if (!password) {
            return res.status(400).json({ message: "This message requires a password" });
        } else {
          if (!await comparePassword(password, message.password)) {
            return res.status(403).json({ message: "Incorrect password" });
          }
        }
      }

      console.log('secret_key: ' + secret_key)

      return res.status(200).json({ valid: true, secret: secret_key });
    } else {
        return res.status(404).json({ valid: false, message: "No message found with this ID" });
    }
  } catch (err) {
    birdLog('receiveMessageRequest', err, 'error');
    return res.status(500).json({ valid: false, message: "An error occurred while retrieving the message, please check if the link is correct and try again" });
  }
};