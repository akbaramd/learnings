// src/store/bills/bills.types.ts
// Bill types - re-exported from Api.ts to maintain consistency

import { BillDto, BillDetailDto } from '@/src/services/Api';


/**
 * Get bills request matching backend API
 */
export interface GetBillsRequest {
  pageNumber?: number;
  pageSize?: number;
  billType?: string;
  billStatus?: string;
  status?: string;
  onlyOverdue?: boolean;
  onlyUnpaid?: boolean;
  sortBy?: string;
  sortDirection?: string;
}

/**
 * Issue bill request
 */
export interface IssueBillRequest {
  autoIssueBill?: boolean;
}


export interface BillState {
  bills: BillDto[];
  billDetail: BillDetailDto | null;
  isLoading: boolean;
  error: string | null;
}