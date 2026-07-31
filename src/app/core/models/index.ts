// User
export interface User {
  id: number;
  publicId: string;
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  role?: string;
  address?: string;
  creditScore: number;
  status: 'active' | 'suspended' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

// Category
export interface Category {
  id: number;
  parentId?: number;
  name: string;
  slug: string;
  createdAt: string;
  parent?: Category;
  children?: Category[];
}

// Product Image
export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  altText?: string;
  order: number;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product
export interface Product {
  id: number;
  publicId: string;
  categoryId: number;
  title: string;
  brand?: string;
  basePrice: number;
  currency: string;
  stockQuantity: number;
  status: 'active' | 'sold' | 'archived';
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  financingPlans?: FinancingPlan[];
  images?: ProductImage[]; // <--- Agregada aquí
}

// Financing Plan
export interface FinancingPlan {
  id: number;
  productId: number;
  name: string;
  durationMonths: number;
  interestRate: number;
  downPaymentPercent: number;
  isActive: boolean;
  createdAt: string;
}

// Loan Application
export interface LoanApplication {
  id: number;
  publicId: string;
  userId: number;
  productId: number;
  financingPlanId: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAmount: number;
  downPaymentAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  product?: Product;
  financingPlan?: FinancingPlan;
}

// Active Loan
export interface ActiveLoan {
  id: number;
  publicId: string;
  userId: number;
  loanApplicationId: number;
  principalAmount: number;
  interestRate: number;
  totalAmount: number;
  monthlyPayment: number;
  remainingBalance: number;
  startDate: string;
  endDate: string;
  status: 'current' | 'delinquent' | 'paid_off' | 'defaulted';
  createdAt: string;
  user?: User;
  loanApplication?: LoanApplication;
  scheduleItems?: LoanScheduleItem[];
}

// Loan Schedule Item
export interface LoanScheduleItem {
  id: number;
  activeLoanId: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
}

// Payment Record
export interface PaymentRecord {
  id: number;
  activeLoanId: number;
  loanScheduleItemId?: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

// Application Document
export interface ApplicationDocument {
  id: number;
  loanApplicationId: number;
  documentType: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

// Late Fee Penalty
export interface LateFee {
  id: number;
  activeLoanId: number;
  loanScheduleItemId: number;
  amount: number;
  reason: string;
  appliedAt: string;
  isPaid: boolean;
}

// Audit Log
export interface AuditLog {
  id: number;
  userId?: number;
  action: string;
  entity: string;
  entityId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
  user?: User;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Auth
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  nationalId: string;
  phone: string;
  address?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Dashboard
// En tu modelo core/models.ts
export interface DashboardStats {
  totalUsers: number;
  userTrend: { value: number, isUp: boolean, text: string };
  activeLoans: number;
  activeLoanTrend: { value: number, isUp: boolean, text: string };
  pendingApplications: number;
  applicationsTrend: { value: number, isUp: boolean, text: string };
  monthlyRevenue: number;
  revenueTrend: { value: number, isUp: boolean, text: string };
  totalProducts: number;
  productTrend: { value: number, isUp: boolean, text: string };
  overdueLoans: number;
  overdueTrend: { value: number, isUp: boolean, text: string };
}