import { Link } from 'react-router-dom';
import { assets } from "../assets/assets.js";

const Hero = () => {
  return (
    <section className="ui-section">
      <div className="glass-panel overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 sm:p-10 lg:p-14 flex flex-col justify-center">
          <p className="text-xs sm:text-sm uppercase tracking-[0.28em] text-[var(--accent)] font-semibold">new season edit</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-tight mt-4">Dress Bold. Feel Unstoppable.</h1>
          <p className="mt-5 text-sm sm:text-base muted-text max-w-xl">
            Curated fashion drops with premium textures, vibrant details, and everyday comfort.
            Build your look with statement pieces that move with you.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/collection" className="ui-button px-6 py-3 text-sm">Shop Collection</Link>
            <Link to="/about" className="ui-button-ghost px-6 py-3 text-sm">Our Story</Link>
          </div>
        </div>

        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="ui-media rounded-2xl h-full min-h-[300px] md:min-h-[420px]">
            <img className='w-full h-full object-cover' src={assets.hero_img} alt="Hero" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
