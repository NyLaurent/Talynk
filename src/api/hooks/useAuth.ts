import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services';

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      console.log('Login success:', data);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      console.log('Register success:', data);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => {
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear all queries from the cache
      queryClient.clear();
    },
  });
};

interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  role: string;
}

export const useSignup = () => {
  return useMutation({
    mutationFn: (credentials: SignupCredentials) => {
      return authService.register(credentials);
    },
  });
}; 