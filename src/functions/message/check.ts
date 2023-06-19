import { dbConnect, findOneDocument, Message } from 'solun-database-package';
import { Request, Response } from 'express';
import { birdLog } from 'solun-database-package';

export async function handleCheckMessageRequest(req: Request, res: Response) {
    try {
        const requestData = req.body;

        await dbConnect();
        let id = requestData.id;

        if (!id) {
            return res.status(400).json({ message: "Invalid message ID provided" });
        }
    
        const message = await findOneDocument(Message, { message_id: id });

        if (message) {
            return res.status(200).json({ valid: true, password: message.password !== null });
        } else {
            return res.status(404).json({ valid: false, message: "No message found with this ID" });
        }
    } catch (err) {
        birdLog('checkMessageRequest', err, 'error');
        return res.status(500).json({ valid: false, message: "An error occurred while checking the message, please try again" });
    }
};