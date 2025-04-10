import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Document } from '../models/Document';
import { Account } from '../models/Account';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const documentRepository = AppDataSource.getRepository(Document);
const accountRepository = AppDataSource.getRepository(Account);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export const uploadDocument = [
  upload.single('file'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded');
      }

      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }

      const { accountId, description } = req.body;

      // Verify account exists and belongs to user
      const account = await accountRepository.findOne({
        where: { id: accountId, user: { id: req.user.id } },
      });

      if (!account) {
        // Delete uploaded file if account not found
        fs.unlinkSync(req.file.path);
        throw new AppError(404, 'Account not found');
      }

      const document = documentRepository.create({
        name: req.file.originalname,
        filePath: req.file.path,
        description,
        mimeType: req.file.mimetype,
        size: req.file.size,
        account,
      });

      await documentRepository.save(document);

      res.status(201).json({
        status: 'success',
        data: {
          document,
        },
      });
    } catch (error) {
      next(error);
    }
  },
];

export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.query;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const where: any = { account: { user: { id: req.user.id } } };
    if (accountId) {
      where.account.id = accountId;
    }

    const documents = await documentRepository.find({
      where,
      relations: ['account'],
    });

    res.json({
      status: 'success',
      data: {
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const document = await documentRepository.findOne({
      where: { id, account: { user: { id: req.user.id } } },
      relations: ['account'],
    });

    if (!document) {
      throw new AppError(404, 'Document not found');
    }

    res.download(document.filePath, document.name);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const document = await documentRepository.findOne({
      where: { id, account: { user: { id: req.user.id } } },
    });

    if (!document) {
      throw new AppError(404, 'Document not found');
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await documentRepository.remove(document);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
}; 