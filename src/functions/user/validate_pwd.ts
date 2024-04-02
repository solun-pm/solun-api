import { dbConnect, findOneDocument, User } from 'solun-database-package';
import { comparePassword } from 'solun-general-package';
import { Request, Response } from 'express';
import { getJWTData } from '../../utils/jwt';

export async function handleValidatePWDUserRequest(req: Request, res: Response) {
    try {
        const jwt_data = getJWTData(req.body.token) as { user_id: string } | null;

        if (jwt_data == null) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        await dbConnect();

        let user_id = jwt_data.user_id;
        let password = req.body.password;

        if (password === "") {
            return res.status(400).json({ message: "Please enter a password" });
        }

        const user = await findOneDocument(User, { user_id: user_id });

        if (!user) {
            return res.status(400).json({ message: "User does not exist or password is incorrect" });
        }

        if (!(await comparePassword(password, user.password))) {
            return res.status(400).json({ message: "Password is incorrect" });
        }

        return res.status(200).json({ status: 200 });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
}