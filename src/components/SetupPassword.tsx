import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, CheckCircle, XCircle, Loader, Mail, Shield } from 'lucide-react';

const SetupPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Color scheme matching your design system
  const colors = {
    primary: '#5483B3',      // Brand Blue
    primaryLight: '#7BA4D0', // Light Blue
    secondary: '#5AB8A8',    // Teal
    accent: '#D0857B',       // Red
    dark: '#3A5C80',         // Dark Blue
    gray: '#607d8b',         // Gray
    background: '#F0F5FC',   // Light Blue Background
    success: '#5AB8A8',      // Teal for success
    warning: '#D0857B',      // Red for warnings
  };

  useEffect(() => {
    // Check if we have tokens in the URL
    processInvitation();
  }, [searchParams]);

  const processInvitation = async () => {
    try {
      setIsProcessing(true);
      
      // Check if we're coming from an invitation with tokens
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      console.log('🔑 Token analysis:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type: type,
        hashLength: window.location.hash.length
      });

      // If no tokens in hash, check if user is already authenticated
      if (!accessToken) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User error:', userError);
          setError('Please use the invitation link from your email to access this page.');
          return;
        }

        if (user) {
          // User is already authenticated (maybe they refreshed the page)
          setUserEmail(user.email);
          console.log('✅ User already authenticated:', user.email);
          return;
        }

        setError('No authentication tokens found. Please use the invitation link from your email.');
        return;
      }

      // We have tokens - try to authenticate
      await handleTokenAuthentication(accessToken, refreshToken, type);
      
    } catch (err: any) {
      console.error('❌ Error processing invitation:', err);
      setError(err.message || 'Failed to process invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTokenAuthentication = async (accessToken: string, refreshToken: string | null, type: string | null) => {
    try {
      console.log('🔐 Setting session with tokens...');
      
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      });

      if (error) {
        throw new Error(`Authentication failed: ${error.message}`);
      }

      // Get user info
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Could not retrieve user information');
      }

      setUserEmail(user.email);
      console.log('✅ User authenticated:', user.email);

      // Clear the URL hash to remove tokens from address bar
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      
    } catch (err: any) {
      console.error('❌ Token authentication error:', err);
      throw err;
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Verify we have a user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Your session has expired. Please use the invitation link again.');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Password updated successfully');
      setSuccess(true);

      // Redirect to landing page after success
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err: any) {
      console.error('❌ Password setup error:', err);
      setError(err.message || 'Failed to set up password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = () => alert('Please contact your administrator for a new invitation.');
  const handleRetry = () => {
    setError(null);
    processInvitation();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F5FC] to-[#E1EBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-[#f0f9f8] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#5AB8A8]">
              <CheckCircle className="w-10 h-10 text-[#5AB8A8]" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Password Set Successfully!</h2>
            <p className="text-gray-600 mb-6">Your account has been set up and you'll be redirected to the home page shortly.</p>
            <div className="flex justify-center">
              <Loader className="w-8 h-8 animate-spin text-[#5483B3]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F5FC] to-[#E1EBF7] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-[#F0F5FC] rounded-xl flex items-center justify-center border border-[#7BA4D0]">
              <Shield className="w-8 h-8 text-[#5483B3]" />
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {error ? 'Setup Issue' : 'Set Up Your Password'}
            </h1>
            <p className="text-gray-600 text-lg">
              {error 
                ? 'There was an issue with your invitation link' 
                : userEmail 
                  ? `Welcome! Create a password for your account`
                  : 'Create a password for your account'
              }
            </p>
            {userEmail && (
              <div className="mt-4 bg-[#F0F5FC] border border-[#7BA4D0] rounded-xl p-4 inline-block">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-[#5483B3]" />
                  <p className="text-[#3A5C80] font-medium text-sm">
                    {userEmail}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-start">
                <XCircle className="w-6 h-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-red-800 font-semibold text-lg mb-2">Unable to Proceed</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={handleRetry} 
                      className="flex items-center justify-center text-red-800 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors font-medium border border-red-200"
                    >
                      <Loader className="w-4 h-4 mr-2" />
                      Retry Connection
                    </button>
                    <button 
                      onClick={handleRequestNewLink}
                      className="flex items-center justify-center text-red-800 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors font-medium border border-red-200"
                    >
                      Request New Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isProcessing && !error && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#F0F5FC] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#7BA4D0]">
                <Loader className="w-8 h-8 animate-spin text-[#5483B3]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your Invitation</h3>
              <p className="text-gray-600">Setting up your account...</p>
            </div>
          )}

          {/* Password Form */}
          {!isProcessing && !error && userEmail && (
            <form className="space-y-6" onSubmit={handleSetupPassword}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors hover:border-gray-400"
                    placeholder="Enter your password"
                    minLength={6}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-2">Must be at least 6 characters long</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors hover:border-gray-400"
                    placeholder="Confirm your password"
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-br from-[#5483B3] to-[#3A5C80] text-white py-4 px-6 rounded-xl flex items-center justify-center space-x-3 disabled:from-gray-300 disabled:to-gray-400 hover:from-[#4A76A0] hover:to-[#2E4A6B] transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {loading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
                <span>{loading ? 'Setting Up Password...' : 'Set Password & Continue'}</span>
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  By continuing, you agree to our terms of service
                </p>
              </div>
            </form>
          )}

          {/* Security Tips */}
          {!isProcessing && !error && userEmail && (
            <div className="mt-6 p-4 bg-[#F0F5FC] rounded-xl border border-[#7BA4D0]">
              <h4 className="font-semibold text-[#3A5C80] mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Password Tips
              </h4>
              <ul className="text-sm text-[#5483B3] space-y-1">
                <li>• Use at least 6 characters</li>
                <li>• Include numbers and special characters</li>
                <li>• Avoid common words or phrases</li>
              </ul>
            </div>
          )}

          {/* Footer Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Need help? Contact your administrator for support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPassword;