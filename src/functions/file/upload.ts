import { generateID, generateAES, generateIV, decryptTransfer, hashPassword } from "solun-general-package";
import { dbConnect, File } from "solun-database-package";
import { encryptFile } from "solun-server-encryption-package";
import { birdLog } from 'solun-database-package';

import { Request, Response } from 'express';

export async function handleUploadFileRequest(req: Request, res: Response) {
    try {
        const formData = req.body;
        const file = req.file;

        await dbConnect();

        let bruteforceSafe = formData.bruteforceSafe === "true";
        let password = formData.password;
        let endToEndEncryption = formData.endToEndEncryption === "true";    
        let autoDeletion = formData.autoDeletion;

        if (!file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        const maxSize = 2.5 * 1024 * 1024 * 1024;
        if (file.size > maxSize) {
            return res.status(400).json({ message: "File size exceeds the 2.5 GB limit" });
        }

        const fid = await generateID(bruteforceSafe);
        const secret_key = await generateAES();
        
        const dbSecretKey = endToEndEncryption ? null : secret_key;
        
        const filePath = file.path;
        
        const dbFilename = file.originalname;
        
        const iv = await generateIV();
        await encryptFile(filePath, secret_key as string, iv as Buffer);    

        const insertFile = new File({
            file_id: fid,
            file_path: filePath, // Deprecated as far as I know
            raw_file_path: filePath,
            file_name: dbFilename,
            file_type: file.mimetype,
            file_size: file.size,
            auto_delete: autoDeletion,
            secret: dbSecretKey,
            password: password,
            iv: iv.toString('hex'),
        });

        await insertFile.save();

        let link = process.env.NEXT_PUBLIC_MAIN_DOMAIN +"/file/" + fid + "/";
        if (endToEndEncryption as boolean) {
            link += secret_key + "/";
        }

        return res.status(200).json({
            message: "File uploaded successfully",
            file_id: fid,
            link: link,
        });
    } catch (err) {
        birdLog('uploadFileRequest', err, 'error');
        return res.status(500).json({ message: err });
    }
}