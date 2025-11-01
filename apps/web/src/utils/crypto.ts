

import crypto from 'crypto';

export class CryptoUtil {


    static generateShareLink(): string {
        return crypto.randomBytes(6).toString('base64url');
    }
}
