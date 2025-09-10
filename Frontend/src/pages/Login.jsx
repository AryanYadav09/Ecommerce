import React, { useEffect, useState } from 'react'
import { useContext } from 'react';
import { ShopContext } from '../context/ShopContext.jsx';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from "react-icons/fa"; // ✅ Import eye icons



const Login = () => {

  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false); // ✅ State for toggling password visibility
  const [isForgotPassword, setIsForgotPassword] = useState(false);


  const handleForgotPassword = async () => {
    try {
      const response = await axios.post(backendUrl + "/api/user/forgot-password", { email });

      if (response.data.success) {
        toast.dismiss();
        toast.success("Reset link sent to your email!");
        setIsForgotPassword(false); // Switch back to login mode
      } else {
        toast.dismiss();
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to send reset link");
    }
  };



  const onSubmitHandler = async (event) => {
    event.preventDefault()
    if (isForgotPassword) {
      handleForgotPassword();
      return;
    }

    try {
      if (currentState === 'Sign Up') {


        const response = await axios.post(backendUrl + '/api/user/register', { name, email, password });
        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
        } else {
          toast.dismiss();
          toast.error(response.data.message)
        }

      } else {

        const response = await axios.post(backendUrl + '/api/user/login', { email, password });
        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)


        } else {
          toast.dismiss();
          toast.error(response.data.message)
        }


      }

    } catch (error) {
      console.log(error)
      toast.dismiss();
      toast.error(error.message)

    } finally {
      setLoading(false);
    }

  }

  useEffect(() => {
    if (token) {
      navigate('/');

    }
  }, [token])



  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800' >

      <div className='inline-flex items-center gap-2 mb-2 mt-10' >
        <p className='prata-regular text-3xl' >{isForgotPassword ? "Forgot Password" : currentState}</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />

      </div>
      {/* username input  */}
      {
        isForgotPassword ? (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-800"
              required
            />
            <button type="submit" className="bg-black text-white font-light px-8 py-2 mt-4">
              Send Reset Link
            </button>
            <p onClick={() => setIsForgotPassword(false)} className="cursor-pointer text-sm mt-2">
              Back to Login
            </p>
          </>
        ) : (
          <>
            {currentState === "Sign Up" && (
              <input onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder="Username" className="w-full px-3 py-2 border border-gray-800" required />
            )}
            {/* email input  */}

      <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder='Email' className='w-full px-3 py-2 border border-gray-800' required />
              {/* password input  */}

              <div className="relative w-full">
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  type={showPassword ? "text" : "password"} // ✅ Toggle between text/password
                  placeholder="Password"
                  className="w-full px-3 py-2 border border-gray-800 pr-10"
                  required
                />
                <span
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />} {/* ✅ Show/Hide Eye Icon */}
                </span>
              </div>

              {/* login/signup switch and forget password  */}

              <div className="w-full flex justify-between text-sm mt-[-8px]">
                {currentState === "Login" && (
                  <p onClick={() => setIsForgotPassword(true)} className="cursor-pointer text-gray-600">
                    Forgot Your Password?
                  </p>
                )}
                <p onClick={() => setCurrentState(currentState === "Login" ? "Sign Up" : "Login")} className="cursor-pointer">
                  {currentState === "Login" ? "Create Account" : "Login Here"}
                </p>
      </div>

              {/* submit button  */}

      <button className='bg-black text-white font-light px-8 py-2 mt-4' >{currentState === 'Login' ? 'Sign in' : 'Sign Up'}</button>
          </>)}
    </form>
  )
}

export default Login
