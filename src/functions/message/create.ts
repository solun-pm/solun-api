import { dbConnect, Message } from 'solun-database-package';
import { Request, Response } from 'express';
import { birdLog } from 'solun-database-package';

export async function handleCreateMessageRequest(req: Request, res: Response) {
    try {
        const requestData = req.body;

        await dbConnect();

        let message_id = requestData.mid;
        let encrypted_message = requestData.encrypted_message;
        let dbSecretKey = requestData.dbSecretKey;
        let encrypted_password = requestData.encrypted_password;

        console.log('id: ' + message_id)
        console.log('msg: ' + encrypted_message)
        console.log('secret: ' + dbSecretKey)
        console.log('pwd: ' + encrypted_password)

        const insertMessage = new Message({
          message_id: message_id,
          message: encrypted_message,
          secret: dbSecretKey,
          password: encrypted_password
        });

        await insertMessage.save();

        let link = process.env.NEXT_PUBLIC_MAIN_DOMAIN + "/msg/" + message_id + "/";

        console.log('link: ' + link)

        return res.status(200).json({ message: "Message created successfully", message_id: message_id, link: link });
    } catch (err) {
        birdLog('createMessageRequest', err, 'error');
        return res.status(500).json({ message: "An error occurred while creating the message, please try again" });
    }
};