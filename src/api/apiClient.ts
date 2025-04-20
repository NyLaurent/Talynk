import axios from 'axios';

// Helper function to determine if a value is HTML content
const isHtmlContent = (value: any): boolean => {
  return typeof value === 'string' && 
    (value.startsWith('<!DOCTYPE html>') || 
     value.startsWith('<html') || 
     value.includes('</html>'));
};

// Create an Axios instance with default configuration
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json', // Explicitly request JSON responses
  },
  withCredentials: true, // This is important for CORS
  // Add response transformer to detect HTML responses
  transformResponse: [
    ...(axios.defaults.transformResponse ? [axios.defaults.transformResponse].flat() : []),
    (data, headers) => {
      // If we received HTML when expecting JSON, throw an error
      const contentType = headers['content-type'] || '';
      if (contentType.includes('application/json') && isHtmlContent(data)) {
        console.error('Received HTML when expecting JSON - likely an authentication issue');
        throw new Error('Authentication required. Please log in again.');
      }
      return data;
    }
  ]
});

// Function to check if response is HTML (indicating auth redirect)
const isHtmlResponse = (response: any): boolean => {
  const contentType = response?.headers?.['content-type'] || '';
  return contentType.includes('text/html') || 
         isHtmlContent(response?.data);
};

// Handle authentication error by clearing tokens and redirecting
// const handleAuthError = () => {
//   console.error('Authentication error detected. Clearing tokens and redirecting to login.');
//   localStorage.removeItem('token');
//   localStorage.removeItem('refreshToken');
//   localStorage.removeItem('accessToken');
  
//   // Only redirect if not already on login page
//   if (!window.location.pathname.includes('/login')) {
//     console.log('Redirecting to login page due to auth issue');
//     setTimeout(() => {
//       window.location.href = '/';
//     }, 100);
//   }
// };

// Add a request interceptor to include the auth token in requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    console.log('Token:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common response scenarios
apiClient.interceptors.response.use(
  (response) => {
    // Check if we got an HTML response instead of JSON (likely a redirect to login)
    if (isHtmlResponse(response)) {
      console.error('Received HTML response instead of JSON (likely auth issue)');
      // handleAuthError();
      return Promise.reject(new Error('Authentication required. Please log in again.'));
    }
    
    return response;
  },
  async (error) => {
    // Check for HTML in error response (auth redirect)
    if (error.response && isHtmlResponse(error.response)) {
      console.error('Received HTML error response (likely auth issue)');
      // handleAuthError();
      return Promise.reject(new Error('Authentication required. Please log in again.'));
    }
    
    const originalRequest = error.config;
    
    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.get('/api/auth/refresh-token', {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
            withCredentials: true,
          });
          
          const { token } = response.data;
          localStorage.setItem('token', token);
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, handle auth error
        // handleAuthError();
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 