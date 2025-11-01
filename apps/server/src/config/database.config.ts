import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

export default prisma;

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('🗄️  Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('🗄️  Database disconnected');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};

// Handle database connection errors and cleanup
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});