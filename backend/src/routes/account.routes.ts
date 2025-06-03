import express, { Request, Response } from 'express';
import { suggestAccountMetadata } from '../controllers/account.controller';

const router = express.Router();

router.post('/accounts/suggest-metadata', async (req: Request, res: Response) => {
  try {
    await suggestAccountMetadata(req, res);
  } catch (err) {
    console.error("Error in suggestAccountMetadata:", err);
    res.status(500).send("Internal Server Error");
  }
});

export default router; 