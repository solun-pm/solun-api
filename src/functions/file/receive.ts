import { comparePassword } from "solun-general-package";
import { dbConnect, findOneDocument, File } from "solun-database-package";
import { Request, Response } from 'express';
import { birdLog } from 'solun-database-package';

export async function handleReceiveFileRequest(req: Request, res: Response) {
    try {
        const requestData = req.body;

        await dbConnect();
        let id = requestData.id;
        let password = requestData.password;
        let secret_key = requestData.secret || null;

        if (!id) {
            return res.status(400).json({ message: "No file ID provided." });
        }

        const file = await findOneDocument(File, { file_id: id });

        if (file) {
        secret_key = secret_key || file.secret;

        if (file.password) {
            if (!password) {
                return res.status(400).json({ message: "This file requires a password." });
            } else {

            if (!await comparePassword(password, file.password)) {
                return res.status(403).json({ message: "Incorrect password" });
            }
            }
        }

        return res.status(200).json({
            valid: true,
            link: file.file_path,
            file_raw_path: file.raw_file_path,
            name: file.file_name,
            type: file.file_type,
            size: file.file_size,
        });
        } else {
            return res.status(404).json({ valid: false, message: "No file found with this ID." });
        }
    } catch (err) {
        birdLog('receiveFileRequest', err, 'error');
        return res.status(500).json({ valid: false, message: "An error occurred while retrieving the file, please check if the link is correct and try again" });
    }
};