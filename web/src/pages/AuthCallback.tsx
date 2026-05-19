import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate            = useNavigate();
  const { finalizeAuth }    = useAuth();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const finish = async () => {
      try {
        // Supabase injects the token from the email link into the URL hash.
        // getSession() resolves it automatically.
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.access_token) {
          setStatus('error');
          setMessage('Email verification failed or the link has expired. Please request a new confirmation email.');
          return;
        }

        setMessage('Setting up your account...');
        await finalizeAuth(session.access_token);

        toast.success('Email confirmed! Welcome to QUADS.', { duration: 3000 });
        navigate('/', { replace: true });
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.response?.data?.message || err?.message || 'Something went wrong. Please try logging in.');
      }
    };

    finish();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5ECD7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        backgroundColor: '#FFFDF7',
        border: '3px solid #1a1a1a',
        boxShadow: '8px 8px 0 0 #1a1a1a',
        padding: '48px 40px',
        maxWidth: 420,
        width: '90%',
        textAlign: 'center',
      }}>
        {/* Q logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{
            position: 'relative',
            width: 64, height: 64,
            border: '4px solid #1a1a1a',
            backgroundColor: '#FFFDF7',
            boxShadow: '5px 5px 0 0 #1a1a1a',
          }}>
            <div style={{ position: 'absolute', top: 12, left: 12, width: 28, height: 28, border: '7px solid #111' }} />
            <div style={{ position: 'absolute', bottom: 10, right: 10, width: 12, height: 6, backgroundColor: '#111', transform: 'rotate(45deg)' }} />
            <div style={{ position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF6B6B', border: '2px solid #1a1a1a' }} />
          </div>
        </div>

        {status === 'loading' ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#FF6B6B', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
              Email Verification
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 24 }}>
              {message}
            </div>
            <div style={{ width: '100%', height: 6, border: '2px solid #1a1a1a', backgroundColor: '#FFF5E6', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '65%', backgroundColor: '#FF6B6B' }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 16 }}>
              Verification Failed
            </div>
            <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.6, marginBottom: 28 }}>
              {message}
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: '#111', color: '#fff',
                border: '2px solid #1a1a1a', boxShadow: '4px 4px 0 0 #1a1a1a',
                padding: '14px 32px', fontSize: 12, fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: 1.5,
                cursor: 'pointer', width: '100%',
              }}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
