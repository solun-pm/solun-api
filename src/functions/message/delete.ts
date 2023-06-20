import { dbConnect, deleteOneDocument, Message } from "solun-database-package";
import { Request, Response } from "express";
import { birdLog } from 'solun-database-package';

export async function handleDeleteMessageRequest(req: Request, res: Response) {
  try {
    const requestData = req.body;

    await dbConnect();
    let id = requestData.id;

    if (!id) {
        return res.status(400).json({ message: "No message ID provided." });
    }

    const deletedCount = await deleteOneDocument(Message, { message_id: id });

    if (deletedCount > 0) {
        return res.status(200).json({ message: "Message deleted successfully" });
    } else {
        return res.status(404).json({ message: "No message found with this ID" });
    }
  } catch (err) {
    birdLog('deleteMessageRequest', err, 'error');
    return res.status(500).json({ message: "An error occurred while deleting the message, please try again" });
  }
}