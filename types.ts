
export type PaymentMode = 'Cash' | 'Online';

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  mode: PaymentMode;
  forMonth: string; // Period covered
}

export interface Student {
  id: string;
  name: string;
  mobile: string;
  tableNumber: number;
  joiningDate: string;
  monthlyFee: number;
  lastPaidDate: string | null;
  nextDueDate: string;
  paymentHistory: PaymentRecord[];
}

export type ViewState = 'grid' | 'list' | 'analytics';

export interface Expense {
  id: string;
  category: string; // e.g. Rent, Electricity, Internet, Cleaning, Salaries, Miscellaneous
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

