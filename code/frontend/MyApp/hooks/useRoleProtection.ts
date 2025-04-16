import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * Hook to protect routes based on user role
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns {Object} - Loading state and user role
 */
export default function useRoleProtection(allowedRoles: string[]) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if user is authenticated
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found, redirecting to login');
          router.replace('/login');
          return;
        }

        // Get user's role
        const role = await AsyncStorage.getItem('userRole');
        console.log('User role:', role);
        setUserRole(role);

        // If no allowed roles specified or user's role is allowed, grant access
        if (
          !allowedRoles.length ||
          !role ||
          allowedRoles.includes(role)
        ) {
          setIsLoading(false);
          return;
        }

        // If user's role is not allowed, redirect based on their role
        Alert.alert(
          'Access Denied',
          'You do not have permission to access this page.'
        );
        
        // Redirect to appropriate home screen based on role
        switch (role) {
          case 'admin':
            console.log('Redirecting unauthorized admin to admin home');
            router.replace('/adminHomeScreen');
            break;
          case 'doctor':
            console.log('Redirecting unauthorized doctor to doctor home');
            router.replace('/doctorHomeScreen');
            break;
          default:
            console.log('Redirecting unauthorized user to user home');
            router.replace('/homeScreen');
        }
      } catch (error) {
        console.error('Error checking role access:', error);
        router.replace('/login');
      }
    };

    checkAccess();
  }, [router, allowedRoles]);

  return { isLoading, userRole };
}
