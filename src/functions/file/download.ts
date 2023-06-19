import { dbConnect, findOneDocument, File } from "solun-database-package";
import { decryptFile } from "solun-server-encryption-package";

import fs from "fs";
import mime from "mime";
import { Request, Response } from 'express';

export async function handleDownloadFileRequest(req: Request, res: Response) {
    try {
        const id = req.body.id;
        let secret_key = req.body.secret || null;

        if (!id) {
            return res.status(400).json({ message: "No file ID provided" });
        }

        await dbConnect();

        const file = await findOneDocument(File, { file_id: id });

        if (file) {
            secret_key = secret_key || file.secret;

            await decryptFile(file.raw_file_path, secret_key, file.iv);

            const file_path = file.raw_file_path;
            const file_name = file.file_name;
            const fileStats = fs.statSync(file_path);

            res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length, File-Size, Deletion");
            res.setHeader('Content-Disposition', `attachment; filename="${file_name}"`);
            res.setHeader('Content-Type', mime.getType(file_name) || "application/octet-stream");
            res.setHeader('Content-Length', fileStats.size.toString());
            res.setHeader('File-Size', file.file_size);
            res.setHeader('Deletion', file.auto_delete);

            const fileStream = fs.createReadStream(file_path);
            fileStream.pipe(res);
        } else {
            return res.status(404).json({ message: "No file found with this ID" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "An error occurred while retrieving the file, please check if the link is correct and try again" });
    }
}