import { supabase } from '../services/supabase';

export const authenticatedFetch = async (url, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        // 'Content-Type': 'application/json' // Don't enforce this, let body decide (e.g. FormData)
    };

    if (options.body && typeof options.body === 'string') {
        headers['Content-Type'] = 'application/json';
    }

    return fetch(url, { ...options, headers });
};
