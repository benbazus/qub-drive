

import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class CryptoUtil {
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    static generateShareLink(): string {
        return crypto.randomBytes(10).toString('base64url');
    }
}
