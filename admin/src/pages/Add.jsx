/* eslint-disable react/prop-types */
import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import { backendUrl } from '../config/constants.js';

const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'];

const Add = ({ token }) => {
  const [image1, setImage1] = React.useState(false);
  const [image2, setImage2] = React.useState(false);
  const [image3, setImage3] = React.useState(false);
  const [image4, setImage4] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [category, setCategory] = React.useState('Men');
  const [subCategory, setSubCategory] = React.useState('Topwear');
  const [bestseller, setBestseller] = React.useState(false);
  const [sizes, setSizes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Product name is required.';
    if (!description.trim()) newErrors.description = 'Product description is required.';
    if (!price) newErrors.price = 'Product price is required.';
    return newErrors;
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setImage1(false);
    setImage2(false);
    setImage3(false);
    setImage4(false);
    setSizes([]);
    setBestseller(false);
    setCategory('Men');
    setSubCategory('Topwear');
  };

  const toggleSize = (size) => {
    setSizes((prev) => (prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size]));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.dismiss();
      toast.error('Please fill in all required fields.');
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('subCategory', subCategory);
      formData.append('bestseller', bestseller);
      formData.append('sizes', JSON.stringify(sizes));

      if (image1) formData.append('image1', image1);
      if (image2) formData.append('image2', image2);
      if (image3) formData.append('image3', image3);
      if (image4) formData.append('image4', image4);

      const response = await axios.post(`${backendUrl}/api/product/add`, formData, {
        headers: { token }
      });

      if (response.data.success) {
        toast.dismiss();
        toast.success(response.data.message);
        resetForm();
      } else {
        toast.dismiss();
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const imageTiles = [
    { id: 'image1', file: image1, setFile: setImage1 },
    { id: 'image2', file: image2, setFile: setImage2 },
    { id: 'image3', file: image3, setFile: setImage3 },
    { id: 'image4', file: image4, setFile: setImage4 }
  ];

  return (
    <section className='admin-fade-up'>
      <div className='mb-5'>
        <h2 className='text-2xl sm:text-3xl'>Add Product</h2>
        <p className='muted-text text-sm mt-1'>Create a new product listing with pricing and availability.</p>
      </div>

      <form id='form' onSubmit={onSubmitHandler} className='space-y-5'>
        <div>
          <p className='mb-2 font-medium'>Upload Images</p>
          <div className='stagger-grid grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {imageTiles.map((tile) => (
              <label key={tile.id} htmlFor={tile.id} className='upload-tile cursor-pointer admin-card'>
                <img
                  className='w-full h-full object-cover'
                  src={!tile.file ? assets.upload_area : URL.createObjectURL(tile.file)}
                  alt='product upload'
                />
                <input
                  onChange={(e) => tile.setFile(e.target.files[0])}
                  type='file'
                  id={tile.id}
                  hidden
                />
              </label>
            ))}
          </div>
        </div>

        <div className='admin-panel p-4 sm:p-5 space-y-4'>
          <div>
            <p className='mb-2 font-medium'>Product Name</p>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className={`admin-input w-full px-3 py-2.5 ${errors.name ? 'border-red-500' : ''}`}
              type='text'
              placeholder='Type here'
            />
            {errors.name && <span className='text-red-400 text-sm'>{errors.name}</span>}
          </div>

          <div>
            <p className='mb-2 font-medium'>Product Description</p>
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              className={`admin-input w-full px-3 py-2.5 min-h-28 ${errors.description ? 'border-red-500' : ''}`}
              placeholder='Write description'
            />
            {errors.description && <span className='text-red-400 text-sm'>{errors.description}</span>}
          </div>

          <div className='grid sm:grid-cols-3 gap-4'>
            <div>
              <p className='mb-2 font-medium'>Category</p>
              <select
                onChange={(e) => setCategory(e.target.value)}
                className='admin-input w-full px-3 py-2.5'
                value={category}
              >
                <option value='Men'>Men</option>
                <option value='Women'>Women</option>
                <option value='Kids'>Kids</option>
              </select>
            </div>

            <div>
              <p className='mb-2 font-medium'>Sub Category</p>
              <select
                onChange={(e) => setSubCategory(e.target.value)}
                className='admin-input w-full px-3 py-2.5'
                value={subCategory}
              >
                <option value='Topwear'>Topwear</option>
                <option value='Winterwear'>Winterwear</option>
                <option value='Bottomwear'>Bottomwear</option>
              </select>
            </div>

            <div>
              <p className='mb-2 font-medium'>Price</p>
              <input
                onChange={(e) => setPrice(e.target.value)}
                value={price}
                className={`admin-input w-full px-3 py-2.5 ${errors.price ? 'border-red-500' : ''}`}
                type='number'
                placeholder='Price'
              />
              {errors.price && <span className='text-red-400 text-sm'>{errors.price}</span>}
            </div>
          </div>

          <div>
            <p className='mb-2 font-medium'>Sizes</p>
            <div className='flex flex-wrap gap-2'>
              {sizeOptions.map((size) => (
                <button
                  type='button'
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    sizes.includes(size)
                      ? 'border-transparent bg-emerald-500/85 text-white'
                      : 'border-[var(--border)] bg-[var(--surface-strong)]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <label htmlFor='bestseller' className='flex items-center gap-2 cursor-pointer w-fit'>
            <input
              onChange={() => setBestseller((prev) => !prev)}
              checked={bestseller}
              type='checkbox'
              id='bestseller'
              className='w-4 h-4'
            />
            <span className='text-sm'>Add to bestseller</span>
          </label>
        </div>

        <button
          type='submit'
          className={`admin-button px-8 py-3 ${loading ? 'cursor-not-allowed shine-animation' : ''}`}
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
    </section>
  );
};

export default Add;
