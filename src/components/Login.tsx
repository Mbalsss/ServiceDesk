import React, { useState } from 'react';
import { MessageSquare, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginProps {
  onLogin: (user: { id: string; name: string; email: string; role: 'admin' | 'user' | 'technician'; department?: string }) => void;
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendSuccess(false);
    setLoading(true);

    try {
      const { user, error: loginError } = await authService.signIn(formData);

      if (loginError) {
        if (loginError.toLowerCase().includes('email')) {
          setError('Email not confirmed');
        } else {
          setError(loginError);
        }
      } else if (user) {
        onLogin(user);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      const { success, error: resendError } = await authService.resendConfirmationEmail(formData.email);
      if (success) {
        setResendSuccess(true);
      } else {
        setError(resendError || 'Failed to resend confirmation email.');
      }
    } catch (err) {
      console.error('Resend confirmation error:', err);
      setError('An error occurred while resending the confirmation email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to ServiceDesk Plus
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your IT service management portal
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 text-sm">
                {error === 'Email not confirmed' ? (
                  <>
                    Your email has not been confirmed.{' '}
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resendLoading}
                      className="ml-2 text-blue-700 underline hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendLoading ? 'Sending...' : 'Resend confirmation email'}
                    </button>
                  </>
                ) : (
                  error
                )}
              </span>
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm">
                A confirmation email has been sent to {formData.email}. Please check your inbox.
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
