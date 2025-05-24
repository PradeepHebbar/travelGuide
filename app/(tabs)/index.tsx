import { useEffect } from 'react';
import { useRouter, useNavigationContainerRef } from 'expo-router';

export default function RedirectHome() {
  const router = useRouter();

  useEffect(() => {
    // Delay until after mount to avoid layout crash
    setTimeout(() => {
      router.replace('/homePage');
    }, 0);
  }, []);

  return null;
}
