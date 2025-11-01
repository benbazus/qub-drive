import bcrypt from "bcryptjs";
import crypto from "crypto";

export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

export const generateSecureToken = (): string => {
    return crypto.randomBytes(32).toString("hex");
};
export const generateOtpCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export type FileType =
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'spreadsheet'
    | 'presentation'
    | 'archive'
    | 'code'
    | 'font'
    | 'executable'
    | 'disk-image'
    | 'database'
    | '3d-model'
    | 'unknown';

// 2. The source of truth: A mapping of categories to their extensions.
// This is easy to read and maintain.
const fileCategories: Record<FileType, string[]> = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'heic', 'avif'],
    video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'],
    document: ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt', 'pages'],
    spreadsheet: ['xls', 'xlsx', 'ods', 'csv', 'numbers'],
    presentation: ['ppt', 'pptx', 'odp', 'key'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'],
    code: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass', 'json', 'xml', 'yaml', 'yml', 'md', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'go', 'rb', 'php', 'sql', 'sh', 'bat', 'ps1'],
    font: ['ttf', 'otf', 'woff', 'woff2', 'eot'],
    executable: ['exe', 'msi', 'dmg', 'app', 'deb', 'rpm'],
    'disk-image': ['iso', 'img', 'vhd', 'vmdk'], // The user specifically asked for 'img'
    database: ['sqlite', 'db', 'sql', 'mdb', 'accdb'],
    '3d-model': ['obj', 'fbx', 'gltf', 'glb', 'stl', '3ds'],

    // 'unknown' has no extensions, it's the fallback
    unknown: [],
};

const extensionToCategoryMap = new Map<string, FileType>();

for (const category in fileCategories) {
    const extensions = fileCategories[category as FileType];
    for (const extension of extensions) {
        extensionToCategoryMap.set(extension, category as FileType);
    }
}


export function getFileType(filename: string): FileType {
    // Handle invalid or empty input
    if (!filename || typeof filename !== 'string') {
        return 'unknown';
    }

    // Extract the extension. This handles multiple dots (e.g., 'archive.tar.gz' -> 'gz')
    // and dotfiles (e.g., '.bashrc' -> 'bashrc').
    const lastDotIndex = filename.lastIndexOf('.');

    // If there's no dot, or if the dot is the very first character of a file with no other dots (like '.'),
    // or if the dot is the last character (e.g., 'file.'), there's no valid extension.
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
        return 'unknown';
    }

    const extension = filename.substring(lastDotIndex + 1).toLowerCase();

    // Look up the extension in our pre-built map.
    // If not found, default to 'unknown'.
    return extensionToCategoryMap.get(extension) || 'unknown';
}


// --- Usage Examples ---

console.log(`'document.pdf' is of type: ${getFileType('document.pdf')}`); // 'document'
console.log(`'MyVacation.JPEG' is of type: ${getFileType('MyVacation.JPEG')}`); // 'image'
console.log(`'archive.tar.gz' is of type: ${getFileType('archive.tar.gz')}`); // 'archive'
console.log(`'script.ts' is of type: ${getFileType('script.ts')}`); // 'code'
console.log(`'system.img' is of type: ${getFileType('system.img')}`); // 'disk-image'
console.log(`'unsupported.xyz' is of type: ${getFileType('unsupported.xyz')}`); // 'unknown'
console.log(`'nodotfile' is of type: ${getFileType('nodotfile')}`); // 'unknown'
console.log(`'.bash_profile' is of type: ${getFileType('.bash_profile')}`); // 'code' (from 'sh' family)
console.log(`'filewithtrailingdot.' is of type: ${getFileType('filewithtrailingdot.')}`); // 'unknown'
console.log(`null is of type: ${getFileType(null as any)}`); // 'unknown'

export const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function convertBytesToSize(bytes: number): string {
    if (bytes < 0) return "Invalid size";

    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    if (bytes === 0) return "0 B";

    // Find the index of the unit to use by dividing bytes by 1024 repeatedly
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    // Calculate the value in that unit, rounding to 2 decimal places
    const value = bytes / Math.pow(1024, i);

    return `${value.toFixed(2)} ${units[i]}`;
}

// Examples:
console.log(convertBytesToSize(16106127360));  // "15.00 GB"
console.log(convertBytesToSize(1572864));      // "1.50 MB"
console.log(convertBytesToSize(1024));         // "1.00 KB"
console.log(convertBytesToSize(500));          // "500.00 B"


function convertToBytes(size: string): number | null {
    // Define unit multipliers for bytes based on binary units (1024 base)
    const units: { [key: string]: number } = {
        B: 1,
        KB: 1024,
        MB: 1024 ** 2,
        GB: 1024 ** 3,
        TB: 1024 ** 4,
        PB: 1024 ** 5,
    };

    // Regex to parse number and unit, e.g. "15GB", "1.5MB"
    const regex = /^(\d+(\.\d+)?)\s*(B|KB|MB|GB|TB|PB)$/i;
    const match = size.trim().toUpperCase().match(regex);

    if (!match) {
        return null; // invalid format
    }

    const value = parseFloat(match[1]);
    const unit = match[3];

    // Calculate bytes by multiplying with the unit multiplier
    return Math.round(value * units[unit]);
}

// Example usage:
console.log(convertToBytes("15GB")); // 16106127360
console.log(convertToBytes("1.5MB")); // 1572864
console.log(convertToBytes("1024B")); // 1024
