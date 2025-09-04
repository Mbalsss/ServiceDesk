import React, { useState } from 'react';
import { MessageSquare, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface SignupProps {
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user' | 'technician',
    department: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

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
        setSuccessMessage(message);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 text-sm">{successMessage}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input
            name="name"
            type="text"
            placeholder="Full Name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="user">User</option>
            <option value="technician">Technician</option>
            <option value="admin">Admin</option>
          </select>
          <input
            name="department"
            type="text"
            placeholder="Department (optional)"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <div className="relative">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-2"
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="text-center mt-2">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
