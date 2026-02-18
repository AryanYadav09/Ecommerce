/* eslint-disable react/prop-types */
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { backendUrl } from '../config/constants.js';
import { useTheme } from '../context/ThemeContext.jsx';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      toast.dismiss();
      toast.error('Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${backendUrl}/api/user/admin`, {
        email: normalizedEmail,
        password
      });

      if (response.data.success && response.data.token) {
        setToken(response.data.token);
        navigate('/add');
      } else {
        toast.dismiss();
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-8'>
      <div className='admin-glass admin-fade-up w-full max-w-md px-6 sm:px-8 py-7 sm:py-8'>
        <div className='flex items-start justify-between gap-3 mb-6'>
          <div>
            <h1 className='text-3xl sm:text-4xl'>Welcome back</h1>
            <p className='muted-text mt-1 text-sm'>Sign in to your admin panel</p>
          </div>
          <button
            type='button'
            onClick={toggleTheme}
            className='admin-button-ghost text-xs px-3 py-1.5'
          >
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>

        <form onSubmit={onSubmitHandler} className='space-y-4'>
          <div>
            <p className='text-sm font-medium mb-2'>Email Address</p>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className='admin-input w-full px-3 py-2.5'
              type='email'
              placeholder='admin@email.com'
              required
            />
          </div>

          <div>
            <p className='text-sm font-medium mb-2'>Password</p>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className='admin-input w-full px-3 py-2.5'
              type='password'
              placeholder='Password'
              required
            />
          </div>

          <button
            className={`admin-button w-full py-2.5 mt-1 ${isSubmitting ? 'cursor-wait shine-animation' : ''}`}
            type='submit'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
