import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Footer from './components/Footer.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import NavBar from './components/NavBar.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import SearchBar from './components/SearchBar.jsx';
import { useLoading } from './context/LoadingContext.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Orders = lazy(() => import('./pages/Orders.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Collection = lazy(() => import('./pages/Collection.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const PlaceOrder = lazy(() => import('./pages/PlaceOrder.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Product = lazy(() => import('./pages/Product.jsx'));
const Verify = lazy(() => import('./pages/Verify.jsx'));

function App() {
  const { loading } = useLoading();

  return (
    <div className='app-shell px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <ToastContainer />
      <ScrollToTop />
      <NavBar />
      <SearchBar />
      {loading && <LoadingSpinner />}

      <Suspense fallback={<div className='py-16 text-center muted-text'>Loading page...</div>}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/orders' element={<Orders />} />
          <Route path='/about' element={<About />} />
          <Route path='/collection' element={<Collection />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/login' element={<Login />} />
          <Route path='/place-order' element={<PlaceOrder />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/product/:productId' element={<Product />} />
          <Route path='/verify' element={<Verify />} />
        </Routes>
      </Suspense>

      <Footer />
    </div>
  );
}

export default App;
