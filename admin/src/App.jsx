import { useEffect, useState } from 'react';
import axios from 'axios';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Login from './components/Login.jsx';
import NavBar from './components/NavBar.jsx';
import SideBar from './components/SideBar.jsx';
import Orders from './pages/Orders.jsx';
import Add from './pages/Add.jsx';
import List from './pages/List.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import { ADMIN_TOKEN_KEY, backendUrl } from './config/constants.js';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    let isMounted = true;

    const verifyAdminToken = async () => {
      if (!token) {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
        return;
      }

      if (isMounted) {
        setIsCheckingAuth(true);
      }

      try {
        const response = await axios.post(
          `${backendUrl}/api/user/admin/verify`,
          {},
          { headers: { token } }
        );

        if (!response.data.success && isMounted) {
          setToken('');
        }
      } catch {
        if (isMounted) {
          setToken('');
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    verifyAdminToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      return;
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }, [token]);

  if (isCheckingAuth) {
    return (
      <div className='admin-shell min-h-screen flex items-center justify-center p-4'>
        <div className='admin-glass admin-fade-up px-8 py-6 text-center'>
          <p className='text-lg font-semibold'>Checking admin session...</p>
          <p className='text-sm muted-text mt-1'>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className='admin-shell'>
      <ToastContainer
        theme={isDark ? 'dark' : 'light'}
        position='top-right'
        autoClose={2200}
      />

      {token === '' ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <NavBar setToken={setToken} />
          <div className='flex flex-col md:flex-row gap-4 md:gap-5 px-4 sm:px-6 pb-8'>
            <SideBar />
            <main className='flex-1 admin-fade-up'>
              <div className='admin-glass min-h-full p-4 sm:p-6'>
                <Routes>
                  <Route path='/' element={<Navigate to='/add' replace />} />
                  <Route path='/add' element={<Add token={token} />} />
                  <Route path='/list' element={<List token={token} />} />
                  <Route path='/orders' element={<Orders token={token} />} />
                  <Route path='*' element={<Navigate to='/add' replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
