import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
  if (browser) {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
  }
  return {
    user: null,
  };
};
