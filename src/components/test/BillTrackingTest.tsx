// Test component to verify bill tracking functionality
// This can be used for testing the bills store integration

import React from 'react';
import { useLazyBills } from '@/src/hooks/useLazyBills';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';
import { selectBillStatus, selectCurrentBill } from '@/src/store/bills';

export function BillTrackingTest() {
  const { fetchBillPaymentStatusByTrackingCode, isLoading, error } = useLazyBills();
  const billStatus = useSelector(selectBillStatus);
  const currentBill = useSelector(selectCurrentBill);

  const testTrackingCode = 'TEST123456';

  const handleTest = async () => {
    try {
      await fetchBillPaymentStatusByTrackingCode(testTrackingCode);
      console.log('Bill tracking test successful');
    } catch (error) {
      console.error('Bill tracking test failed:', error);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Bill Tracking Test</h3>
      
      <div className="space-y-2 mb-4">
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
        <p><strong>Bill Found:</strong> {currentBill ? 'Yes' : 'No'}</p>
        <p><strong>Bill Status:</strong> {billStatus?.billStatus || 'None'}</p>
      </div>

      <button
        onClick={handleTest}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Bill Tracking'}
      </button>

      {currentBill && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h4 className="font-semibold">Bill Details:</h4>
          <p>ID: {currentBill.id}</p>
          <p>Number: {currentBill.billNumber}</p>
          <p>Status: {currentBill.billStatus}</p>
          <p>Total Amount: {currentBill.billTotalAmount}</p>
          <p>Paid Amount: {currentBill.billPaidAmount}</p>
          <p>Remaining Amount: {currentBill.billRemainingAmount}</p>
        </div>
      )}
    </div>
  );
}
