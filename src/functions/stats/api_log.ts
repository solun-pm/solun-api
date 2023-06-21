import { Request, Response } from 'express';
import { dbConnect, api_logs } from 'solun-database-package'

export async function handleApiLogStatsRequest(req: Request, res: Response) {
  try {

    await dbConnect();

    const data = await api_logs.find({});
    
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}