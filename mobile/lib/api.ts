import { createApiClient } from '@gulel/shared';
import { config } from './config';
import { getAccessToken } from './supabase';

/**
 * Shared, typed API client bound to the mobile runtime: points at the deployed
 * Gulel API and authenticates with the Supabase access token (bearer).
 */
export const api = createApiClient({
  baseUrl: config.apiUrl,
  getToken: getAccessToken,
});
