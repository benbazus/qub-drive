import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  rememberMe: Joi.boolean().optional()
});

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match password',
      'any.required': 'Password confirmation is required'
    }),
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters and spaces',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters and spaces',
      'any.required': 'Last name is required'
    }),
  acceptTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the terms and conditions',
      'any.required': 'Terms acceptance is required'
    })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'New password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match new password',
      'any.required': 'Password confirmation is required'
    })
});

export const accessSharedFileSchema = Joi.object({
  password: Joi.string().optional(),
})

export const shareLinkSchema = Joi.object({
  fileId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid file ID",
    "any.required": "File ID is required",
  }),
  permission: Joi.string().valid("VIEW", "EDIT").required().messages({
    "any.only": "Permission must be either VIEW or EDIT",
    "any.required": "Permission is required",
  }),
  shareType: Joi.string().valid("LINK", "FILE", "DOCUMENT").required().messages({
    "any.only": "Share type must be either LINKE or FILE or DOCUMENT",
    "any.required": "Share type is required",
  }),
  expiresAt: Joi.string().isoDate().allow(null).optional().messages({
    "string.isoDate": "Expires at must be a valid ISO date",
  }),
  downloadAllowed: Joi.boolean().required().messages({
    "any.required": "Download allowed is required",
  }),
  requirePassword: Joi.boolean().required().messages({
    "any.required": "Require password is required",
  }),
  password: Joi.string()
    .when("requirePassword", {
      is: true,
      then: Joi.string().min(1).required().messages({
        "string.min": "Password is required when password protection is enabled",
        "string.empty": "Password is required when password protection is enabled",
      }),
      otherwise: Joi.string().allow("").optional(),
    }),
  maxDownloads: Joi.number().integer().min(1).allow(null).optional().messages({
    "number.base": "Max downloads must be a number",
    "number.min": "Max downloads must be at least 1",
  }),
});

export const moveFileSchema = Joi.object({
  fileId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid file ID",
    "any.required": "File ID is required",
  }),
  destinationId: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      "string.uuid": "Invalid target parent ID",
    }),
});

export const renameFileSchema = Joi.object({
  fileId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid file ID",
    "any.required": "File ID is required",
  }),
  newName: Joi.string()
    .min(1)
    .required()
    .pattern(/^[^\/\\]*$/, { name: "no slashes" })
    .messages({
      "string.min": "New name is required",
      "string.empty": "New name is required",
      "string.pattern.name": "File name cannot contain slashes",
    }),
});

// File operation validation schemas
export const createFolderSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .pattern(/^[^<>:"/\\|?*]+$/)
    .required()
    .messages({
      'string.min': 'Folder name cannot be empty',
      'string.max': 'Folder name cannot exceed 255 characters',
      'string.pattern.base': 'Folder name contains invalid characters',
      'any.required': 'Folder name is required'
    }),
  parentId: Joi.string()
    .uuid() // Validate as UUID if parentId is provided
    .allow(null) // Explicitly allow null
    .optional() // Allow the field to be absent
    .messages({
      'string.uuid': 'Parent ID must be a valid UUID',
    }),
});

export const deleteFileSchema = Joi.object({
  deletePermanently: Joi.boolean().optional().default(false)
});

export const copyFileSchema = Joi.object({
  fileId: Joi.string().required().messages({
    'any.required': 'File ID is required'
  }),
  newName: Joi.string()
    .min(1)
    .max(255)
    .pattern(/^[^<>:"/\\|?*]+$/)
    .required()
    .messages({
      'string.min': 'File name cannot be empty',
      'string.max': 'File name cannot exceed 255 characters',
      'string.pattern.base': 'File name contains invalid characters',
      'any.required': 'New file name is required'
    })
});

export const getFilesQuerySchema = Joi.object({
  page: Joi.string().optional().default('1'),
  limit: Joi.string().optional().default('20'),
  parentId: Joi.string().optional(),
  isDeleted: Joi.string().valid('true', 'false').optional().default('false')
});

export const getFoldersQuerySchema = Joi.object({
  page: Joi.string().optional().default('1'),
  limit: Joi.string().optional().default('20'),
  parentId: Joi.string().optional(),
  search: Joi.string().optional()
});

export const shareFileSchema = Joi.object({
  shareType: Joi.string().valid("LINK", "FILE", "DOCUMENT").required().messages({
    "any.only": "Share type must be either LINKE or FILE or DOCUMENT",
    "any.required": "Share type is required",
  }),
  // permission: Joi.string().valid('VIEW', 'EDIT', 'DOWNLOAD', 'COMMENT', 'ADMIN').required().messages({
  //   'any.only': 'Permission must be one of VIEW, EDIT, DOWNLOAD, COMMENT',
  //   'any.required': 'Permission is required'
  // }),
  expiresAt: Joi.date().iso().optional(),
  allowDownload: Joi.boolean().optional().default(true),
  requireApproval: Joi.boolean().optional().default(false),
  notifyByEmail: Joi.boolean().optional().default(false),
  watermark: Joi.boolean().optional().default(false),
  password: Joi.string().min(6).optional().messages({
    'string.min': 'Password must be at least 6 characters long'
  }),
  message: Joi.string().allow('').optional().max(500).messages({
    'string.max': 'Message cannot exceed 500 characters'
  }),
  users: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      permission: Joi.string().valid('VIEW', 'EDIT', 'DOWNLOAD', 'COMMENT').required(),
      name: Joi.string().optional(),
      email: Joi.string().email().optional()
    })
  )
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters and spaces'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters and spaces'
    }),
  metadata: Joi.object().optional()
});

export const passwordResetRequestSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

export const passwordResetSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match password',
      'any.required': 'Password confirmation is required'
    })
});

// Upload validation schemas
export const uploadProgressSchema = Joi.object({
  uploadId: Joi.string()
    .required()
    .messages({
      'any.required': 'Upload ID is required'
    })
});

export const cancelUploadSchema = Joi.object({
  uploadId: Joi.string()
    .required()
    .messages({
      'any.required': 'Upload ID is required'
    })
});

export const batchUploadSchema = Joi.object({
  files: Joi.array()
    .items(Joi.object({
      fileName: Joi.string()
        .min(1)
        .max(255)
        .pattern(/^[^<>:"/\\|?*]+$/)
        .required()
        .messages({
          'string.min': 'File name cannot be empty',
          'string.max': 'File name cannot exceed 255 characters',
          'string.pattern.base': 'File name contains invalid characters',
          'any.required': 'File name is required'
        }),
      parentId: Joi.string()
        .uuid()
        .allow(null)
        .optional()
        .messages({
          'string.uuid': 'Parent ID must be a valid UUID'
        })
    }))
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'At least one file is required',
      'array.max': 'Cannot upload more than 10 files at once',
      'any.required': 'Files array is required'
    })
});

export const resumeUploadSchema = Joi.object({
  uploadId: Joi.string()
    .required()
    .messages({
      'any.required': 'Upload ID is required'
    }),
  chunkNumber: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Chunk number must be a number',
      'number.integer': 'Chunk number must be an integer',
      'number.min': 'Chunk number cannot be negative',
      'any.required': 'Chunk number is required'
    }),
  totalChunks: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Total chunks must be a number',
      'number.integer': 'Total chunks must be an integer',
      'number.min': 'Total chunks must be at least 1',
      'any.required': 'Total chunks is required'
    })
});

// System settings validation schemas
export const systemSettingsUpdateSchema = Joi.object({
  // Storage settings
  defaultStoragePath: Joi.string().optional(),
  defaultMaxStorage: Joi.number().integer().min(0).optional(),
  allowedFileTypes: Joi.array().items(Joi.string()).optional(),
  maxFileSize: Joi.number().integer().min(0).optional(),

  // Email settings
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().integer().min(1).max(65535).optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().email().optional(),
  SMTP_SECURE: Joi.boolean().optional(),

  // Security settings
  jwtSecret: Joi.string().min(32).optional(),
  sessionTimeout: Joi.number().integer().min(300).optional(), // Min 5 minutes
  maxLoginAttempts: Joi.number().integer().min(1).optional(),
  lockoutDuration: Joi.number().integer().min(60).optional(), // Min 1 minute

  // Sharing settings
  allowPublicSharing: Joi.boolean().optional(),
  defaultShareExpiry: Joi.number().integer().min(0).optional(),
  requireApprovalForSharing: Joi.boolean().optional(),

  // Compliance settings
  dataRetentionDays: Joi.number().integer().min(1).optional(),
  auditLogRetentionDays: Joi.number().integer().min(30).optional(),
  enableDataEncryption: Joi.boolean().optional(),

  // System settings
  systemName: Joi.string().max(100).optional(),
  systemVersion: Joi.string().optional(),
  maintenanceMode: Joi.boolean().optional(),
  debugMode: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one setting must be provided'
});

export const systemSettingsCategorySchema = Joi.object({
  category: Joi.string()
    .valid('storage', 'email', 'security', 'sharing', 'compliance')
    .required()
    .messages({
      'any.only': 'Category must be one of: storage, email, security, sharing, compliance',
      'any.required': 'Category is required'
    })
});

export const emailSettingsTestSchema = Joi.object({
  SMTP_HOST: Joi.string().required().messages({
    'any.required': 'SMTP host is required'
  }),
  SMTP_PORT: Joi.number().integer().min(1).max(65535).required().messages({
    'number.base': 'SMTP port must be a number',
    'number.integer': 'SMTP port must be an integer',
    'number.min': 'SMTP port must be at least 1',
    'number.max': 'SMTP port must be at most 65535',
    'any.required': 'SMTP port is required'
  }),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().email().required().messages({
    'string.email': 'From email must be a valid email address',
    'any.required': 'From email is required'
  }),
  SMTP_SECURE: Joi.boolean().optional().default(false),
  testEmail: Joi.string().email().optional().messages({
    'string.email': 'Test email must be a valid email address'
  })
});



// Create Spreadsheet Schema
export const createSpreadsheetSchema = Joi.object({
  token: Joi.string().required(),
  title: Joi.string().optional(),
  cells: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
});

// Update Spreadsheet Schema
export const updateSpreadsheetSchema = Joi.object({
  title: Joi.string().optional(),
  cells: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
});

// Grant Access Schema
export const grantAccessSchema = Joi.object({
  userId: Joi.string().required(),
  permission: Joi.string().valid('VIEW', 'EDIT', 'ADMIN').required(),
});
