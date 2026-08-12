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
  title?: string;
  numberOfInstallments: number;
  installmentAmount: number;
  downPayment: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  interestRateApr: number;
  isActive: boolean;
  createdAt: string;
  product?: Product;
}

// Loan Application Item
export interface LoanApplicationItem {
  id: number;
  applicationId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  createdAt: string;
  product?: Product;
}

// Loan Application
export interface LoanApplication {
  id: number;
  publicId: string;
  userId: number;
  financingPlanId: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
  rejectionReason?: string;
  agreedInstallments: number;
  agreedInstallmentAmount: number;
  agreedDownPayment: number;
  totalLoanAmount: number;
  reviewedBy?: string;
  appliedAt: string;
  reviewedAt?: string;
  user?: User;
  financingPlan?: FinancingPlan;
  activeLoan?: ActiveLoan;
  documents?: ApplicationDocument[];
  items?: LoanApplicationItem[];
}

// Active Loan
export interface ActiveLoan {
  id: number;
  publicId: string;
  applicationId: number;
  userId: number;
  principalAmount: number;
  remainingBalance: number;
  loanStatus: 'active' | 'paid_in_full' | 'defaulted' | 'written_off';
  startDate: string;
  expectedEndDate: string;
  createdAt: string;
  user?: User;
  application?: LoanApplication;
  scheduleItems?: LoanScheduleItem[];
  payments?: PaymentRecord[];
}

// Loan Schedule Item
export interface LoanScheduleItem {
  id: number;
  loanId: number;
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  paidAt?: string;
  loan?: ActiveLoan;
}

// Payment Record
export interface PaymentRecord {
  id: number;
  publicId: string;
  loanId: number;
  scheduleItemId?: number;
  amountPaid: number;
  paymentMethod: string;
  transactionReference?: string;
  paymentStatus: 'completed' | 'refunded' | 'failed';
  createdAt: string;
  loan?: ActiveLoan;
  scheduleItem?: LoanScheduleItem;
}

// Application Document
export interface ApplicationDocument {
  id: number;
  applicationId: number;
  documentType: string;
  fileUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  application?: LoanApplication;
}

// Late Fee Penalty
export interface LateFee {
  id: number;
  loanId: number;
  scheduleItemId: number;
  penaltyAmount: number;
  reason: string;
  isPaid: boolean;
  createdAt: string;
  loan?: ActiveLoan;
  scheduleItem?: LoanScheduleItem;
}

// Payment Method
export interface PaymentMethod {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  requiresReference: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Payment Data (loan + pending installments + methods)
export interface PaymentData {
  loan: ActiveLoan;
  pendingInstallments: LoanScheduleItem[];
  paymentMethods: PaymentMethod[];
}

// Audit Log
export interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  performedBy: string;
  details?: Record<string, any>;
  createdAt: string;
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

// Helper: label de producto(s) para una solicitud/préstamo (soporta varios items)
export function loanProductsLabel(
  source:
    | { items?: LoanApplicationItem[]; financingPlan?: FinancingPlan }
    | { application?: LoanApplication }
    | null
    | undefined,
  fallback: string,
): string {
  const app =
    (source as { application?: LoanApplication } | null | undefined)?.application ??
    (source as { items?: LoanApplicationItem[]; financingPlan?: FinancingPlan } | null | undefined);
  const items = app?.items;
  if (items && items.length > 0) {
    const first = items[0]?.product?.title;
    const base = first ?? `Producto #${items[0]?.productId ?? '?'}`;
    return items.length > 1 ? `${base} (+${items.length - 1} más)` : base;
  }
  return app?.financingPlan?.product?.title ?? fallback;
}