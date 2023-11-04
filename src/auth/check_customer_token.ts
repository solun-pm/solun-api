import { dbConnect, api_keys, findOneDocument } from 'solun-database-package'

export async function checkToken(token: string) {
    await dbConnect();
    try {
        const result = await findOneDocument(api_keys, { token: token });
        if (result === null) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error(error);
        return false;
    }
}