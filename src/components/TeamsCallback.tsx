// components/TeamsCallback.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { teamsService } from '../services/teamsService';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const TeamsCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const hasHandledCallback = useRef(false); // Prevent multiple executions

  useEffect(() => {
    // Prevent multiple callback handling
    if (hasHandledCallback.current) {
      console.log('🛑 Callback already handled, skipping...');
      return;
    }

    console.log('🔍 TeamsCallback mounted');
    console.log('📋 Current URL search params:', Object.fromEntries(searchParams.entries()));
    
    handleCallback();
  }, [searchParams]);

  const handleCallback = async () => {
    // Mark as handled immediately to prevent duplicates
    hasHandledCallback.current = true;
    
    try {
      console.log('🔄 Starting Teams callback handling...');
      
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const state = searchParams.get('state');

      console.log('📦 Callback parameters:', {
        code: code ? '✓ Present' : '✗ Missing',
        error,
        errorDescription,
        state: state ? '✓ Present' : '✗ Missing'
      });

      if (error) {
        console.error('❌ Microsoft returned error:', error, errorDescription);
        setStatus('error');
        setMessage(errorDescription || `Microsoft authentication failed: ${error}`);
        return;
      }

      if (!code) {
        console.error('❌ No authorization code received');
        setStatus('error');
        setMessage('No authorization code received from Microsoft. Please try again.');
        return;
      }

      console.log('🔄 Exchanging code for tokens...');
      const success = await teamsService.handleCallback(code);
      
      if (success) {
        console.log('✅ Teams connection successful!');
        setStatus('success');
        setMessage('Successfully connected to Microsoft Teams!');
        
        // Use replace instead of navigate to prevent going back to callback URL
        setTimeout(() => {
          console.log('🔄 Redirecting to teams integration page...');
          navigate('/teams-integration?success=true', { replace: true });
        }, 2000);
      } else {
        throw new Error('Failed to complete Teams connection');
      }
    } catch (error) {
      console.error('❌ Teams callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An unknown error occurred during Teams connection');
      
      setTimeout(() => {
        navigate(`/teams-integration?error=true&message=${encodeURIComponent(message)}`, { replace: true });
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        {status === 'loading' && (
          <>
            <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connecting to Teams...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete the connection process.
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Debug Info:</strong> Processing authentication...
              </p>
            </div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connection Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you back to the integration page...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/teams-integration', { replace: true })}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Return to Integration
              </button>
              <button
                onClick={() => {
                  // Clear everything and start fresh
                  sessionStorage.clear();
                  localStorage.clear();
                  window.location.href = '/teams-integration';
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Clear & Start Over
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamsCallback;