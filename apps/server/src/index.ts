
import express, { type Request, type Response, type NextFunction } from "express"
import { createServer } from "http"
import swaggerUi from "swagger-ui-express"
import { swaggerSpec } from "./config/swagger.config"
import authRoutes from "./routes/auth.routes"
import filesRoutes from "./routes/files.routes"
import registrationRoutes from "./routes/registration.routes"
import storageRoutes from "./routes/storage.routes"
import userRoutes from "./routes/user.routes"
import collaborationRoutes from "./routes/collaboration.routes"
import documentRoutes from "./routes/document.routes"
import commentRoutes from "./routes/comment.routes"
import uploadRoutes from "./routes/uploadRoutes"
import fileUploaderRoutes from "./routes/fileUploader.routes"
import planRoutes from "./routes/plan.routes"
import contactRoutes from "./routes/contact.routes"
import demoRoutes from "./routes/demo.routes"
import approvalRoutes from "./routes/approval.routes"
import spreadsheetRoutes from "./routes/spreadsheet.routes"
import CollaborationService from "./services/collaboration.service"
import { SystemSettingsService } from "./services/system-settings.service"
import path from "path";
import settingsRoutes from "./routes/settings.routes"
import userSettingsRoutes from "./routes/user-settings.routes"
import { Client } from "pg"
import { exec } from "child_process"
import { promisify } from "util"
import { connectDatabase } from "./config/database.config"
import { TransferService } from "./services/transfer.service"
import cron from 'node-cron';
import transferRoutes from "./routes/transfer.routes"
import dashboardRoutes from "./routes/dashboard.routes"
import shareRoutes from "./routes/share.routes"

const app = express()
const isDevelopment = process.env.NODE_ENV !== "production";
const server = createServer(app)
const PORT = process.env.PORT || 5001
const execAsync = promisify(exec)



async function checkEmailConfiguration(): Promise<{
  configured: boolean;
  smtp_host?: string;
  smtp_port?: string;
  smtp_user?: string;
  from_email?: string;
  missing_vars?: string[];
  suggestion?: string;
  test_connection?: boolean;
  error?: string;
}> {
  try {
    const requiredEmailVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_FROM'
    ]

    const missingVars = requiredEmailVars.filter(varName => !process.env[varName])
    const configured = missingVars.length === 0

    let testConnection = false
    let connectionError = ''

    if (configured) {
      try {
        const nodemailer = require('nodemailer')
        const transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        await transporter.verify()
        testConnection = true
        transporter.close()
      } catch (error) {
        connectionError = error instanceof Error ? error.message : 'Connection test failed'
      }
    }

    return {
      configured,
      smtp_host: process.env.SMTP_HOST,
      smtp_port: process.env.SMTP_PORT,
      smtp_user: process.env.SMTP_USER,
      from_email: process.env.SMTP_FROM,
      missing_vars: missingVars,
      test_connection: testConnection,
      suggestion: !configured
        ? `Configure these environment variables: ${missingVars.join(', ')}`
        : !testConnection
          ? 'Email configuration found but connection test failed. Check credentials and SMTP settings.'
          : undefined,
      error: connectionError || undefined
    }
  } catch (error) {
    return {
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error checking email configuration',
      suggestion: 'Set up email environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM'
    }
  }
}

// Initialize collaboration service with Socket.IO
const collaborationService = new CollaborationService(server)

// Initialize system settings service
const systemSettingsService = new SystemSettingsService()

// Function to get storage path from system settings or fallback to environment variable
async function getStoragePath(): Promise<string> {
  try {
    const settings = await systemSettingsService.getSettings()
    const defaultStoragePath = settings.defaultStoragePath

    if (defaultStoragePath && defaultStoragePath.trim() !== '') {
      return defaultStoragePath
    }
  } catch (error) {
    console.warn('Error getting system settings:', error)
  }

  // Fallback to environment variable or default
  return process.env.DEFAULT_STORAGE_PATH || '../storage'
}

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const manualCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  //const allowedOrigins = ['http://localhost:5173', 'https://qubdrive.com'];
  const allowedOrigins = ['http://localhost:5173'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '600');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
};

app.use(manualCorsMiddleware);

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Qub Drive API Documentation version 0.0.3'
}))

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Qub Drive version 0.0.3 is up and running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    documentation: `http://localhost:${PORT}/api-docs`
  })
})

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})



app.post("/api/echo", (req: Request, res: Response) => {
  res.json({
    message: "Echo endpoint",
    data: req.body,
    method: req.method,
    timestamp: new Date().toISOString(),
  })
})

// API Routes (must come before error handling middleware)
// app.use('/api/download', downloadRoutes);
// app.use('/api/share', shareRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/file-uploader', fileUploaderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api', planRoutes);
app.use('/api', contactRoutes);
app.use('/api', demoRoutes);
app.use('/api/spreadsheet', spreadsheetRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shares', shareRoutes);

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  })
})


// Error handling middleware (must come after routes)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.message)
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  })
})

// Async server initialization
async function initializeServer() {
  try {

    // Connect to database
    await connectDatabase()

    const storagePath = await getStoragePath()
    app.use(storagePath, express.static(path.join(__dirname, storagePath)));
    console.log(`📁 Static uploads path: ${storagePath}`)

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`)
      console.log(`🔗 Local: http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to initialize server:', error)
    process.exit(1)
  }
}

// Cleanup job - runs daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running cleanup job...');
  const transferService = new TransferService();
  try {
    await transferService.deleteExpiredTransfers();
    console.log('Cleanup job completed successfully');
  } catch (error) {
    console.error('Cleanup job failed:', error);
  }
});

// Initialize server
initializeServer()

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  server.close(() => {
    console.log("Process terminated")
  })
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  server.close(() => {
    console.log("Process terminated")
  })
})

export default app
