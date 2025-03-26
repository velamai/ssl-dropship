const AUTH_TOKEN_KEY = 'auth_token';

export const auth = {
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  },

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

// Hook to check if user is authenticated on client side
export const useAuth = () => {
  const isAuthenticated = auth.isAuthenticated();
  
  return {
    isAuthenticated,
    login: auth.setToken,
    logout: auth.removeToken,
    getToken: auth.getToken
  };
}; 