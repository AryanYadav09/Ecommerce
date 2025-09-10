import React from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

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

  // This function validates the form and returns an object containing errors.
  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = "Product name is required.";
    }
    if (!description.trim()) {
      newErrors.description = "Product description is required.";
    }
    if (!price) {
      newErrors.price = "Product price is required.";
    }
    // You can add further validations here (e.g. image upload check)
    return newErrors;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Run the validations first
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.dismiss();
      toast.error("Please fill in all required fields.");
      return;
    }
    // If there are no errors, clear any previous errors.
    setErrors({});

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("sizes", JSON.stringify(sizes));

      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      const response = await axios.post(
        backendUrl + '/api/product/add',
        formData,
        {
          headers: { token },
        }
      );

      if (response.data.success) {
        toast.dismiss();
        toast.success(response.data.message);
        // Clear fields after a successful submission
        setName('');
        setDescription('');
        setPrice('');
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
      } else {
        toast.dismiss();
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      id='form'
      onSubmit={onSubmitHandler}
      className='flex flex-col w-full items-start gap-3'
    >
      <div>
        <p className='mb-2'>Upload Image</p>
        <div className='flex gap-2'>
          <label htmlFor="image1">
            <img
              className='w-20'
              src={!image1 ? assets.upload_area : URL.createObjectURL(image1)}
              alt=""
            />
            <input
              onChange={(e) => setImage1(e.target.files[0])}
              type="file"
              id='image1'
              hidden
            />
          </label>
          <label htmlFor="image2">
            <img
              className='w-20'
              src={!image2 ? assets.upload_area : URL.createObjectURL(image2)}
              alt=""
            />
            <input
              onChange={(e) => setImage2(e.target.files[0])}
              type="file"
              id='image2'
              hidden
            />
          </label>
          <label htmlFor="image3">
            <img
              className='w-20'
              src={!image3 ? assets.upload_area : URL.createObjectURL(image3)}
              alt=""
            />
            <input
              onChange={(e) => setImage3(e.target.files[0])}
              type="file"
              id='image3'
              hidden
            />
          </label>
          <label htmlFor="image4">
            <img
              className='w-20'
              src={!image4 ? assets.upload_area : URL.createObjectURL(image4)}
              alt=""
            />
            <input
              onChange={(e) => setImage4(e.target.files[0])}
              type="file"
              id='image4'
              hidden
            />
          </label>
        </div>
      </div>

      <div className='w-full'>
        <p className='mt-2 mb-2'>Product Name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className={`w-full max-w-[500px] px-3 py-2 ${errors.name ? "border border-red-500" : ""
            }`}
          type="text"
          placeholder='Type here'
        />
        {errors.name && (
          <span className="text-red-500 text-sm">{errors.name}</span>
        )}
      </div>

      <div className='w-full'>
        <p className='mt-2 mb-2'>Product Description</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className={`w-full max-w-[500px] px-3 py-2 ${errors.description ? "border border-red-500" : ""
            }`}
          placeholder='Write description'
        />
        {errors.description && (
          <span className="text-red-500 text-sm">{errors.description}</span>
        )}
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Product Categories</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            className='w-full px-3 py-2'
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>
        <div>
          <p className='mb-2'>Sub Categories</p>
          <select
            onChange={(e) => setSubCategory(e.target.value)}
            className='w-full px-3 py-2'
          >
            <option value="Topwear">Topwear</option>
            <option value="Winterwear">Winterwear</option>
            <option value="Bottomwear">Bottomwear</option>
          </select>
        </div>
        <div>
          <p className='mb-2'>Product Price</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className={`w-full px-3 py-2 sm:w-[120px] ${errors.price ? "border border-red-500" : ""
              }`}
            type="Number"
            placeholder='Price'
          />
          {errors.price && (
            <span className="text-red-500 text-sm">{errors.price}</span>
          )}
        </div>
      </div>

      <div>
        <p className='mt-2 mb-2'>Product Sizes</p>
        <div className='flex gap-3'>
          {["S", "M", "L", "XL", "XXL"].map((size) => (
            <div
              key={size}
              onClick={() =>
                setSizes((prev) =>
                  prev.includes(size)
                    ? prev.filter((item) => item !== size)
                    : [...prev, size]
                )
              }
            >
              <p
                className={`${sizes.includes(size) ? "bg-pink-200" : "bg-slate-200"
                  } px-3 py-1 cursor-pointer`}
              >
                {size}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className='flex gap-2 mt-2'>
        <input
          onChange={() => setBestseller((prev) => !prev)}
          checked={bestseller}
          type="checkbox"
          id='bestseller'
        />
        <label className='cursor-pointer' htmlFor="bestseller">
          Add to Bestseller
        </label>
      </div>

      <button
        type='submit'
        className={`w-28 py-3 mt-4 text-white ${loading ? "cursor-not-allowed shine-animation" : "bg-black"
          }`}
        disabled={loading}
      >
        {loading ? "Adding..." : "ADD"}
      </button>
    </form>
  );
};

export default Add;
