import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ApiResponse<T = any> = {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  message?: string;
};

// Enhanced error interface to properly type API errors
export interface ApiError extends Error {
  response?: {
    status: number;
    data: {
      status: string;
      error?: string;
      message?: string;
    };
  };
  isAxiosError?: boolean;
}

export type UserType = 'ecommerce' | 'logistics' | 'dropship';

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  usertype: UserType;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OtpPayload {
  identifier: string;
  type: 'EMAIL' | 'PHONE';
}

export interface VerifyOtpPayload extends OtpPayload {
  otp: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // Get the current origin
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      
      // Log the request details
      console.log('API Request:', {
        url: `${API_URL}${endpoint}`,
        method: options.method,
        origin,
      });

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Origin": origin,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          ...options.headers,
        },
      });

      // Parse response JSON first, regardless of status code
      const data = await response.json();
      
      // Log the complete response for debugging
      console.log('API Response:', {
        url: `${API_URL}${endpoint}`,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      });

      // If response is not ok, throw an error with the parsed error data
      if (!response.ok) {
        const error = new Error() as ApiError;
        error.response = {
          status: response.status,
          data: {
            status: 'error',
            error: data.error || data.message,
            message: data.message || data.error,
          },
        };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Request Error:', {
        error,
        endpoint,
        options,
      });

      // If error has response data, return it
      const apiError = error as ApiError;
      if (apiError.response?.data) {
        return {
          status: 'error' as const,
          error: apiError.response.data.error,
          message: apiError.response.data.message,
        };
      }
      
      // For network or parsing errors, return a generic error
      return {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        message: 'Failed to connect to the server. Please check your connection and try again.',
      };
    }
  }

  async register(payload: RegisterPayload) {
    console.log('Registering user:', payload);
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async login(payload: LoginPayload) {
    return this.request('/signin', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendOtp(payload: OtpPayload) {
    return this.request('/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifyOtp(payload: VerifyOtpPayload) {
    return this.request('/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new ApiClient();