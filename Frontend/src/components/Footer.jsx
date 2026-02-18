import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <footer className="ui-section mt-24 mb-8">
      <div className="glass-panel p-7 sm:p-10 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-10 text-sm">
        <div>
          <img src={assets.logo} className="mb-4 w-32" alt="logo" />
          <p className="max-w-md muted-text leading-6">
            Wear what moves you. We blend trend-forward styles with dependable comfort so your wardrobe
            feels elevated every single day.
          </p>
        </div>

        <div>
          <p className="text-base font-semibold mb-4">Company</p>
          <ul className="flex flex-col gap-2 muted-text">
            <li>Home</li>
            <li>About Us</li>
            <li>Delivery</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        <div>
          <p className="text-base font-semibold mb-4">Get In Touch</p>
          <ul className="flex flex-col gap-2 muted-text">
            <li>+1-223-223-4453</li>
            <li>contact@foreveryou.com</li>
          </ul>
        </div>

        <div className="col-span-full border-t border-white/15 pt-5 text-center muted-text">
          Copyright 2026 Forever.com. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
