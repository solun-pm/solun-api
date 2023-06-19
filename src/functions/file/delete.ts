import { dbConnect, findOneDocument, deleteOneDocument, File } from "solun-database-package";
import { encryptFile } from "solun-server-encryption-package";

import fs from "fs";
import { Request, Response } from 'express';

export async function handleDeleteFileRequest(req: Request, res: Response) {
    try {
        let id = req.body.id;
        let secret_key = req.body.secret || null;
        let forceDeleteOn1Download = req.body.forceDeleteOn1Download;
        let encryptAgain = req.body.encryptAgain;
        let mobile = req.body.mobile;

        if (!id) {
            return res.status(400).json({ message: "No file ID provided" });
        }

        await dbConnect();

        const file = await findOneDocument(File, { file_id: id });

        if (file) {
            secret_key = secret_key || file.secret;
            const file_path = file.raw_file_path;

            const deletionMode = file.auto_delete;
            const ivBuffer = Buffer.from(file.iv, 'hex');

            if (deletionMode === 'download'){
                if(encryptAgain) {
                    await encryptFile(file_path, secret_key, ivBuffer);
                }
                if(forceDeleteOn1Download){
                    fs.unlinkSync(file_path);
                    await deleteOneDocument(File, { file_id: id });
                    return res.status(200).json({ message: "File deleted successfully" });
                }
                return res.status(200).json({ message: "File will be deleted after download" });
            } else if (deletionMode === 'never') {
                if(encryptAgain) {
                    await encryptFile(file_path, secret_key, ivBuffer);
                }
                return res.status(200).json({ message: "Auto Deletion is disabled for this file, it will never be deleted" });
            } else {
                const deletionTimes = {
                    '1d': 1 * 24 * 60 * 60 * 1000,
                    '1w': 7 * 24 * 60 * 60 * 1000,
                    '1m': 30 * 24 * 60 * 60 * 1000,
                    '3m': 3 * 30 * 24 * 60 * 60 * 1000,
                    '6m': 6 * 30 * 24 * 60 * 60 * 1000,
                    '1y': 365 * 24 * 60 * 60 * 1000,
                };
                if (file.auto_delete in deletionTimes) {
                    const createdAtTimestamp = new Date(file.createdAt).getTime();
                    // @ts-ignore - TS doesn't know that auto_delete is a key of deletionTimes
                    const deletionTime = createdAtTimestamp + deletionTimes[file.auto_delete];
                    const remainingTimeMs = deletionTime - Date.now();
                    const remainingTimeSeconds = Math.floor(remainingTimeMs / 1000);
                    const remainingTimeMinutes = Math.floor(remainingTimeSeconds / 60);
                    const remainingTimeHours = Math.floor(remainingTimeMinutes / 60);
                    const remainingTimeDays = Math.floor(remainingTimeHours / 24);
                    
                    const remainingSeconds = remainingTimeSeconds % 60;
                    const remainingMinutes = remainingTimeMinutes % 60;
                    const remainingHours = remainingTimeHours % 24;
                    const remainingDays = remainingTimeDays;
                    
                    let timeString = '';
                    if (remainingDays > 0) {
                      timeString += `${remainingDays} days, `;
                    }
                    if (remainingHours > 0) {
                      timeString += `${remainingHours} hours, `;
                    }
                    if (remainingMinutes > 0) {
                      timeString += `${remainingMinutes} minutes, `;
                    }
                    if (remainingSeconds > 0) {
                      timeString += `${remainingSeconds} seconds`;
                    }
                    
                    if(encryptAgain) {
                      await encryptFile(file_path, secret_key, ivBuffer);
                    }
                    
                    return res.status(200).json({ message: "File will be deleted in " + timeString });
                  } else {
                    if(encryptAgain) {
                        await encryptFile(file_path, secret_key, ivBuffer);
                    }

                    fs.unlinkSync(file_path);
                    await deleteOneDocument(File, { file_id: id });
                    return res.status(200).json({ message: "File deleted successfully" });
                }
            }
        } else {
            return res.status(404).json({ message: "No file found with this ID" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "An error occurred while deleting the message, please try again: " + err });
    }
}