import { dbConnect, findOneDocument, File } from "solun-database-package";
import { Request, Response } from 'express';
import { birdLog } from 'solun-database-package';

export async function handleCheckFileRequest(req: Request, res: Response) {
    try {
        const requestData = req.body;

        await dbConnect();
        let id = requestData.id;

        if (!id) {
            return res.status(400).json({ message: "No file ID provided." });
        }
    
        const file = await findOneDocument(File, { file_id: id });

        if (file) {
            return res.status(200).json({ valid: true, password: file.password !== null });
        } else {
            return res.status(404).json({ valid: false, message: "No file found with this ID." });
        }
    } catch (err) {
        birdLog('checkFileRequest', err, 'error');
        return res.status(500).json({ valid: false, message: "An error occurred while checking the file, please try again" });
    }
};