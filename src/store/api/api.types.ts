/**
 * Base Application Result structure used by all API responses
 */
export interface ApplicationResult<T = unknown> {
    isSuccess?: boolean;
    message?: string | null;
    errors?: string[] | null;
    data?: T;
  }
  