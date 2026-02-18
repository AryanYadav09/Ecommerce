import NewsLetterBox from '../components/NewsLetterBox';
import Title from '../components/Title';
import { assets } from '../assets/assets';

const Contact = () => {
  return (
    <div className='ui-section'>
      <div className='text-center text-2xl pt-10 border-t border-white/10'>
        <Title text1={'CONTACT'} text2={'US'} />
      </div>

      <div className='my-10 grid md:grid-cols-[1fr_1fr] gap-8 mb-20 items-center'>
        <div className='ui-media rounded-2xl'>
          <img className='w-full h-full object-cover' src={assets.contact_img} alt="Contact" />
        </div>

        <div className='ui-card p-6 sm:p-8 flex flex-col gap-5'>
          <p className='font-semibold text-xl'>Our Store</p>
          <p className='muted-text'>44355 Willism Station, Suite 14, Uttar Pradesh</p>
          <p className='muted-text'>Tel: +91 48758 938989 <br />Email: contact@forever.com</p>

          <p className='font-semibold text-xl'>Careers at Forever</p>
          <p className='muted-text'>Learn more about open roles and join our growing team.</p>

          <button className='ui-button w-fit px-8 py-3 text-sm' type='button'>Contact Us</button>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  );
};

export default Contact;
