import React, { useContext, useState } from "react";
import { assets } from "../assets/assets.js";
import { NavLink, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext.jsx";

const NavBar = () => {
  const  [visible, setVisible] = useState(false);
  const [showPopUp, setShowPopUp] = useState(false); 
  const {setShowSearchBar, getCartCount,navigate, token, setToken} = useContext(ShopContext)


  const logout = () => {
    navigate('/login');
    localStorage.removeItem('token')
    setToken('')
    // setCartItems({});
  }

  return (
    <div className="flex items-center justify-between py-5 font-medium">
       <Link to={'/'} ><img src={assets.logo} className="w-36" alt="" /></Link> 
      <ul className="hidden sm:flex gap-5 text-sm text-grey-700">
        <NavLink to="/" className="flex flex-col items-center gap-1">
          <p>HOME</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/collection" className="flex flex-col items-center gap-1">
          <p>COLLECTIONS</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/about" className="flex flex-col items-center gap-1">
          <p>ABOUT</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/contact" className="flex flex-col items-center gap-1">
          <p>CONTACT</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
      </ul>

      <div className="flex items-center gap-6">
        <img onClick={()=> setShowSearchBar(true)} src={assets.search_icon} className="w-5 cursor-pointer" alt="" />

        <div className="group relative">
           
            <img onClick={()=> token? null : navigate('/login')}
            src={assets.profile_icon}
            className="w-5 cursor-pointer"
            alt=""
          /> 
          {token && <div className="group-hover:block hidden absolute dropdown-menu right-0 pt-4">
            <div className="flex flex-col gap-2 w-36 py-5 pl-3 bg-slate-100 text-gray-500 rounded">
              <p onClick={() => setShowPopUp(true)} className="cursor-pointer hover:text-black ">My Profile</p>
              <p onClick={()=> navigate('/orders')} className="cursor-pointer hover:text-black ">Orders</p>
              <p onClick={()=> logout()} className="cursor-pointer hover:text-black ">LogOut</p>
            </div>
          </div>}
        </div>
        <Link to="/cart" className="relative">
          <img src={assets.cart_icon} className="w-5 min-w-5" alt="" />
          <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
            {getCartCount()}
          </p>
        </Link>
        <img onClick={()=> setVisible(true) } src={assets.menu_icon} className="w-5 cursor-pointer sm:hidden" alt="" />
      </div>
      {/* side bar menu for small screen devices */}

      <div className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${visible? 'w-full': 'w-0'} `} >
          <div className="flex flex-col text-gray-600" >
            <div onClick={()=>setVisible(false)} className="flex items-center gap-4 p-3 cursor-pointer" >
              <img className="h4 rotate-180" src={assets.dropdown_icon} alt="" />
              <p>Back</p>

            </div>
            <NavLink onClick={()=>setVisible(false)}  className='py-2 pl-6 border' to='/' >HOME</NavLink>
            <NavLink onClick={()=>setVisible(false)}  className='py-2 pl-6 border' to='/collection' >COLLECTION</NavLink>
            <NavLink onClick={()=>setVisible(false)}  className='py-2 pl-6 border' to='/about' >ABOUT</NavLink>
            <NavLink onClick={()=>setVisible(false)}  className='py-2 pl-6 border' to='/contact' >CONTACT</NavLink>


          </div>
      </div>
      {/* ✅ "Coming Soon" Popup */}
      {showPopUp && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded-lg text-center">
            <p className="text-lg font-semibold">🚀 Coming Soon!</p>
            <p className="text-sm text-gray-600">This feature will be available soon.</p>
            <button onClick={() => setShowPopUp(false)} className="mt-3 px-4 py-2 bg-black text-white rounded">
              Close
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default NavBar;
