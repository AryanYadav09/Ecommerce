import { assets } from '../assets/assets';

const policyList = [
  {
    title: 'Easy Exchange',
    text: 'Quick, hassle-free exchange process designed around your schedule.',
    icon: assets.exchange_icon
  },
  {
    title: 'Flexible Returns',
    text: 'Enjoy a 7-day free return policy on eligible products.',
    icon: assets.quality_icon
  },
  {
    title: 'Priority Support',
    text: 'Get responsive customer support whenever you need help.',
    icon: assets.support_img
  }
];

const OurPolicy = () => {
  return (
    <section className='ui-section py-16'>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5'>
        {policyList.map((policy) => (
          <div key={policy.title} className='ui-card p-6 text-center'>
            <img className='w-12 m-auto mb-4' src={policy.icon} alt={policy.title} />
            <p className='font-semibold text-base'>{policy.title}</p>
            <p className='muted-text text-sm mt-2'>{policy.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OurPolicy;
