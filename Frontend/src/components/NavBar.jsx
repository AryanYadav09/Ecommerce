import { useContext, useState } from "react";
import { assets } from "../assets/assets.js";
import { Link, NavLink } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa";
import { ShopContext } from "../context/ShopContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const NavBar = () => {
  const [visible, setVisible] = useState(false);
  const {
    setShowSearchBar,
    getCartCount,
    navigate,
    token,
    setToken,
    setCartItems,
    userProfile
  } = useContext(ShopContext);

  const { isDark, toggleTheme } = useTheme();

  const logout = () => {
    navigate('/login');
    localStorage.removeItem('token');
    setToken('');
    setCartItems({});
    setVisible(false);
  };

  const toggleSearchBar = () => {
    setShowSearchBar((prev) => !prev);
  };

  const profileImage = token && userProfile?.avatar ? userProfile.avatar : assets.profile_icon;
  const iconDarkClass = isDark ? 'invert brightness-0' : '';
  const isDefaultProfileIcon = !token || !userProfile?.avatar;

  return (
    <header className="sticky top-3 z-40 py-2 mb-4 sm:mb-5">
      <div className="glass-panel px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to={'/'} className="flex items-center gap-2">
          <img src={assets.logo} className="w-32 sm:w-36" alt="logo" />
        </Link>

        <ul className="hidden sm:flex items-center gap-2 text-sm font-medium">
          <NavLink to="/" className="px-3 py-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors duration-200">
            HOME
          </NavLink>
          <NavLink to="/collection" className="px-3 py-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors duration-200">
            COLLECTION
          </NavLink>
          <NavLink to="/about" className="px-3 py-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors duration-200">
            ABOUT
          </NavLink>
          <NavLink to="/contact" className="px-3 py-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors duration-200">
            CONTACT
          </NavLink>
        </ul>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggleTheme}
            type="button"
            className="ui-button-ghost w-9 h-9 flex items-center justify-center"
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FaSun className="text-amber-400" /> : <FaMoon className="text-teal-700" />}
          </button>

          <button
            onClick={toggleSearchBar}
            type="button"
            className="ui-button-ghost w-9 h-9 flex items-center justify-center"
            aria-label="Search"
          >
            <img src={assets.search_icon} className={`w-4 ${iconDarkClass}`} alt="search" />
          </button>

          <div className="group relative">
            <img
              onClick={() => token ? null : navigate('/login')}
              src={profileImage}
              className={`${token ? 'w-9 h-9 rounded-full object-cover border border-white/30' : 'w-5'} ${isDefaultProfileIcon ? iconDarkClass : ''} cursor-pointer`}
              alt="profile"
            />

            {token && (
              <div className="group-hover:block hidden absolute right-0 pt-4 z-10">
                <div className="glass-panel flex flex-col gap-2 w-40 py-3 px-3 text-sm">
                  <p onClick={() => navigate('/profile')} className="cursor-pointer hover:text-[var(--accent-soft)]">My Profile</p>
                  <p onClick={() => navigate('/orders')} className="cursor-pointer hover:text-[var(--accent-soft)]">Orders</p>
                  <p onClick={logout} className="cursor-pointer hover:text-[var(--accent-alt)]">Log out</p>
                </div>
              </div>
            )}
          </div>

          <Link to="/cart" className="relative">
            <img src={assets.cart_icon} className={`w-5 min-w-5 ${iconDarkClass}`} alt="cart" />
            <p className="absolute right-[-6px] bottom-[-7px] w-4 text-center leading-4 bg-[var(--accent)] text-white rounded-full text-[9px]">
              {getCartCount()}
            </p>
          </Link>

          <button
            onClick={() => setVisible(true)}
            type="button"
            className="ui-button-ghost w-9 h-9 flex items-center justify-center sm:hidden"
            aria-label="Open Menu"
          >
            <img src={assets.menu_icon} className={`w-4 ${iconDarkClass}`} alt="menu" />
          </button>
        </div>
      </div>

      <div className={`fixed top-0 right-0 bottom-0 overflow-hidden transition-all duration-300 ${visible ? 'w-full' : 'w-0'}`}>
        <div className="absolute inset-0 bg-black/35" onClick={() => setVisible(false)} />

        <div className={`absolute top-0 right-0 h-full w-[78%] max-w-xs p-4 transition-transform duration-300 ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="glass-panel h-full p-4 flex flex-col text-sm font-medium">
            <button onClick={() => setVisible(false)} className="self-end ui-button-ghost px-3 py-1" type="button">
              Close
            </button>

            <NavLink onClick={() => setVisible(false)} className='py-3 border-b border-white/10' to='/'>HOME</NavLink>
            <NavLink onClick={() => setVisible(false)} className='py-3 border-b border-white/10' to='/collection'>COLLECTION</NavLink>
            <NavLink onClick={() => setVisible(false)} className='py-3 border-b border-white/10' to='/about'>ABOUT</NavLink>
            <NavLink onClick={() => setVisible(false)} className='py-3 border-b border-white/10' to='/contact'>CONTACT</NavLink>
            {token && <NavLink onClick={() => setVisible(false)} className='py-3 border-b border-white/10' to='/profile'>PROFILE</NavLink>}
            {token && <button onClick={logout} className='mt-4 ui-button' type='button'>Log out</button>}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
