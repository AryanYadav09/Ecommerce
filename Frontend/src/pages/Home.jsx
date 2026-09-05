import Hero from '../components/Hero';
import LatestCollection from '../components/LatestCollection.jsx';
import BestSellers from '../components/BestSellers.jsx';
import OurPolicy from '../components/OurPolicy.jsx';
import NewsLetterBox from '../components/NewsLetterBox.jsx';
import AiRecommendations from '../components/AiRecommendations.jsx';

const Home = () => {
  return (
    <div className='space-y-6'>
      <Hero />
      <LatestCollection />
      <AiRecommendations
        title='RECOMMENDED FOR YOU'
        subtitle='Curated specifically for your taste by our hybrid AI recommendation system'
      />
      <BestSellers />
      <OurPolicy />
      <NewsLetterBox />
    </div>
  );
};

export default Home;
