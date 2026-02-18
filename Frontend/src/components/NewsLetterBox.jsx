const NewsLetterBox = () => {
  const onSubmitHandler = (event) => {
    event.preventDefault();
  };

  return (
    <section className='ui-section my-16'>
      <div className='glass-panel text-center px-6 py-10 sm:px-10'>
        <p className='text-3xl sm:text-4xl'>Join The Style Loop</p>
        <p className='muted-text mt-3'>Get curated drops, restock alerts, and exclusive deals before anyone else.</p>

        <form onSubmit={onSubmitHandler} className='mt-7 w-full sm:w-4/5 lg:w-3/5 flex flex-col sm:flex-row items-center gap-3 mx-auto'>
          <input
            type="email"
            placeholder='Enter your email'
            className='ui-input w-full rounded-full px-5 py-3 text-sm'
            required
          />
          <button className='ui-button w-full sm:w-auto text-sm px-8 py-3'>SUBSCRIBE</button>
        </form>
      </div>
    </section>
  );
};

export default NewsLetterBox;
