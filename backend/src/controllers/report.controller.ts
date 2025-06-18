import { Response } from 'express';
import { getUser } from '../utils/getUser';
import { AuthenticatedRequest } from '../types/express';
import { ReportService } from '../services/report.service';

const reportService = new ReportService();

export const getBalanceSheet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const result = await reportService.getBalanceSheet(user.id);
    res.json(result);
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({ message: 'Failed to generate balance sheet' });
  }
};

export const getIncomeStatement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { startDate, endDate } = req.query;
    const result = await reportService.generateIncomeStatement(user.id, startDate as string, endDate as string);
    res.json(result);
  } catch (error) {
    console.error('Error generating income statement:', error);
    res.status(500).json({ message: 'Failed to generate income statement' });
  }
};

export const getCashFlow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const result = await reportService.getCashFlow(user.id, start, end);
    res.json(result);
  } catch (error) {
    console.error('Error generating cash flow statement:', error);
    res.status(500).json({ message: 'Failed to generate cash flow statement' });
  }
};
