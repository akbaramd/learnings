// src/store/bills/index.ts
// Bills store module exports

// Types
export * from './bills.types';

// Redux slice
export { default as billsReducer } from './bills.slice';
export * from './bills.slice';

// RTK Query API
export { default as billsApi } from './bills.queries';
export * from './bills.queries';

// Selectors
export * from './bills.selectors';

// Re-export commonly used types for convenience
export type {
  Bill,
  BillItem,
  BillDetail,
  Payment,
  Refund,
  DiscountValidation,
  BillFilters,
  BillPaginatedResult,
  CancelBillRequest,
  CancelBillResponse,
  IssueBillResponse,
  GetBillsRequest,
  IssueBillRequest
} from './bills.types';

// Re-export commonly used actions
export {
  setBills,
  addBill,
  updateBill,
  removeBill,
  setCurrentBill,
  setBillPagination,
  setLoading,
  setError,
  clearError,
  clearBillData,
  clearBills,
  clearCurrentBill,
  resetBillState,
  updateBillStatusOptimistically,
  filterBills,
  sortBills,
} from './bills.slice';

// Re-export commonly used hooks
export {
  useGetUserBillsQuery,
  useIssueBillMutation,
  useCancelBillMutation,
  useLazyGetUserBillsQuery,
} from './bills.queries';

// Re-export commonly used selectors
export {
  selectBills,
  selectCurrentBill,
  selectBillPagination,
  selectBillIsLoading,
  selectBillError,
  selectHasBills,
  selectBillCount,
  selectBillsByStatus,
  selectBillsByType,
  selectBillsByFilters,
  selectRecentBills,
  selectBillById,
  selectBillByNumber,
  selectPaidBills,
  selectUnpaidBills,
  selectPartiallyPaidBills,
  selectOverdueBills,
  selectCancelledBills,
  selectBillSummary,
  selectBillActivity,
  selectBillFinancials,
  selectHasBillError,
  selectBillReady,
  selectBillStatusBreakdown,
  selectBillTypeBreakdown,
  selectCurrentBillId,
  selectCurrentBillNumber,
  selectCurrentBillStatus,
  selectCurrentBillAmount,
  selectCurrentBillPaidAmount,
  selectCurrentBillRemainingAmount,
  selectCurrentBillIsFullyPaid,
  selectCurrentBillDueDate,
  selectCurrentBillIsOverdue,
  selectBillPaymentHistory,
  selectBillRefundHistory,
  selectBillItems,
  selectBillPaymentCount,
  selectBillRefundCount,
  selectBillItemCount,
  selectBillDashboardData,
} from './bills.selectors';
