// src/store/bills/bills.selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { BillState, BillFilters, BillStatus, BillType } from './bills.types';

// Base selector for bill state
const selectBillState = (state: RootState): BillState => state.bills;

// Basic selectors
export const selectBills = createSelector(
  [selectBillState],
  (billState) => billState.bills
);

export const selectCurrentBill = createSelector(
  [selectBillState],
  (billState) => billState.currentBill
);



export const selectBillPagination = createSelector(
  [selectBillState],
  (billState) => billState.pagination
);

export const selectBillIsLoading = createSelector(
  [selectBillState],
  (billState) => billState.isLoading
);

export const selectBillError = createSelector(
  [selectBillState],
  (billState) => billState.error
);


// Computed selectors for bills
export const selectHasBills = createSelector(
  [selectBills],
  (bills) => bills.length > 0
);

export const selectBillCount = createSelector(
  [selectBills],
  (bills) => bills.length
);

export const selectBillsByStatus = createSelector(
  [selectBills, (state: RootState, status: BillStatus) => status],
  (bills, status) => bills.filter(bill => bill.status === status)
);

export const selectBillsByType = createSelector(
  [selectBills, (state: RootState, type: BillType) => type],
  (bills, type) => bills.filter(bill => bill.referenceType === type)
);

export const selectBillsByDateRange = createSelector(
  [selectBills, (state: RootState, fromDate: string, toDate: string) => ({ fromDate, toDate })],
  (bills, { fromDate, toDate }) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    return bills.filter(bill => {
      if (!bill.createdAt) return false;
      const billDate = new Date(bill.createdAt);
      return billDate >= from && billDate <= to;
    });
  }
);

export const selectBillsByFilters = createSelector(
  [selectBills, (state: RootState, filters: BillFilters) => filters],
  (bills, filters) => {
    return bills.filter(bill => {
      if (filters.billType && bill.referenceType !== filters.billType) {
        return false;
      }
      if (filters.billStatus && bill.status !== filters.billStatus) {
        return false;
      }
      if (filters.fromDate && bill.createdAt) {
        const billDate = new Date(bill.createdAt);
        const fromDate = new Date(filters.fromDate);
        if (billDate < fromDate) return false;
      }
      if (filters.toDate && bill.createdAt) {
        const billDate = new Date(bill.createdAt);
        const toDate = new Date(filters.toDate);
        if (billDate > toDate) return false;
      }
      if (filters.minAmount && bill.totalAmountRials && bill.totalAmountRials < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount && bill.totalAmountRials && bill.totalAmountRials > filters.maxAmount) {
        return false;
      }
      return true;
    });
  }
);

export const selectRecentBills = createSelector(
  [selectBills],
  (bills) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return bills.filter(bill => {
      if (!bill.createdAt) return false;
      const createdAt = new Date(bill.createdAt);
      return createdAt >= oneWeekAgo;
    }).slice(0, 10); // Limit to 10 most recent
  }
);

export const selectBillById = createSelector(
  [selectBills, (state: RootState, id: string) => id],
  (bills, id) => bills.find(bill => bill.id === id)
);

export const selectBillByNumber = createSelector(
  [selectBills, (state: RootState, billNumber: string) => billNumber],
  (bills, billNumber) => bills.find(bill => bill.billNumber === billNumber)
);

// Bill status specific selectors
export const selectPaidBills = createSelector(
  [selectBills],
  (bills) => bills.filter(bill => bill.isPaid)
);

export const selectUnpaidBills = createSelector(
  [selectBills],
  (bills) => bills.filter(bill => !bill.isPaid && !bill.isPartiallyPaid)
);

export const selectPartiallyPaidBills = createSelector(
  [selectBills],
  (bills) => bills.filter(bill => bill.isPartiallyPaid)
);

export const selectOverdueBills = createSelector(
  [selectBills],
  (bills) => bills.filter(bill => bill.isOverdue)
);

export const selectCancelledBills = createSelector(
  [selectBills],
  (bills) => bills.filter(bill => bill.isCancelled)
);

// Pagination selectors
export const selectBillPaginationInfo = createSelector(
  [selectBillPagination],
  (pagination) => pagination.bills
);

export const selectHasNextBillPage = createSelector(
  [selectBillPaginationInfo],
  (pagination) => pagination.pageNumber < pagination.totalPages
);

export const selectHasPreviousBillPage = createSelector(
  [selectBillPaginationInfo],
  (pagination) => pagination.pageNumber > 1
);

// Statistics selectors (computed from bills)
export const selectTotalBillAmount = createSelector(
  [selectBills],
  (bills) => bills.reduce((total, bill) => total + (bill.totalAmountRials || 0), 0)
);

export const selectTotalPaidAmount = createSelector(
  [selectBills],
  (bills) => bills.reduce((total, bill) => total + (bill.paidAmountRials || 0), 0)
);

export const selectTotalRemainingAmount = createSelector(
  [selectBills],
  (bills) => bills.reduce((total, bill) => total + (bill.remainingAmountRials || 0), 0)
);

export const selectTotalBillCount = createSelector(
  [selectBills],
  (bills) => bills.length
);

export const selectPaidBillCount = createSelector(
  [selectPaidBills],
  (bills) => bills.length
);

export const selectUnpaidBillCount = createSelector(
  [selectUnpaidBills],
  (bills) => bills.length
);

export const selectPartiallyPaidBillCount = createSelector(
  [selectPartiallyPaidBills],
  (bills) => bills.length
);

export const selectOverdueBillCount = createSelector(
  [selectOverdueBills],
  (bills) => bills.length
);

export const selectCancelledBillCount = createSelector(
  [selectCancelledBills],
  (bills) => bills.length
);

// Combined selectors for convenience
export const selectBillSummary = createSelector(
  [selectBills, selectBillIsLoading, selectBillError],
  (bills, isLoading, error) => ({
    hasBills: bills.length > 0,
    billCount: bills.length,
    isLoading,
    error,
  })
);

export const selectBillActivity = createSelector(
  [selectBills, selectPaidBills, selectUnpaidBills, selectOverdueBills],
  (bills, paidBills, unpaidBills, overdueBills) => ({
    recentBills: bills.slice(0, 5),
    totalBills: bills.length,
    paidBills: paidBills.length,
    unpaidBills: unpaidBills.length,
    overdueBills: overdueBills.length,
  })
);

export const selectBillFinancials = createSelector(
  [selectTotalBillAmount, selectTotalPaidAmount, selectTotalRemainingAmount],
  (totalAmount, paidAmount, remainingAmount) => ({
    totalAmount,
    paidAmount,
    remainingAmount,
    paymentPercentage: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
  })
);

// Error and loading state selectors
export const selectHasBillError = createSelector(
  [selectBillError],
  (error) => !!error
);

export const selectBillReady = createSelector(
  [selectBillIsLoading, selectBillError],
  (isLoading, error) => !isLoading && !error
);

// Bill status breakdown
export const selectBillStatusBreakdown = createSelector(
  [selectBills],
  (bills) => {
    const breakdown: Record<string, number> = {};
    bills.forEach(bill => {
      const status = bill.status || 'unknown';
      breakdown[status] = (breakdown[status] || 0) + 1;
    });
    return breakdown;
  }
);

// Bill type breakdown
export const selectBillTypeBreakdown = createSelector(
  [selectBills],
  (bills) => {
    const breakdown: Record<string, number> = {};
    bills.forEach(bill => {
      const type = bill.referenceType || 'unknown';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    return breakdown;
  }
);

// Current bill specific selectors
export const selectCurrentBillId = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.id || null
);

export const selectCurrentBillNumber = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.billNumber || null
);

export const selectCurrentBillStatus = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.status || null
);

export const selectCurrentBillAmount = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.totalAmountRials || 0
);

export const selectCurrentBillPaidAmount = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.paidAmountRials || 0
);

export const selectCurrentBillRemainingAmount = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.remainingAmountRials || 0
);

export const selectCurrentBillIsFullyPaid = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.isPaid || false
);

export const selectCurrentBillDueDate = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.dueDate || null
);

export const selectCurrentBillIsOverdue = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.isOverdue || false
);

// Bill status specific selectors
export const selectBillPaymentHistory = createSelector(
  [selectCurrentBill],
  (currentBill) => []
);

export const selectBillRefundHistory = createSelector(
  [selectCurrentBill],
  (currentBill) => []
);

export const selectBillItems = createSelector(
  [selectCurrentBill],
  (currentBill) => []
);

export const selectBillPaymentCount = createSelector(
  [selectBillPaymentHistory],
  (paymentHistory) => paymentHistory.length
);

export const selectBillRefundCount = createSelector(
  [selectBillRefundHistory],
  (refundHistory) => refundHistory.length
);

export const selectBillItemCount = createSelector(
  [selectBillItems],
  (billItems) => billItems.length
);

// Amount calculations
export const selectTotalBillAmountByStatus = createSelector(
  [selectBills, (state: RootState, status: BillStatus) => status],
  (bills, status) => {
    return bills
      .filter(bill => bill.status === status)
      .reduce((total, bill) => total + (bill.totalAmountRials || 0), 0);
  }
);

export const selectTotalPaidAmountByStatus = createSelector(
  [selectBills, (state: RootState, status: BillStatus) => status],
  (bills, status) => {
    return bills
      .filter(bill => bill.status === status)
      .reduce((total, bill) => total + (bill.paidAmountRials || 0), 0);
  }
);

export const selectTotalRemainingAmountByStatus = createSelector(
  [selectBills, (state: RootState, status: BillStatus) => status],
  (bills, status) => {
    return bills
      .filter(bill => bill.status === status)
      .reduce((total, bill) => total + (bill.remainingAmountRials || 0), 0);
  }
);

// Dashboard specific selectors
export const selectBillDashboardData = createSelector(
  [selectBills, selectUnpaidBills, selectOverdueBills, selectTotalBillAmount, selectTotalPaidAmount, selectTotalRemainingAmount],
  (bills, unpaidBills, overdueBills, totalAmount, paidAmount, remainingAmount) => ({
    totalBills: bills.length,
    unpaidBills: unpaidBills.length,
    overdueBills: overdueBills.length,
    totalAmount,
    paidAmount,
    remainingAmount,
    recentBills: bills.slice(0, 5),
  })
);
