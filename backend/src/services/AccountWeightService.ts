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
    { keyword: "initial_contribution", accountId: 0, weight: 95, transactionType: "EQUITY" },
    { keyword: "owner_contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "capital_contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "business_formation", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "personal_funds", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "equity_investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner_investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner_draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner_draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "contribution", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "investment", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "equity", accountId: 0, weight: 95, transactionType: "EQUITY" },
    { keyword: "capital", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "partner", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "draw", accountId: 0, weight: 85, transactionType: "EQUITY" },
    { keyword: "withdrawal", accountId: 0, weight: 85, transactionType: "EQUITY" },
    
    // Assets & Liabilities
    { keyword: "loan_repayment", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "credit_card_payment", accountId: 0, weight: 85, transactionType: "LIABILITY" },
    { keyword: "equipment_purchase", accountId: 0, weight: 85, transactionType: "ASSET" },
    { keyword: "personal_use", accountId: 0, weight: 90, transactionType: "EQUITY" },
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
    { keyword: "employee_pay", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "staff_payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "bonus", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "commission", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "overtime", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "holiday_pay", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "payroll_tax", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "withholding", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "deductions", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    
    // Contractor Payment Keywords
    { keyword: "contractor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "contractor_payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "freelancer", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "consultant", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vendor_payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "independent_contractor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "service_payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "contract_work", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "project_payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "professional_services", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "1099_payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // Tax Keywords
    { keyword: "tax", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "taxes", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "irs", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "income_tax", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "sales_tax", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "property_tax", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "business_tax", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // Additional Common Business Expenses
    { keyword: "office_supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
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
    { keyword: "bank_fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "credit_card_fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "processing_fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "interest_expense", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "late_fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "penalties", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fines", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🏦 Banking & Financial Services
    { keyword: "bank_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "overdraft_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "monthly_service_charge", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "atm_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "account_maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "wire_transfer", accountId: 0, weight: 85, transactionType: "EXPENSE" },
    { keyword: "ach_transfer", accountId: 0, weight: 85, transactionType: "EXPENSE" },
    { keyword: "direct_deposit", accountId: 0, weight: 85, transactionType: "ASSET" },
    { keyword: "cash_withdrawal", accountId: 0, weight: 85, transactionType: "ASSET" },
    { keyword: "bank_charges", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 💳 Credit Card & Payment Processing
    { keyword: "credit_card_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "merchant_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "processing_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "transaction_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "stripe_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "paypal_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "payment_processing", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "merchant_services", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 👨‍💼 Contract Labor & Freelance
    { keyword: "contractor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "freelancer", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "independent_contractor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "1099", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "gig_worker", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "subcontractor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "contract_labor", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "freelance_work", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "gig_work", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "consultant_payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vendor_payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "service_provider", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // ⚖️ Legal Services
    { keyword: "legal_fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "attorney_fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "lawyer_fees", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal_retainer", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal_consultation", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal_advice", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "contract_review", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal_services", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "law_firm", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal_counsel", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "retainer_invoice", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "legal_bill", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
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
    { keyword: "google_workspace", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "office_365", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "aws", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "azure", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "web_hosting", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "domain", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "website_hosting", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "app_subscription", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "software_license", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🌐 Internet & Communications
    { keyword: "internet", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "phone", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "mobile", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "cellular", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "broadband", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fiber", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "dsl", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "cable_internet", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "landline", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "internet_service", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "phone_service", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "mobile_service", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 👥 Employee Benefits
    { keyword: "employee_benefits", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "hsa", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fsa", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "health_savings", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "flexible_spending", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "insurance_premium", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "health_insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "dental_insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vision_insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "401k", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "retirement", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "pension", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "workers_comp", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "disability_insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "life_insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "benefit_plan", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "employee_health", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "group_insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 📦 Office Supplies & Postage
    { keyword: "office_supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "postage", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "printing", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "stationery", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "paper", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "ink", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "toner", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "envelopes", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "stamps", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "shipping_supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "packaging", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "business_cards", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "letterhead", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "office_materials", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "desk_supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "filing_supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "mailing_supplies", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🚗 Vehicle & Transportation
    { keyword: "mileage", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fuel", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "lease_payment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "car_lease", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vehicle_lease", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "auto_lease", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "petrol", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "exxon", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "shell", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "bp", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "chevron", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "mobil", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "business_fuel", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "delivery_vehicle", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "company_car", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "fleet", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vehicle_maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "car_insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "auto_insurance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "vehicle_registration", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "parking", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "tolls", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🍽️ Meals & Entertainment
    { keyword: "business_meal", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "client_dinner", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "catering", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "entertainment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "client_entertainment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "business_entertainment", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "airfare", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "hotel", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "car_rental", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "lodging", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "accommodation", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🔧 Maintenance & Repairs
    { keyword: "service_call", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "technician", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "janitorial", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "cleaning", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "landscaping", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "security", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "building_maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "equipment_repair", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "facility_maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "preventive_maintenance", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "emergency_repair", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "maintenance_service", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "repair_service", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🎓 Education & Training
    { keyword: "continuing_education", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "certification", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "training", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "professional_development", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "skills_development", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "workshop", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "seminar", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "course", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "class", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "education", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "learning", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "certification_exam", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "license_renewal", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "professional_license", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "continuing_education_credits", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "ceu", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 🏛️ Government & Regulatory
    { keyword: "government_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "inspection_cost", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "regulatory_cost", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "compliance_cost", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "business_permit", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "occupational_license", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "professional_license", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "state_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "federal_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "local_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "municipal_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    { keyword: "county_fee", accountId: 0, weight: 90, transactionType: "EXPENSE" },
    
    // 💰 Income Categories
    { keyword: "product_sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "merchandise_sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "inventory_sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "retail_sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "wholesale_sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "product_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "merchandise_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "inventory_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "retail_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "wholesale_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "goods_sold", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "product_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "merchandise_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    
    { keyword: "service_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "service_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "consulting_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "professional_services", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "service_fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "consulting_fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "project_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "service_sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "consulting_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "professional_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "service_billing", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "consulting_billing", accountId: 0, weight: 90, transactionType: "INCOME" },
    
    { keyword: "rental_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "rental_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "rental_fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "lease_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "lease_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "rental_property", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "property_rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "equipment_rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "space_rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "office_rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "warehouse_rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "storage_rental", accountId: 0, weight: 90, transactionType: "INCOME" },
    
    { keyword: "commission_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "commission_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "affiliate_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "affiliate_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "commission_fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "affiliate_fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "referral_income", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "referral_revenue", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "commission_sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "affiliate_sales", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "referral_fee", accountId: 0, weight: 90, transactionType: "INCOME" },
    { keyword: "commission_payment", accountId: 0, weight: 90, transactionType: "INCOME" },
    
    // 🏦 Assets
    { keyword: "equipment_purchase", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "equipment_lease", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "equipment_financing", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "machinery_purchase", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "vehicle_purchase", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "computer_purchase", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "furniture_purchase", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "production_equipment", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "manufacturing_equipment", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business_equipment", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "capital_equipment", accountId: 0, weight: 90, transactionType: "ASSET" },
    
    { keyword: "business_checking", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business_savings", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "merchant_account", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business_bank", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "commercial_account", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business_account", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "operating_account", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business_deposit", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "business_cash", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "cash_on_hand", accountId: 0, weight: 90, transactionType: "ASSET" },
    
    { keyword: "prepaid_expenses", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "prepaid_insurance", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "prepaid_rent", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "prepaid_utilities", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "security_deposit", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "rental_deposit", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "lease_deposit", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "utility_deposit", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "prepaid_service", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "advance_payment", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "prepayment", accountId: 0, weight: 90, transactionType: "ASSET" },
    
    { keyword: "stock", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "merchandise", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "raw_materials", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "finished_goods", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "work_in_progress", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "inventory_items", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "product_inventory", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "goods_inventory", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "stock_inventory", accountId: 0, weight: 90, transactionType: "ASSET" },
    { keyword: "inventory_goods", accountId: 0, weight: 90, transactionType: "ASSET" },
    
    // 💳 Liabilities
    { keyword: "visa", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "mastercard", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "amex", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "american_express", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "discover", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "business_credit_card", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "corporate_card", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "company_card", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "credit_line", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "credit_limit", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    
    { keyword: "business_loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "sba_loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "term_loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "installment_loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "business_financing", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "commercial_loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "working_capital_loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "expansion_loan", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    
    { keyword: "payroll_taxes_payable", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "sales_tax_payable", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "income_tax_payable", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "withholding_payable", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "tax_liability", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "taxes_payable", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "payroll_liability", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "tax_deposit", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "estimated_tax", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "quarterly_tax", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    
    { keyword: "deferred_revenue", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "unearned_revenue", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "advance_payment", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "prepaid_revenue", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "customer_deposit", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "retainer", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "advance_billing", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "prepaid_service", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    { keyword: "unearned_income", accountId: 0, weight: 90, transactionType: "LIABILITY" },
    
    // 👥 Equity
    { keyword: "owner_contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner_investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "capital_contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner_equity", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner_contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member_contribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner_draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner_draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member_draw", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner_withdrawal", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner_withdrawal", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member_withdrawal", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "distribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "owner_distribution", accountId: 0, weight: 90, transactionType: "EQUITY" },
    
    { keyword: "partner_equity", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member_equity", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "stockholder_equity", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "shareholder_equity", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner_investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member_investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "stockholder_investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "shareholder_investment", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "partner_capital", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "member_capital", accountId: 0, weight: 90, transactionType: "EQUITY" },
    
    { keyword: "retained_earnings", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "accumulated_earnings", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "earned_surplus", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "undistributed_profits", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "retained_profit", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "accumulated_profit", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "earned_income", accountId: 0, weight: 90, transactionType: "EQUITY" },
    { keyword: "retained_income", accountId: 0, weight: 90, transactionType: "EQUITY" }
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
          keyword === "employee_pay" || keyword === "staff_payment" || keyword === "bonus" || 
          keyword === "commission" || keyword === "overtime" || keyword === "holiday_pay") {
        if (accountName.includes("payroll") || accountName.includes("salary") || accountName.includes("wages") || 
            accountName.includes("employee") || accountName.includes("staff")) {
          return account;
        }
      }
      
      // Contractor Payment Keywords
      if (keyword === "contractor" || keyword === "contractor_payment" || keyword === "freelancer" || 
          keyword === "consultant" || keyword === "vendor_payment" || keyword === "independent_contractor" ||
          keyword === "service_payment" || keyword === "contract_work" || keyword === "project_payment" ||
          keyword === "professional_services" || keyword === "1099_payment") {
        if (accountName.includes("contractor") || accountName.includes("freelancer") || accountName.includes("consultant") ||
            accountName.includes("vendor") || accountName.includes("service") || accountName.includes("professional")) {
          return account;
        }
      }
      
      // Tax Keywords
      if (keyword === "tax" || keyword === "taxes" || keyword === "irs" || keyword === "income_tax" ||
          keyword === "sales_tax" || keyword === "property_tax" || keyword === "business_tax" ||
          keyword === "payroll_tax" || keyword === "withholding" || keyword === "deductions") {
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
      if (keyword === "office_supplies" || keyword === "supplies") {
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
      if (keyword === "bank_fees" || keyword === "credit_card_fees" || keyword === "processing_fees" ||
          keyword === "interest_expense" || keyword === "late_fees" || keyword === "penalties" || keyword === "fines") {
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
      if ((keyword === "equipment" || keyword === "deposit" || keyword === "equipment_purchase") && 
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