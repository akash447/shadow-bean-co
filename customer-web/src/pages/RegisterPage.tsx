import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '';

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', 'register');
    if (redirectTo) params.set('redirect', redirectTo);
    navigate(`/login?${params.toString()}`, { replace: true });
  }, [navigate, redirectTo]);

  return null;
}
