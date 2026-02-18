import Title from '../components/Title.jsx';
import NewsLetterBox from '../components/NewsLetterBox.jsx';
import { assets } from '../assets/assets.js';

const About = () => {
  return (
    <div className='ui-section'>
      <div className='text-2xl text-center pt-8 border-t border-white/10'>
        <Title text1={'ABOUT'} text2={'US'} />
      </div>

      <div className='my-10 grid md:grid-cols-[1fr_1.2fr] gap-8 items-center'>
        <div className='ui-media rounded-2xl'>
          <img className='w-full h-full object-cover' src={assets.about_img} alt="About" />
        </div>

        <div className='ui-card p-6 sm:p-8 flex flex-col gap-5 muted-text leading-7'>
          <p>
            We are building a fashion destination where trend, comfort, and confidence meet.
            Every collection is selected for quality materials, flattering cuts, and effortless styling.
          </p>
          <p>
            From daily essentials to statement pieces, we keep our catalog fresh so your wardrobe keeps evolving.
            Our focus stays simple: make online fashion shopping feel premium and personal.
          </p>
          <b className='text-base text-inherit'>Our Mission</b>
          <p>
            Empower every customer to express their style through dependable quality, fair pricing,
            and an elevated shopping experience from first click to doorstep delivery.
          </p>
        </div>
      </div>

      <div className='text-xl py-4'>
        <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className='grid md:grid-cols-3 gap-4 mb-20'>
        <div className='ui-card p-6 sm:p-8 flex flex-col gap-4'>
          <b>Quality Assurance</b>
          <p className='muted-text'>Strict quality checks for every product before it reaches you.</p>
        </div>
        <div className='ui-card p-6 sm:p-8 flex flex-col gap-4'>
          <b>Convenient Shopping</b>
          <p className='muted-text'>Smooth browsing, secure checkout, and quick order updates.</p>
        </div>
        <div className='ui-card p-6 sm:p-8 flex flex-col gap-4'>
          <b>Customer-First Support</b>
          <p className='muted-text'>Friendly support team that resolves issues without delays.</p>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  );
};

export default About;
