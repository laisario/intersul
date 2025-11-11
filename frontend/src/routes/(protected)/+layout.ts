/**
 * Auth guard for protected routes
 * This runs on the server and client to check authentication
 */

import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
  // Check if user is authenticated
  // This is a simplified check - in a real app you'd verify the JWT token
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    // Redirect to login with return URL
    throw redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
  }

  return {
    // You can pass user data here if needed
    user: null, // Will be populated by the auth store
  };
};
