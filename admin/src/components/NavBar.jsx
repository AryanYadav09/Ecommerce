/* eslint-disable react/prop-types */
import { assets } from '../assets/assets';
import { useTheme } from '../context/ThemeContext.jsx';

const NavBar = ({ setToken }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className='sticky top-0 z-40 px-4 sm:px-6 py-4'>
      <div className='admin-glass admin-fade-up px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-4'>
          <img className='w-32 sm:w-36' src={assets.logo} alt='admin logo' />
          <div className='hidden sm:block'>
            <p className='text-lg font-semibold'>Admin Dashboard</p>
            <p className='text-xs muted-text'>Manage products, inventory, and orders</p>
          </div>
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          <button
            type='button'
            onClick={toggleTheme}
            className='admin-button-ghost text-sm px-4 py-2'
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={() => setToken('')}
            className='admin-button text-sm px-5 py-2'
            type='button'
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
