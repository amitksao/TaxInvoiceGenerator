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
  const { data: user, isLoading, refetch } = useQuery({
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
    staleTime: 0, // Always refetch when needed
    gcTime: 0, // Don't cache
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
      // Force page reload to enter application
      window.location.reload();
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
      // Force page reload to enter application
      window.location.reload();
    },
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    queryClient.clear();
    window.location.reload();
  };

  // Handle token changes and force user data refetch
  useEffect(() => {
    if (token) {
      // Token is available - force immediate user data fetch
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
    }
  }, [token, queryClient]);

  return {
    user,
    isLoading: (isLoading && !!token) || loginMutation.isPending || registerMutation.isPending,
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