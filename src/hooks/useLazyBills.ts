// src/hooks/useLazyBills.ts
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/store';
import {
  useLazyGetUserBillsQuery,
  useLazyGetBillPaymentStatusQuery,
  useLazyGetBillPaymentStatusByNumberQuery,
  useLazyGetBillPaymentStatusByTrackingCodeQuery,
  useCreateBillMutation,
  useIssueBillMutation,
  useCancelBillMutation,
  GetBillsRequest,
  CreateBillRequest,
  IssueBillRequest,
  CancelBillRequest,
} from '@/src/store/bills';
import {
  setLoading,
  setError,
  clearError,
  clearBillData,
  clearBills,
  clearCurrentBill,
} from '@/src/store/bills';

/**
 * Custom hook for lazy bills operations
 * Provides convenient methods for bills management with proper error handling
 */
export const useLazyBills = () => {
  const dispatch = useDispatch();
  
  // RTK Query hooks
  const [getUserBills] = useLazyGetUserBillsQuery();
  const [getBillPaymentStatus] = useLazyGetBillPaymentStatusQuery();
  const [getBillPaymentStatusByNumber] = useLazyGetBillPaymentStatusByNumberQuery();
  const [getBillPaymentStatusByTrackingCode] = useLazyGetBillPaymentStatusByTrackingCodeQuery();
  const [createBill] = useCreateBillMutation();
  const [issueBill] = useIssueBillMutation();
  const [cancelBill] = useCancelBillMutation();

  // Selectors
  const isLoading = useSelector((state: RootState) => state.bills.isLoading);
  const error = useSelector((state: RootState) => state.bills.error);
  const bills = useSelector((state: RootState) => state.bills.bills);
  const currentBill = useSelector((state: RootState) => state.bills.currentBill);
  const billStatus = useSelector((state: RootState) => state.bills.billStatus);
  const statistics = useSelector((state: RootState) => state.bills.statistics);

  // Error handling helper
  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`Bills ${operation} error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    dispatch(setError(errorMessage));
  }, [dispatch]);

  // Success handling helper
  const handleSuccess = useCallback((operation: string) => {
    console.log(`Bills ${operation} successful`);
    dispatch(clearError());
  }, [dispatch]);

  // Get user bills with error handling
  const fetchUserBills = useCallback(async (params?: GetBillsRequest) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await getUserBills(params || {}).unwrap();
      
      if (result?.result) {
        handleSuccess('fetch user bills');
        return result.result;
      } else {
        throw new Error('No bills data received');
      }
    } catch (error) {
      handleError(error, 'fetch user bills');
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [getUserBills, dispatch, handleError, handleSuccess]);

  // Get bill payment status by ID
  const fetchBillPaymentStatus = useCallback(async (billId: string, includeBillItems = false) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await getBillPaymentStatus({ billId, includeBillItems }).unwrap();
      
      if (result?.result) {
        handleSuccess('fetch bill payment status');
        return result.result;
      } else {
        throw new Error('No bill status data received');
      }
    } catch (error) {
      handleError(error, 'fetch bill payment status');
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [getBillPaymentStatus, dispatch, handleError, handleSuccess]);

  // Get bill payment status by number
  const fetchBillPaymentStatusByNumber = useCallback(async (billNumber: string, includeBillItems = false) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await getBillPaymentStatusByNumber({ billNumber, includeBillItems }).unwrap();
      
      if (result?.result) {
        handleSuccess('fetch bill payment status by number');
        return result.result;
      } else {
        throw new Error('No bill status data received');
      }
    } catch (error) {
      handleError(error, 'fetch bill payment status by number');
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [getBillPaymentStatusByNumber, dispatch, handleError, handleSuccess]);

  // Get bill payment status by tracking code
  const fetchBillPaymentStatusByTrackingCode = useCallback(async (
    trackingCode: string, 
    billType?: string, 
    includeBillItems = false
  ) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await getBillPaymentStatusByTrackingCode({ 
        trackingCode, 
        billType, 
        includeBillItems 
      }).unwrap();
      
      if (result?.result) {
        handleSuccess('fetch bill payment status by tracking code');
        return result.result;
      } else {
        throw new Error('No bill status data received');
      }
    } catch (error) {
      handleError(error, 'fetch bill payment status by tracking code');
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [getBillPaymentStatusByTrackingCode, dispatch, handleError, handleSuccess]);

  // Create bill
  const createNewBill = useCallback(async (request: CreateBillRequest) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await createBill(request).unwrap();
      
      if (result?.result) {
        handleSuccess('create bill');
        return result.result;
      } else {
        throw new Error('No bill creation data received');
      }
    } catch (error) {
      handleError(error, 'create bill');
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [createBill, dispatch, handleError, handleSuccess]);

  // Issue bill
  const issueNewBill = useCallback(async (billId: string, request?: IssueBillRequest) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await issueBill({ billId, request }).unwrap();
      
      if (result?.result) {
        handleSuccess('issue bill');
        return result.result;
      } else {
        throw new Error('No bill issue data received');
      }
    } catch (error) {
      handleError(error, 'issue bill');
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [issueBill, dispatch, handleError, handleSuccess]);

  // Cancel bill
  const cancelExistingBill = useCallback(async (billId: string, request: CancelBillRequest) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await cancelBill({ billId, request }).unwrap();
      
      if (result?.result) {
        handleSuccess('cancel bill');
        return result.result;
      } else {
        throw new Error('No bill cancellation data received');
      }
    } catch (error) {
      handleError(error, 'cancel bill');
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [cancelBill, dispatch, handleError, handleSuccess]);

  // Clear all bills data
  const clearAllBillsData = useCallback(() => {
    dispatch(clearBillData());
  }, [dispatch]);

  // Clear bills list only
  const clearBillsList = useCallback(() => {
    dispatch(clearBills());
  }, [dispatch]);

  // Clear current bill
  const clearCurrentBillData = useCallback(() => {
    dispatch(clearCurrentBill());
  }, [dispatch]);

  // Clear error
  const clearBillsError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    isLoading,
    error,
    bills,
    currentBill,
    billStatus,
    statistics,
    
    // Actions
    fetchUserBills,
    fetchBillPaymentStatus,
    fetchBillPaymentStatusByNumber,
    fetchBillPaymentStatusByTrackingCode,
    createNewBill,
    issueNewBill,
    cancelExistingBill,
    
    // Utility actions
    clearAllBillsData,
    clearBillsList,
    clearCurrentBillData,
    clearBillsError,
  };
};
