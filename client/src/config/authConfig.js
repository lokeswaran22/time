/**
 * Microsoft Teams Authentication Configuration
 * Using Microsoft Authentication Library (MSAL) for React
 */

export const msalConfig = {
    auth: {
        // Get from environment or use defaults for development
        clientId: import.meta.env.VITE_MSAL_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID || 'common'}`,
        redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI || 'http://localhost:3000',
    },
    cache: {
        cacheLocation: 'localStorage', // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
    scopes: ['User.Read', 'email', 'profile', 'openid']
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
    graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me'
};

/**
 * Demo/Development mode configuration
 * When Teams credentials are not available, use this simple login
 */
export const DEMO_MODE = !import.meta.env.VITE_MSAL_CLIENT_ID ||
    import.meta.env.VITE_MSAL_CLIENT_ID === 'YOUR_CLIENT_ID_HERE';
