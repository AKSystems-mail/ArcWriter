import { auth } from '../firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * A wrapper around fetch that handles authentication and base URL configuration.
 * Automatically attaches the Firebase Auth token to requests if a user is logged in.
 */
export const apiClient = async (endpoint, options = {}) => {
    const { headers = {}, ...rest } = options;

    // Clone headers to avoid mutation
    const requestHeaders = { ...headers };

    // Add Auth Token if user is logged in
    if (auth.currentUser) {
        try {
            // Force a refresh check
            const token = await auth.currentUser.getIdToken(false);
            requestHeaders['Authorization'] = `Bearer ${token}`;
        } catch (error) {
            console.error("Critical Auth Error: Session may be invalid.", error);
            // If we can't get a token, the session is likely dead.
            // Redirect to login to prevent 'hanging' API calls.
            window.location.href = '/login';
            return Promise.reject(new Error("Session expired"));
        }
    } else {
        // Suppress warning for known public routes (like manual/help sections)
        if (!endpoint.includes('/api/manual/')) {
            console.warn("Making API call without authenticated user.");
        }
    }

    // Ensure Content-Type is set for JSON requests if not provided/applicable
    if (!requestHeaders['Content-Type'] && !(options.body instanceof FormData)) {
        requestHeaders['Content-Type'] = 'application/json';
    }

    // Construct full URL
    // If endpoint starts with /, strip it to avoid double slashes if BASE_URL ends with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${BASE_URL}${cleanEndpoint}`;

    try {
        const response = await fetch(url, {
            ...rest,
            headers: requestHeaders,
        });

        if (response.status === 401) {
            console.error("Unauthorized access. Redirecting to login...");
            // Redirect to login page
            // Note: This is a hard redirect. If using React Router, we might want to use a callback or event.
            // But for a utility function, this is often the most direct way.
            window.location.href = '/login';
            return Promise.reject(new Error("Unauthorized"));
        }

        return response;
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
};
