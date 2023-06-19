import { generateID, generateAES, decryptTransfer, hashPassword } from 'solun-general-package';
import { dbConnect, Message } from 'solun-database-package';
import { encrypt } from 'solun-server-encryption-package';
import { Request, Response } from 'express';
import { birdLog } from 'solun-database-package';

export async function handleCreateMessageRequest(req: Request, res: Response) {
    try {
        const requestData = req.body;

        await dbConnect();

        let message_text = requestData.tmpEncryptMsg;
        let bruteforceSafe = requestData.bruteforceSafe;
        let password = requestData.tmpEncryptPwd;
        let endToEndEncryption = requestData.endToEndEncryption;

        message_text = await decryptTransfer(message_text);

        if (password !== '') {
            password = await decryptTransfer(password);
        }

        if (!message_text) {
            return res.status(400).json({ message: "Please enter a message" });
        }

        const mid = await generateID(bruteforceSafe);
        const secret_key = await generateAES();
        const encrypted_message = await encrypt(message_text, secret_key as string);
        
        const passwordSet = password !== "";
        const encrypted_password = passwordSet ? await hashPassword(password) : null;

        const dbSecretKey = endToEndEncryption ? null : secret_key;
        
        const insertMessage = new Message({
          message_id: mid,
          message: encrypted_message,
          secret: dbSecretKey,
          password: encrypted_password
        });

        await insertMessage.save();

        let link = process.env.NEXT_PUBLIC_MAIN_DOMAIN + "/msg/" + mid + "/";
        if (endToEndEncryption) {
            link += secret_key + "/";
        }

        return res.status(200).json({ message: "Message created successfully", message_id: mid, link: link });
    } catch (err) {
        birdLog('createMessageRequest', err, 'error');
        return res.status(500).json({ message: "An error occurred while creating the message, please try again" });
    }
};