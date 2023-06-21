import { generateToken, encryptAuthPM } from "solun-general-package";
import { dbConnect, temp_token } from "solun-database-package";

export async function generateTempToken(
    user_id: number,
    fqe: string,
    service: string,
    token: any,
    password: string,
    fast_login: boolean
  ) {
    await dbConnect();
    try {
      const tempToken = generateToken();
      const e2eeSecretKey = fast_login ? generateToken() : "";
      const encryptedPwd = fast_login
        ? encryptAuthPM(password, e2eeSecretKey as string)
        : "";

      const newTempToken = new temp_token({
        user_id: user_id,
        fqe: fqe,
        token: tempToken,
        service: service,
        password: encryptedPwd,
        fast_login: fast_login,
      });
      await newTempToken.save();
  
      const redirectUrl = fast_login
        ? process.env.NEXT_PUBLIC_WEBMAIL_AUTH_DOMAIN as string +
          tempToken +
          "/" +
          e2eeSecretKey
        : process.env.NEXT_PUBLIC_WEBMAIL_AUTH_DOMAIN as string + tempToken;
  
      return redirectUrl;
    } catch (error) {
      console.error(error);
      return 0;
    }
  }