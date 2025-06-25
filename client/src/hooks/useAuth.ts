import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken');
  });

  const queryClient = useQueryClient();

  // Get current user data
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
          setToken(null);
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      return data.user;
    },
    enabled: !!token,
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    queryClient.clear();
    window.location.reload();
  };

  // Set up request interceptor for authenticated requests
  useEffect(() => {
    if (token) {
      // Update the global query client to include auth header
      queryClient.setDefaultOptions({
        queries: {
          queryFn: async ({ queryKey }) => {
            const response = await fetch(queryKey[0] as string, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (!response.ok) {
              if (response.status === 401 || response.status === 403) {
                logout();
                throw new Error('Unauthorized');
              }
              throw new Error(`${response.status}: ${response.statusText}`);
            }
            
            return response.json();
          },
        },
      });
    }
  }, [token, queryClient]);

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user && !!token,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}