import { coreApi, apiRequest } from './apiCore';
import { publishingApi } from './apiPublishing';
import { systemApi } from './apiSystem';

export { apiRequest };

export const api = {
  ...coreApi,
  ...publishingApi,
  ...systemApi
};

