import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FaApple, FaEye, FaEyeSlash, FaGoogle, FaMicrosoft, FaPhoneAlt } from "react-icons/fa";
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from 'firebase/auth';
import { ShopContext } from '../context/ShopContext.jsx';
import { useLoading } from '../context/LoadingContext.jsx';
import { appleProvider, auth, googleProvider, microsoftProvider } from '../config/firebase.js';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidE164Phone = (value) => /^\+[1-9]\d{7,14}$/.test(value);

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);
  const { setLoading } = useLoading();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerOtp, setRegisterOtp] = useState('');
  const [isRegisterOtpSent, setIsRegisterOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [phoneMode, setPhoneMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneConfirmationResult, setPhoneConfirmationResult] = useState(null);

  const resetRegisterOtp = () => {
    setIsRegisterOtpSent(false);
    setRegisterOtp('');
  };

  const switchAuthState = () => {
    setCurrentState((prev) => prev === 'Login' ? 'Sign Up' : 'Login');
    setPhoneMode(false);
    resetRegisterOtp();
  };

  const completeLogin = (nextToken) => {
    setToken(nextToken);
    localStorage.setItem('token', nextToken);
    navigate('/');
  };

  const continueWithProviderToken = async (idToken) => {
    const response = await axios.post(backendUrl + '/api/user/social-login', { idToken });

    if (response.data.success && response.data.token) {
      completeLogin(response.data.token);
      return;
    }

    throw new Error(response.data.message || 'Authentication failed');
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (phoneMode) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      toast.dismiss();
      toast.error("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);

      if (currentState === 'Sign Up') {
        if (!isRegisterOtpSent) {
          const otpResponse = await axios.post(backendUrl + '/api/user/register/send-otp', { name, email: normalizedEmail, password });

          if (otpResponse.data.success) {
            setIsRegisterOtpSent(true);
            toast.dismiss();
            toast.success(otpResponse.data.message || 'OTP sent to your email');
          } else {
            toast.dismiss();
            toast.error(otpResponse.data.message || 'Failed to send OTP');
          }
        } else {
          const verifyOtp = registerOtp.trim();
          if (!/^\d{6}$/.test(verifyOtp)) {
            toast.dismiss();
            toast.error('Please enter a valid 6-digit OTP');
            return;
          }

          const response = await axios.post(backendUrl + '/api/user/register/verify-otp', { email: normalizedEmail, otp: verifyOtp });
          if (response.data.success && response.data.token) {
            completeLogin(response.data.token);
          } else {
            toast.dismiss();
            toast.error(response.data.message || 'Authentication failed');
          }
        }
      } else {
        const response = await axios.post(backendUrl + '/api/user/login', { email: normalizedEmail, password });
        if (response.data.success && response.data.token) {
          completeLogin(response.data.token);
        } else {
          toast.dismiss();
          toast.error(response.data.message || 'Authentication failed');
        }
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (providerKey) => {
    const providers = {
      google: googleProvider,
      apple: appleProvider,
      microsoft: microsoftProvider
    };

    try {
      setLoading(true);
      const provider = providers[providerKey];
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await continueWithProviderToken(idToken);
    } catch (error) {
      toast.dismiss();
      toast.error(error.code === 'auth/popup-closed-by-user' ? 'Login cancelled' : (error.message || 'Provider login failed'));
    } finally {
      setLoading(false);
    }
  };

  const getRecaptchaVerifier = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'phone-recaptcha-container', { size: 'invisible' });
    }
    return window.recaptchaVerifier;
  };

  const handleSendPhoneOtp = async () => {
    const normalizedPhone = phoneNumber.trim();
    if (!isValidE164Phone(normalizedPhone)) {
      toast.dismiss();
      toast.error('Use phone in international format, e.g. +14155552671');
      return;
    }

    try {
      setLoading(true);
      const appVerifier = getRecaptchaVerifier();
      const confirmationResult = await signInWithPhoneNumber(auth, normalizedPhone, appVerifier);
      setPhoneConfirmationResult(confirmationResult);
      toast.dismiss();
      toast.success('OTP sent to your phone');
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Failed to send phone OTP');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneConfirmationResult) {
      toast.dismiss();
      toast.error('Please request OTP first');
      return;
    }

    const code = phoneOtp.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.dismiss();
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const credential = await phoneConfirmationResult.confirm(code);
      const idToken = await credential.user.getIdToken();
      await continueWithProviderToken(idToken);
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const togglePhoneMode = () => {
    setPhoneMode((prev) => !prev);
    setCurrentState('Login');
    setPhoneNumber('');
    setPhoneOtp('');
    setPhoneConfirmationResult(null);
    resetRegisterOtp();
  };

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  return (
    <div className='ui-section min-h-[70vh] flex items-center justify-center py-8'>
      <div className='glass-panel w-full max-w-[430px] px-6 py-10 sm:px-10'>
        <h1 className='text-center text-4xl font-medium'>Welcome back</h1>

        {!phoneMode && (
          <form onSubmit={onSubmitHandler} className='mt-8 space-y-4'>
            {currentState === "Sign Up" && (
              <input
                onChange={(e) => {
                  setName(e.target.value);
                  if (isRegisterOtpSent) resetRegisterOtp();
                }}
                value={name}
                type="text"
                placeholder="Full name"
                className="ui-input w-full rounded-full px-5 py-3"
                required
              />
            )}

            <label className='block pl-5 text-sm text-[var(--accent-soft)]'>Email address</label>
            <input
              onChange={(e) => {
                setEmail(e.target.value);
                if (isRegisterOtpSent) resetRegisterOtp();
              }}
              value={email}
              type="email"
              className='ui-input w-full rounded-full px-5 py-3'
              required
            />

            <div className="relative w-full">
              <input
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (isRegisterOtpSent) resetRegisterOtp();
                }}
                value={password}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="ui-input w-full rounded-full px-5 py-3 pr-12"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 muted-text"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {currentState === "Sign Up" && isRegisterOtpSent && (
              <input
                onChange={(e) => setRegisterOtp(e.target.value)}
                value={registerOtp}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                className='ui-input w-full rounded-full px-5 py-3'
                required
              />
            )}

            <button className='ui-button w-full py-3 text-base' type='submit'>
              {currentState === 'Login' ? 'Continue' : (isRegisterOtpSent ? 'Verify OTP & Sign Up' : 'Continue')}
            </button>
          </form>
        )}

        {phoneMode && (
          <div className='mt-8 space-y-4'>
            <input
              onChange={(e) => setPhoneNumber(e.target.value)}
              value={phoneNumber}
              type="tel"
              placeholder="+14155552671"
              className='ui-input w-full rounded-full px-5 py-3'
            />
            <button onClick={handleSendPhoneOtp} className='ui-button w-full py-3 text-base' type='button'>
              Send OTP
            </button>

            {phoneConfirmationResult && (
              <>
                <input
                  onChange={(e) => setPhoneOtp(e.target.value)}
                  value={phoneOtp}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className='ui-input w-full rounded-full px-5 py-3'
                />
                <button onClick={handleVerifyPhoneOtp} className='ui-button w-full py-3 text-base' type='button'>
                  Verify & Continue
                </button>
              </>
            )}

            <p className='text-center text-xs muted-text'>Use international format with country code.</p>
          </div>
        )}

        <p className='mt-6 text-center text-sm'>
          {currentState === 'Login' ? "Don't have an account?" : "Already have an account?"}
          <button onClick={switchAuthState} type='button' className='ml-1 text-[var(--accent-soft)]'>
            {currentState === 'Login' ? 'Sign up' : 'Login'}
          </button>
        </p>

        <div className='my-6 flex items-center gap-4 text-sm muted-text'>
          <div className='h-px flex-1 bg-white/20' />
          <span>OR</span>
          <div className='h-px flex-1 bg-white/20' />
        </div>

        <div className='space-y-3'>
          <button onClick={() => handleProviderLogin('google')} className='ui-button-ghost flex w-full items-center gap-4 px-6 py-3 text-left' type='button'>
            <FaGoogle className='text-[#ea4335]' />
            <span>Continue with Google</span>
          </button>

          <button onClick={() => handleProviderLogin('apple')} className='ui-button-ghost flex w-full items-center gap-4 px-6 py-3 text-left' type='button'>
            <FaApple />
            <span>Continue with Apple</span>
          </button>

          <button onClick={() => handleProviderLogin('microsoft')} className='ui-button-ghost flex w-full items-center gap-4 px-6 py-3 text-left' type='button'>
            <FaMicrosoft className='text-[#00a4ef]' />
            <span>Continue with Microsoft</span>
          </button>

          <button onClick={togglePhoneMode} className='ui-button-ghost flex w-full items-center gap-4 px-6 py-3 text-left' type='button'>
            <FaPhoneAlt />
            <span>{phoneMode ? 'Continue with email' : 'Continue with phone'}</span>
          </button>
        </div>

        <div id="phone-recaptcha-container" className='hidden' />

        <p className='mt-10 text-center text-sm muted-text'>
          <a href="#" className='underline'>Terms of Use</a> <span className='mx-2'>|</span>
          <a href="#" className='underline'>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default Login
