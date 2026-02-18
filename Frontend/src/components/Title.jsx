/* eslint-disable react/prop-types */
const Title = ({ text1, text2 }) => {
  return (
    <div className='inline-flex gap-3 items-center mb-3'>
      <p className='uppercase text-xs tracking-[0.2em] muted-text'>{text1}</p>
      <p className='text-lg sm:text-xl font-semibold'>{text2}</p>
      <span className='w-10 sm:w-14 h-[2px] rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-alt)]' />
    </div>
  );
};

export default Title;
