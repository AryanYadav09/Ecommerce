import { useState, useContext } from 'react';
import NewsLetterBox from '../components/NewsLetterBox';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const Contact = () => {
  const { userProfile, createSupportTicket } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedCase, setSubmittedCase] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all support fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createSupportTicket(formData);
      if (res.success) {
        setSubmittedCase(res.case);
        toast.success('Support ticket synced with Salesforce CRM!');
        setFormData({
          name: userProfile?.name || '',
          email: userProfile?.email || '',
          subject: '',
          message: ''
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit support case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='ui-section'>
      <div className='text-center text-2xl pt-10 border-t border-white/10'>
        <Title text1={'CONTACT'} text2={'& SUPPORT'} />
        <p className='text-xs sm:text-sm text-gray-400 mt-1'>
          Connected with Salesforce CRM for real-time customer case management
        </p>
      </div>

      <div className='my-10 grid md:grid-cols-2 gap-8 mb-16 items-start'>
        {/* Contact Info Card */}
        <div className='flex flex-col gap-6'>
          <div className='ui-media rounded-2xl max-h-72 overflow-hidden'>
            <img className='w-full h-full object-cover' src={assets.contact_img} alt="Contact" />
          </div>

          <div className='ui-card p-6 flex flex-col gap-4'>
            <p className='font-semibold text-lg'>Flagship Store & HQ</p>
            <p className='muted-text text-sm'>44355 Willism Station, Suite 14, Uttar Pradesh, India</p>
            <p className='muted-text text-sm'>Tel: +91 48758 938989 <br />Email: support@forever.com</p>

            <div className='flex items-center gap-2 mt-2 pt-3 border-t border-white/10 text-xs text-blue-400'>
              <span className='w-2 h-2 rounded-full bg-blue-500 animate-ping' />
              <span>Salesforce Service Cloud CRM Active</span>
            </div>
          </div>
        </div>

        {/* Salesforce Support Form */}
        <div className='ui-card p-6 sm:p-8'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold'>Create Support Case</h3>
            <span className='text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30'>
              Salesforce Case
            </span>
          </div>

          {submittedCase && (
            <div className='mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm'>
              <p className='text-emerald-300 font-semibold mb-1'>✅ Support Case Created Successfully</p>
              <p className='text-xs text-gray-300'>
                CRM Tracking Ref: <span className='font-mono font-bold text-white'>{submittedCase.salesforce_case_id}</span>
              </p>
              <p className='text-xs muted-text mt-1'>Our team will review your inquiry and update you via email.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4 text-sm'>
            <div>
              <label className='block font-medium mb-1'>Your Name</label>
              <input
                type='text'
                name='name'
                value={formData.name}
                onChange={handleChange}
                placeholder='Full Name'
                required
                className='ui-input w-full px-4 py-2.5 rounded-lg'
              />
            </div>

            <div>
              <label className='block font-medium mb-1'>Email Address</label>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                placeholder='you@example.com'
                required
                className='ui-input w-full px-4 py-2.5 rounded-lg'
              />
            </div>

            <div>
              <label className='block font-medium mb-1'>Subject / Category</label>
              <input
                type='text'
                name='subject'
                value={formData.subject}
                onChange={handleChange}
                placeholder='e.g. Order Tracking, Size Exchange, Payment Inquiry'
                required
                className='ui-input w-full px-4 py-2.5 rounded-lg'
              />
            </div>

            <div>
              <label className='block font-medium mb-1'>Message Details</label>
              <textarea
                name='message'
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder='Describe your question or issue in detail...'
                required
                className='ui-input w-full px-4 py-2.5 rounded-lg resize-none'
              />
            </div>

            <button
              type='submit'
              disabled={submitting}
              className='ui-button w-full py-3 text-sm font-medium tracking-wide disabled:opacity-70'
            >
              {submitting ? 'Submitting to Salesforce CRM...' : 'Submit Support Case'}
            </button>
          </form>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  );
};

export default Contact;
