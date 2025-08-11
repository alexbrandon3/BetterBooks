import { AppDataSource } from "../config/data-source";
import { AccountWeight } from "../entities/AccountWeight";
import { Account } from "../entities/Account";
import { logError } from '../utils/logger';

export interface AccountWeightData {
  keyword: string;
  accountId: number;
  weight: number;
  transactionType?: string;
  isDefault?: boolean;
}

export class AccountWeightService {
  private accountWeightRepo = AppDataSource.getRepository(AccountWeight);
  private accountRepo = AppDataSource.getRepository(Account);

  // Default weights for common business keywords
  private readonly defaultWeights: AccountWeightData[] = [
    // Revenue keywords
    { keyword: "sold", accountId: 0, weight: 90, transactionType: "INCOME" }, // Will be mapped to Sales Revenue
    { keyword: "sale", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "refund", accountId: 0, weight: 10, transactionType: "INCOME" },
    
    // Purchase keywords
    { keyword: "bought", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "buy", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "purchase", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "inventory", accountId: 0, weight: 15, transactionType: "EXPENSE" },
    
    // Equity and Contributions
    { keyword: "initial contribution", accountId: 0, weight: 95, transactionType: "EQUITY" },
    { keyword: "owner contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "capital contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "business formation", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "personal funds", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "equity investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "contribution", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "investment", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "equity", accountId: 0, weight: 95, transactionType: "EQUITY" },
    { keyword: "capital", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "partner", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "draw", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "withdrawal", accountId: 0, weight: 85, transactionType: "EQUITY" },
    
    // Assets & Liabilities
    { keyword: "loan repayment", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "credit card payment", accountId: 0, weight: 85, transactionType: "LIABILITY" },
    { keyword: "equipment purchase", accountId: 0, weight: 85, transactionType: "ASSET" },
    { keyword: "personal use", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "deposit", accountId: 0, weight: 85, transactionType: "ASSET" },
    { keyword: "loan", accountId: 0, weight: 85, transactionType: "LIABILITY" },
    { keyword: "transfer", accountId: 0, weight: 85, transactionType: "TRANSFER" },
    { keyword: "repayment", accountId: 0, weight: 85, transactionType: "LIABILITY" },
    { keyword: "equipment", accountId: 0, weight: 85, transactionType: "ASSET" },
    
    // Operating expense keywords
    { keyword: "rent", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "utilities", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "marketing", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "advertising", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "accounting", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // Employee Payment Keywords
    { keyword: "payroll", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "salary", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "wages", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "employee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "employee pay", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "staff payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "bonus", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "commission", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "overtime", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "holiday pay", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "payroll tax", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "withholding", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "deductions", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    
    // Contractor Payment Keywords
    { keyword: "contractor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "contractor payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "freelancer", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "consultant", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vendor payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "independent contractor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "service payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "contract work", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "project payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "professional services", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "1099 payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // Tax Keywords
    { keyword: "tax", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "taxes", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "irs", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "income tax", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "sales tax", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "property tax", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "business tax", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // Additional Common Business Expenses
    { keyword: "office supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "software", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "subscription", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "membership", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "licenses", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "permits", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "travel", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "meals", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "entertainment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "mileage", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "gas", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fuel", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "repairs", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "cleaning", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "janitorial", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "security", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "bank fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "credit card fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "processing fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "interest expense", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "late fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "penalties", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fines", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🏦 Banking & Financial Services
    { keyword: "bank fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "overdraft fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "monthly service charge", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "atm fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "account maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "wire transfer", accountId: 0, weight: 85, transactionType: "EXPENSE" },
    { keyword: "ach transfer", accountId: 0, weight: 85, transactionType: "EXPENSE" },
    { keyword: "direct deposit", accountId: 0, weight: 85, transactionType: "ASSET" },
    { keyword: "cash withdrawal", accountId: 0, weight: 85, transactionType: "ASSET" },
    { keyword: "bank charges", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 💳 Credit Card & Payment Processing
    { keyword: "credit card fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "merchant fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "processing fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "transaction fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "stripe fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "paypal fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "payment processing", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "merchant services", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 👨‍💼 Contract Labor & Freelance
    { keyword: "contractor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "freelancer", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "independent contractor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "1099", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "gig worker", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "subcontractor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "contract labor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "freelance work", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "gig work", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "consultant payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vendor payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "service provider", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // ⚖️ Legal Services
    { keyword: "legal fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "attorney fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "lawyer fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal retainer", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal consultation", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal advice", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "contract review", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal services", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "law firm", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal counsel", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "retainer invoice", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal bill", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 💻 Software & Technology
    { keyword: "software", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "subscription", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "saas", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "cloud", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "microsoft", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "adobe", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "quickbooks", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "salesforce", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "hubspot", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "mailchimp", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "zoom", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "slack", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "dropbox", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "google workspace", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "office 365", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "aws", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "azure", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "web hosting", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "domain", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "website hosting", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "app subscription", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "software license", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🌐 Internet & Communications
    { keyword: "internet", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "phone", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "mobile", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "cellular", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "broadband", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fiber", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "dsl", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "cable internet", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "landline", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "internet service", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "phone service", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "mobile service", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 👥 Employee Benefits
    { keyword: "employee benefits", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "hsa", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fsa", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "health savings", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "flexible spending", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "insurance premium", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "health insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "dental insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vision insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "401k", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "retirement", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "pension", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "workers' comp", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "disability insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "life insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "benefit plan", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "employee health", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "group insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 📦 Office Supplies & Postage
    { keyword: "office supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "postage", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "printing", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "stationery", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "paper", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "ink", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "toner", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "envelopes", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "stamps", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "shipping supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "packaging", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "business cards", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "letterhead", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "office materials", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "desk supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "filing supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "mailing supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🚗 Vehicle & Transportation
    { keyword: "mileage", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fuel", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "lease payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "car lease", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vehicle lease", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "auto lease", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "petrol", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "exxon", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "shell", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "bp", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "chevron", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "mobil", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "business fuel", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "delivery vehicle", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "company car", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fleet", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vehicle maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "car insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "auto insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vehicle registration", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "parking", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "tolls", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🍽️ Meals & Entertainment
    { keyword: "business meal", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "client dinner", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "catering", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "entertainment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "client entertainment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "business entertainment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "airfare", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "hotel", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "car rental", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "lodging", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "accommodation", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🔧 Maintenance & Repairs
    { keyword: "service call", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "technician", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "janitorial", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "cleaning", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "landscaping", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "security", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "building maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "equipment repair", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "facility maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "preventive maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "emergency repair", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "maintenance service", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "repair service", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🎓 Education & Training
    { keyword: "continuing education", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "certification", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "training", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "professional development", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "skills development", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "workshop", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "seminar", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "course", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "class", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "education", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "learning", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "certification exam", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "license renewal", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "professional license", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "continuing education credits", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "ceu", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🏛️ Government & Regulatory
    { keyword: "government fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "inspection cost", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "regulatory cost", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "compliance cost", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "business permit", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "occupational license", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "professional license", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "state fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "federal fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "local fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "municipal fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "county fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 💰 Income Categories
    { keyword: "product sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "merchandise sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "inventory sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "retail sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "wholesale sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "product revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "merchandise revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "inventory revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "retail revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "wholesale revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "goods sold", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "product income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "merchandise income", accountId: 0, weight: 90, transactionType: "INCOME" },
    
    { keyword: "service revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "service income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "consulting revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "professional services", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "service fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "consulting fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "project income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "service sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "consulting income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "professional income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "service billing", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "consulting billing", accountId: 0, weight: 90, transactionType: "INCOME" },
    
    { keyword: "rental income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "rental revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "rental fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "lease income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "lease revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "rental property", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "property rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "equipment rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "space rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "office rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "warehouse rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "storage rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    
    { keyword: "commission income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "commission revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "affiliate revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "affiliate income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "commission fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "affiliate fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "referral income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "referral revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "commission sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "affiliate sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "referral fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "commission payment", accountId: 0, weight: 90, transactionType: "INCOME" },
    
    // 🏦 Assets
    { keyword: "equipment purchase", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "equipment lease", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "equipment financing", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "machinery purchase", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "vehicle purchase", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "computer purchase", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "furniture purchase", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "production equipment", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "manufacturing equipment", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business equipment", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "capital equipment", accountId: 0, weight: 90, transactionType: "ASSET" },
    
    { keyword: "business checking", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business savings", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "merchant account", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business bank", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "commercial account", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business account", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "operating account", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business deposit", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business cash", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "cash on hand", accountId: 0, weight: 90, transactionType: "ASSET" },
    
    { keyword: "prepaid expenses", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "prepaid insurance", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "prepaid rent", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "prepaid utilities", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "security deposit", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "rental deposit", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "lease deposit", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "utility deposit", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "prepaid service", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "advance payment", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "prepayment", accountId: 0, weight: 90, transactionType: "ASSET" },
    
    { keyword: "stock", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "merchandise", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "raw materials", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "finished goods", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "work in progress", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "inventory items", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "product inventory", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "goods inventory", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "stock inventory", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "inventory goods", accountId: 0, weight: 90, transactionType: "ASSET" },
    
    // 💳 Liabilities
    { keyword: "visa", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "mastercard", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "amex", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "american express", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "discover", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "business credit card", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "corporate card", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "company card", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "credit line", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "credit limit", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    
    { keyword: "business loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "sba loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "term loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "installment loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "business financing", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "commercial loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "working capital loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "expansion loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    
    { keyword: "payroll taxes payable", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "sales tax payable", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "income tax payable", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "withholding payable", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "tax liability", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "taxes payable", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "payroll liability", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "tax deposit", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "estimated tax", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "quarterly tax", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    
    { keyword: "deferred revenue", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "unearned revenue", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "advance payment", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "prepaid revenue", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "customer deposit", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "retainer", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "advance billing", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "prepaid service", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "unearned income", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    
    // 👥 Equity
    { keyword: "owner contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "capital contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner equity", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner withdrawal", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner withdrawal", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member withdrawal", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "distribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner distribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    
    { keyword: "partner equity", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member equity", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "stockholder equity", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "shareholder equity", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "stockholder investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "shareholder investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner capital", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member capital", accountId: 0, weight: 90, transactionType: "EQUITY" },
    
    { keyword: "retained earnings", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "accumulated earnings", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "earned surplus", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "undistributed profits", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "retained profit", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "accumulated profit", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "earned income", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "retained income", accountId: 0, weight: 90, transactionType: "EQUITY" }
  ];

  async getUserWeights(userId: number): Promise<AccountWeight[]> {
    try {
      const weights = await this.accountWeightRepo.find({
        where: { userId },
        order: { keyword: 'ASC', weight: 'DESC' }
      });

      // Get account names for each weight
      const weightsWithAccounts = await Promise.all(
        weights.map(async (weight) => {
          const account = await this.accountRepo.findOne({
            where: { id: weight.accountId }
          });
          
          return {
            ...weight,
            accountName: account?.name || 'Unknown Account'
          };
        })
      );

      return weightsWithAccounts;
    } catch (error) {
      logError(`Failed to get user weights: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
      throw error;
    }
  }

  async createOrUpdateWeight(userId: number, data: AccountWeightData): Promise<AccountWeight> {
    try {
      // Check if weight already exists
      const whereClause: any = {
        userId,
        keyword: data.keyword,
        accountId: data.accountId
      };
      
      if (data.transactionType) {
        whereClause.transactionType = data.transactionType;
      }

      const existingWeight = await this.accountWeightRepo.findOne({
        where: whereClause
      });

      if (existingWeight) {
        // Update existing weight
        existingWeight.weight = data.weight;
        existingWeight.isDefault = data.isDefault || false;
        existingWeight.lastUsed = new Date();
        return await this.accountWeightRepo.save(existingWeight);
      } else {
        // Create new weight
        const weight = this.accountWeightRepo.create({
          userId,
          keyword: data.keyword,
          accountId: data.accountId,
          weight: data.weight,
          transactionType: data.transactionType,
          isDefault: data.isDefault || false,
          lastUsed: new Date()
        });
        return await this.accountWeightRepo.save(weight);
      }
    } catch (error) {
      logError(`Failed to create/update weight: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
      throw error;
    }
  }

  async deleteWeight(id: number, userId: number): Promise<void> {
    try {
      const weight = await this.accountWeightRepo.findOne({
        where: { id, userId }
      });

      if (!weight) {
        throw new Error('Weight not found');
      }

      await this.accountWeightRepo.remove(weight);
    } catch (error) {
      logError(`Failed to delete weight: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
      throw error;
    }
  }

  async getWeightsForKeyword(userId: number, keyword: string, transactionType?: string): Promise<AccountWeight[]> {
    try {
      const whereClause: any = {
        userId,
        keyword: keyword.toLowerCase()
      };

      if (transactionType) {
        whereClause.transactionType = transactionType;
      }

      return await this.accountWeightRepo.find({
        where: whereClause,
        order: { weight: 'DESC' }
      });
    } catch (error) {
      logError(`Failed to get weights for keyword: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
      throw error;
    }
  }

  async initializeDefaultWeights(userId: number): Promise<void> {
    try {
      // Get user's accounts to map default weights
      const userAccounts = await this.accountRepo.find({
        where: { user: { id: userId } }
      });

      // Map default weights to user's actual accounts
      for (const defaultWeight of this.defaultWeights) {
        // Find matching account by name pattern
        const matchingAccount = this.findMatchingAccount(userAccounts, defaultWeight);
        
        if (matchingAccount) {
          // Check if default weight already exists
          const existingWeight = await this.accountWeightRepo.findOne({
            where: {
              userId,
              keyword: defaultWeight.keyword,
              accountId: matchingAccount.id,
              isDefault: true
            }
          });

          if (!existingWeight) {
            // Create default weight
            await this.accountWeightRepo.save({
              userId,
              keyword: defaultWeight.keyword,
              accountId: matchingAccount.id,
              weight: defaultWeight.weight,
              transactionType: defaultWeight.transactionType,
              isDefault: true,
              lastUsed: new Date()
            });
          }
        }
      }
    } catch (error) {
      logError(`Failed to initialize default weights: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
      throw error;
    }
  }

  private findMatchingAccount(accounts: Account[], defaultWeight: AccountWeightData): Account | null {
    const keyword = defaultWeight.keyword.toLowerCase();

    // First, try to find exact name matches
    for (const account of accounts) {
      const accountName = account.name.toLowerCase();
      
      // For revenue keywords, look for sales/revenue accounts
      if (keyword === "sold" || keyword === "sale" || keyword === "sales" || keyword === "revenue" || keyword === "income") {
        if (accountName.includes("sales") || accountName.includes("revenue") || accountName.includes("income")) {
          return account;
        }
      }
      
      // For refund keyword, look for refund accounts
      if (keyword === "refund") {
        if (accountName.includes("refund")) {
          return account;
        }
      }
      
      // For purchase keywords, look for purchase/expense accounts
      if (keyword === "bought" || keyword === "buy" || keyword === "purchase") {
        // Prioritize accounts with "purchase" in the name
        if (accountName.includes("purchase")) {
          return account;
        }
        // Then look for general expense accounts, but avoid specific ones like "rent expense"
        if (accountName.includes("expense") && !accountName.includes("rent") && !accountName.includes("utilities") && !accountName.includes("marketing") && !accountName.includes("payroll")) {
          return account;
        }
        // Finally, look for cost-related accounts
        if (accountName.includes("cost")) {
          return account;
        }
      }
      
      // For inventory keyword, look for inventory accounts
      if (keyword === "inventory") {
        if (accountName.includes("inventory")) {
          return account;
        }
      }
      
      // Employee Payment Keywords
      if (keyword === "payroll" || keyword === "salary" || keyword === "wages" || keyword === "employee" || 
          keyword === "employee pay" || keyword === "staff payment" || keyword === "bonus" || 
          keyword === "commission" || keyword === "overtime" || keyword === "holiday pay") {
        if (accountName.includes("payroll") || accountName.includes("salary") || accountName.includes("wages") || 
            accountName.includes("employee") || accountName.includes("staff")) {
          return account;
        }
      }
      
      // Contractor Payment Keywords
      if (keyword === "contractor" || keyword === "contractor payment" || keyword === "freelancer" || 
          keyword === "consultant" || keyword === "vendor payment" || keyword === "independent contractor" ||
          keyword === "service payment" || keyword === "contract work" || keyword === "project payment" ||
          keyword === "professional services" || keyword === "1099 payment") {
        if (accountName.includes("contractor") || accountName.includes("freelancer") || accountName.includes("consultant") ||
            accountName.includes("vendor") || accountName.includes("service") || accountName.includes("professional")) {
          return account;
        }
      }
      
      // Tax Keywords
      if (keyword === "tax" || keyword === "taxes" || keyword === "irs" || keyword === "income tax" ||
          keyword === "sales tax" || keyword === "property tax" || keyword === "business tax" ||
          keyword === "payroll tax" || keyword === "withholding" || keyword === "deductions") {
        if (accountName.includes("tax") || accountName.includes("irs") || accountName.includes("withholding")) {
          return account;
        }
      }
      
      // Specific expense keywords
      if (keyword === "rent" && accountName.includes("rent")) return account;
      if (keyword === "utilities" && accountName.includes("utilities")) return account;
      if (keyword === "marketing" && accountName.includes("marketing")) return account;
      if (keyword === "advertising" && accountName.includes("advertising")) return account;
      if (keyword === "insurance" && accountName.includes("insurance")) return account;
      if (keyword === "legal" && accountName.includes("legal")) return account;
      if (keyword === "accounting" && accountName.includes("accounting")) return account;
      
      // Office and Business Supplies
      if (keyword === "office supplies" || keyword === "supplies") {
        if (accountName.includes("supplies") || accountName.includes("office")) {
          return account;
        }
      }
      
      // Software and Subscriptions
      if (keyword === "software" || keyword === "subscription" || keyword === "membership") {
        if (accountName.includes("software") || accountName.includes("subscription") || accountName.includes("membership")) {
          return account;
        }
      }
      
      // Licenses and Permits
      if (keyword === "licenses" || keyword === "permits") {
        if (accountName.includes("license") || accountName.includes("permit")) {
          return account;
        }
      }
      
      // Travel and Transportation
      if (keyword === "travel" || keyword === "meals" || keyword === "entertainment" || 
          keyword === "mileage" || keyword === "gas" || keyword === "fuel") {
        if (accountName.includes("travel") || accountName.includes("meals") || accountName.includes("entertainment") ||
            accountName.includes("mileage") || accountName.includes("gas") || accountName.includes("fuel")) {
          return account;
        }
      }
      
      // Maintenance and Repairs
      if (keyword === "maintenance" || keyword === "repairs") {
        if (accountName.includes("maintenance") || accountName.includes("repair")) {
          return account;
        }
      }
      
      // Cleaning and Security
      if (keyword === "cleaning" || keyword === "janitorial" || keyword === "security") {
        if (accountName.includes("cleaning") || accountName.includes("janitorial") || accountName.includes("security")) {
          return account;
        }
      }
      
      // Fees and Charges
      if (keyword === "bank fees" || keyword === "credit card fees" || keyword === "processing fees" ||
          keyword === "interest expense" || keyword === "late fees" || keyword === "penalties" || keyword === "fines") {
        if (accountName.includes("fee") || accountName.includes("charge") || accountName.includes("interest") ||
            accountName.includes("penalty") || accountName.includes("fine")) {
          return account;
        }
      }
      
      // For equity keywords, look for equity accounts
      if (keyword === "contribution" || keyword === "investment" || keyword === "equity" || keyword === "capital" || 
          keyword === "owner" || keyword === "partner" || keyword === "draw" || keyword === "withdrawal" ||
          keyword.includes("contribution") || keyword.includes("investment") || keyword.includes("draw")) {
        if (accountName.includes("equity") || accountName.includes("capital") || accountName.includes("owner") || 
            accountName.includes("partner") || accountName.includes("draw") || accountName.includes("contribution")) {
          return account;
        }
      }

      // For asset keywords, look for asset accounts (but exclude equity-related keywords)
      if ((keyword === "equipment" || keyword === "deposit" || keyword === "equipment purchase") && 
          !keyword.includes("contribution") && !keyword.includes("investment") && !keyword.includes("equity") && 
          !keyword.includes("capital") && !keyword.includes("owner") && !keyword.includes("partner")) {
        if (accountName.includes("equipment") || accountName.includes("asset") || accountName.includes("deposit")) {
          return account;
        }
      }

      // For liability keywords, look for liability accounts
      if (keyword === "loan" || keyword === "repayment" || keyword.includes("loan") || keyword.includes("credit")) {
        if (accountName.includes("loan") || accountName.includes("liability") || accountName.includes("credit") || 
            accountName.includes("payable")) {
          return account;
        }
      }
    }

    return null;
  }

  async incrementUsageCount(weightId: number): Promise<void> {
    try {
      await this.accountWeightRepo.increment({ id: weightId }, 'usageCount', 1);
      await this.accountWeightRepo.update(weightId, { lastUsed: new Date() });
    } catch (error) {
      logError(`Failed to increment usage count: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AccountWeightService');
    }
  }
} 