import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets.js';

const menuItems = [
  { to: '/add', icon: assets.add_icon, label: 'Add Product' },
  { to: '/list', icon: assets.order_icon, label: 'Product List' },
  { to: '/orders', icon: assets.order_icon, label: 'Orders' }
];

const SideBar = () => {
  return (
    <aside className='w-full md:w-64 shrink-0'>
      <div className='admin-glass admin-fade-up p-3 sm:p-4 md:sticky md:top-24'>
        <p className='text-xs uppercase tracking-[0.2em] muted-text px-2 mb-2'>Navigation</p>
        <nav className='flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0'>
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `route-link min-w-fit whitespace-nowrap ${isActive ? 'route-link-active' : ''}`
              }
            >
              <img className='w-5 h-5 icon-asset' src={item.icon} alt={item.label} />
              <p className='text-sm font-medium'>{item.label}</p>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default SideBar;
