import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import Logo from '../assets/Logo.png';

interface SignupProps {
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user',
    department: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessBox, setShowSuccessBox] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setShowSuccessBox(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { success, message } = await authService.signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department
      });

      if (success) {
        setSuccessMessage('Account created successfully! Please check your email to confirm your account before signing in.');
        setShowSuccessBox(true);
        // Clear form on success
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'user',
          department: ''
        });
      } else {
        setError(message);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12"
      style={{
        background: 'linear-gradient(135deg, #F0F5FC 0%, #E8F0FA 100%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8 space-y-6 border border-gray-100 mx-2 sm:mx-0"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img src={Logo} alt="Hapo Desk Logo" className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-lg" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900">Hapo Desk</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-1 sm:mt-2 text-gray-600 text-sm">Sign up to access your ServiceDesk portal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center space-x-2 sm:space-x-3 text-sm">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-red-700 text-xs sm:text-sm">{error}</span>
          </div>
        )}

        {/* Success Message Box */}
        {showSuccessBox && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-lg"
          >
            <div className="flex items-start sm:items-center space-x-2 sm:space-x-3">
              <div className="bg-green-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <Mail className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-green-800 text-base sm:text-lg">Check Your Email!</h3>
                <p className="text-green-700 text-xs sm:text-sm mt-0.5 sm:mt-1">
                  We've sent a confirmation link to your email address.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-100">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                  <p className="text-green-800 text-xs sm:text-sm font-medium">Next Steps:</p>
                  <ul className="text-green-700 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                    <li className="break-words">• Check your inbox for the confirmation email</li>
                    <li className="break-words">• Click the confirmation link in the email</li>
                    <li className="break-words">• Return here to sign in with your credentials</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={onSwitchToLogin}
              className="w-full bg-[#5483B3] text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-[#3A5C80] transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </motion.div>
        )}

        {/* Signup Form - Hide when success box is shown */}
        {!showSuccessBox && (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Name */}
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base transition-colors duration-200"
                />
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base transition-colors duration-200"
                />
              </div>

              {/* Role and Department in one row - Stack on mobile */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base transition-colors duration-200"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Department
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Department"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="sm:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#5483B3] transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="sm:col-span-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#5483B3] transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 sm:py-3 px-4 rounded-lg text-white bg-[#5483B3] hover:bg-[#3A5C80] font-medium transition-all duration-200 shadow-md disabled:opacity-50 hover:shadow-lg text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}

        {/* Switch to Login - Only show when not in success state */}
        {!showSuccessBox && (
          <p className="text-center text-xs sm:text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-[#5483B3] hover:text-[#3A5C80] font-medium transition-colors duration-200"
            >
              Sign in
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Signup;