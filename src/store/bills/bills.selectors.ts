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

export const selectBillStatus = createSelector(
  [selectBillState],
  (billState) => billState.billStatus
);

export const selectBillStatistics = createSelector(
  [selectBillState],
  (billState) => billState.statistics
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
  (bills, status) => bills.filter(bill => bill.billStatus === status)
);

export const selectBillsByType = createSelector(
  [selectBills, (state: RootState, type: BillType) => type],
  (bills, type) => bills.filter(bill => bill.billType === type)
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
      if (filters.billType && bill.billType !== filters.billType) {
        return false;
      }
      if (filters.billStatus && bill.billStatus !== filters.billStatus) {
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
      if (filters.minAmount && bill.billTotalAmount && bill.billTotalAmount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount && bill.billTotalAmount && bill.billTotalAmount > filters.maxAmount) {
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
  (bills) => bills.filter(bill => bill.billStatus === 'paid')
);

export const selectUnpaidBills = createSelector(
  [selectBills],
  (bills) => bills.filter(bill => bill.billStatus === 'issued' || bill.billStatus === 'draft')
);

export const selectPartiallyPaidBills = createSelector(
  [selectBills],
  (bills) => bills.filter(bill => bill.billStatus === 'partially_paid')
);

export const selectOverdueBills = createSelector(
  [selectBills],
  (bills) => bills.filter(bill => {
    if (bill.billStatus !== 'issued' && bill.billStatus !== 'partially_paid') return false;
    if (!bill.billDueDate) return false;
    
    const dueDate = new Date(bill.billDueDate);
    const now = new Date();
    return dueDate < now;
  })
);

export const selectCancelledBills = createSelector(
  [selectBills],
  (bills) => bills.filter(bill => bill.billStatus === 'cancelled')
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

// Statistics selectors
export const selectTotalBillAmount = createSelector(
  [selectBillStatistics],
  (statistics) => statistics?.totalBillAmount || 0
);

export const selectTotalPaidAmount = createSelector(
  [selectBillStatistics],
  (statistics) => statistics?.totalPaidAmount || 0
);

export const selectTotalRemainingAmount = createSelector(
  [selectBillStatistics],
  (statistics) => statistics?.totalRemainingAmount || 0
);

export const selectTotalBillCount = createSelector(
  [selectBillStatistics],
  (statistics) => statistics?.totalBills || 0
);

export const selectPaidBillCount = createSelector(
  [selectBillStatistics],
  (statistics) => statistics?.paidBills || 0
);

export const selectUnpaidBillCount = createSelector(
  [selectBillStatistics],
  (statistics) => statistics?.unpaidBills || 0
);

export const selectPartiallyPaidBillCount = createSelector(
  [selectBillStatistics],
  (statistics) => statistics?.partiallyPaidBills || 0
);

export const selectOverdueBillCount = createSelector(
  [selectBillStatistics],
  (statistics) => statistics?.overdueBills || 0
);

export const selectCancelledBillCount = createSelector(
  [selectBillStatistics],
  (statistics) => statistics?.cancelledBills || 0
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
  [selectBills, selectBillStatistics],
  (bills, statistics) => ({
    recentBills: bills.slice(0, 5),
    totalBills: statistics?.totalBills || 0,
    paidBills: statistics?.paidBills || 0,
    unpaidBills: statistics?.unpaidBills || 0,
    overdueBills: statistics?.overdueBills || 0,
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
      const status = bill.billStatus || 'unknown';
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
      const type = bill.billType || 'unknown';
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
  (currentBill) => currentBill?.billStatus || null
);

export const selectCurrentBillAmount = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.billTotalAmount || 0
);

export const selectCurrentBillPaidAmount = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.billPaidAmount || 0
);

export const selectCurrentBillRemainingAmount = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.billRemainingAmount || 0
);

export const selectCurrentBillIsFullyPaid = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.isBillFullyPaid || false
);

export const selectCurrentBillDueDate = createSelector(
  [selectCurrentBill],
  (currentBill) => currentBill?.billDueDate || null
);

export const selectCurrentBillIsOverdue = createSelector(
  [selectCurrentBill],
  (currentBill) => {
    if (!currentBill?.billDueDate) return false;
    if (currentBill.isBillFullyPaid) return false;
    
    const dueDate = new Date(currentBill.billDueDate);
    const now = new Date();
    return dueDate < now;
  }
);

// Bill status specific selectors
export const selectBillPaymentHistory = createSelector(
  [selectBillStatus],
  (billStatus) => billStatus?.paymentHistory || []
);

export const selectBillRefundHistory = createSelector(
  [selectBillStatus],
  (billStatus) => billStatus?.refundHistory || []
);

export const selectBillItems = createSelector(
  [selectBillStatus],
  (billStatus) => billStatus?.billItems || []
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
      .filter(bill => bill.billStatus === status)
      .reduce((total, bill) => total + (bill.billTotalAmount || 0), 0);
  }
);

export const selectTotalPaidAmountByStatus = createSelector(
  [selectBills, (state: RootState, status: BillStatus) => status],
  (bills, status) => {
    return bills
      .filter(bill => bill.billStatus === status)
      .reduce((total, bill) => total + (bill.billPaidAmount || 0), 0);
  }
);

export const selectTotalRemainingAmountByStatus = createSelector(
  [selectBills, (state: RootState, status: BillStatus) => status],
  (bills, status) => {
    return bills
      .filter(bill => bill.billStatus === status)
      .reduce((total, bill) => total + (bill.billRemainingAmount || 0), 0);
  }
);

// Dashboard specific selectors
export const selectBillDashboardData = createSelector(
  [selectBills, selectBillStatistics, selectOverdueBills],
  (bills, statistics, overdueBills) => ({
    totalBills: statistics?.totalBills || bills.length,
    unpaidBills: statistics?.unpaidBills || 0,
    overdueBills: statistics?.overdueBills || overdueBills.length,
    totalAmount: statistics?.totalBillAmount || 0,
    paidAmount: statistics?.totalPaidAmount || 0,
    remainingAmount: statistics?.totalRemainingAmount || 0,
    recentBills: bills.slice(0, 5),
  })
);
