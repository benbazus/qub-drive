
import prisma from '@/config/database.config';
import bcrypt from 'bcryptjs';
 

class UserService {
    constructor() { }

    async findById(id: string) {
        return await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                createdAt: true
            }
        });
    }

    public async findByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email }
        });
    }

    async create(data: { email: string; name: string; password: string }) {
        const hashedPassword = await bcrypt.hash(data.password, 12);

        return await prisma.user.create({
            data: {
                ...data,
                passwordHash: hashedPassword,
                firstName: data.name, // Assuming 'name' can be used for firstName
                lastName: '', // Or handle lastName appropriately if available in data
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                createdAt: true
            }
        });
    }
 
 
}

const userService = new UserService();
export default userService;