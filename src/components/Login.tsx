import React, { useState } from 'react';
import { MessageSquare, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import Logo from '../assets/Logo.png';

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
    <div 
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{
        background: 'linear-gradient(135deg, #F0F5FC 0%, #E8F0FA 100%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-3">
            <img src={Logo} alt="Hapo Desk Logo" className="w-12 h-12 drop-shadow-lg" />
            <span className="text-2xl font-bold text-gray-900">Hapo Desk</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600 text-sm">Sign in to access your ServiceDesk portal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">
              {error === 'Email not confirmed' ? (
                <>
                  Your email has not been confirmed.{' '}
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="ml-2 text-[#5483B3] underline hover:text-[#3A5C80] disabled:opacity-50"
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

        {/* Success Message */}
        {resendSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <span className="text-green-700">
              A confirmation email has been sent to {formData.email}. Please check your inbox.
            </span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5483B3] focus:border-[#5483B3] sm:text-sm transition-colors duration-200"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5483B3] focus:border-[#5483B3] sm:text-sm transition-colors duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#5483B3] transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-white bg-[#5483B3] hover:bg-[#3A5C80] font-medium transition-all duration-200 shadow-md disabled:opacity-50 hover:shadow-lg transform hover:scale-105"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Switch to Sign Up */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-[#5483B3] hover:text-[#3A5C80] font-medium transition-colors duration-200"
          >
            Sign up
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;