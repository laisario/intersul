/**
 * Centralized Axios client configuration
 */

import _axios from 'axios';
import humps from 'humps';
import { env } from '$lib/config/env.js';

const createAxiosInstance = ({ file = false } = {}) => {
  const instance = _axios.create({
    withCredentials: true,
    baseURL: env.API_URL,
    timeout: 10000,
  });

  const contentType = file ? 'multipart/form-data' : 'application/json';

  instance.defaults.headers.post['Content-Type'] = contentType;
  instance.defaults.headers.patch['Content-Type'] = contentType;
  instance.defaults.headers.put['Content-Type'] = contentType;

  instance.interceptors.request.use((request) => {
    const token = window.localStorage.getItem('token');
    request.headers.Authorization = token ? `Bearer ${token}` : '';
    
    if (request.data && !file) {
      request.data = JSON.stringify(humps.decamelizeKeys(request.data));
    }
    return request;
  });

  instance.interceptors.response.use(
    (response) => {
      if (response.data && response.headers?.['content-type'] === 'application/json') {
        response.data = humps.camelizeKeys(response.data);
      }
      return response;
    },
    (error) => {
      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      // Handle network errors
      if (!error.response) {
        error.message = 'Network error. Please check your connection.';
      }

      if (error.response?.data && error.response?.headers?.['content-type'] === 'application/json') {
        const newError = { response: { data: {} } };
        newError.response.data = humps.camelizeKeys(error.response.data);
        return Promise.reject(newError);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const axios = createAxiosInstance();
export const axiosForFiles = createAxiosInstance({ file: true });
