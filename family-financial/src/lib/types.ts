export type TxType = "income" | "expense";

export interface CategoryRow {
  id: number;
  name: string;
  type: TxType;
  icon: string;
  color: string;
}

export interface TxRow {
  id: number;
  type: TxType;
  amount: number;
  note: string | null;
  date: string;
  categoryId: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

export interface AssetRow {
  id: number;
  name: string;
  type: string;
  value: number;
  acquiredAt: string | null;
  note: string | null;
}

export interface MonthPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export interface CategorySlice {
  name: string;
  color: string;
  icon: string;
  value: number;
}

export interface StatsResponse {
  monthKey: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  monthIncome: number;
  monthExpense: number;
  prevMonthIncome: number;
  prevMonthExpense: number;
  txCount: number;
  totalAssets: number;
  netWorth: number;
  assetCount: number;
  cashflow: MonthPoint[];
  expenseByCategory: CategorySlice[];
  incomeByCategory: CategorySlice[];
  recent: TxRow[];
  assetsTop: AssetRow[];
  assetByType: { type: string; value: number }[];
}

export interface ReportResponse {
  year: number;
  months: MonthPoint[];
  totalIncome: number;
  totalExpense: number;
  net: number;
  expenseByCategory: CategorySlice[];
  incomeByCategory: CategorySlice[];
  txCount: number;
}
