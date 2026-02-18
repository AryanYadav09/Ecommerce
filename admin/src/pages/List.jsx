/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl, currency } from '../config/constants.js';

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchList = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setList(response.data.products);
        return;
      }
      toast.dismiss();
      toast.error(response.data.message);
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditProduct(null);
  };

  const openEditModal = (product) => {
    setEditProduct({ ...product });
    setShowModal(true);
  };

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/product/remove`,
        { id },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.dismiss();
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.dismiss();
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const updateProduct = async () => {
    try {
      const updatedData = {
        productId: editProduct._id,
        name: editProduct.name,
        description: editProduct.description,
        price: editProduct.price,
        category: editProduct.category,
        subCategory: editProduct.subCategory,
        sizes: editProduct.sizes,
        bestseller: editProduct.bestseller,
        inStock: editProduct.inStock
      };

      const response = await axios.post(`${backendUrl}/api/product/update`, updatedData, {
        headers: { token }
      });

      if (response.data.success) {
        toast.dismiss();
        toast.success('Product updated successfully!');
        await fetchList();
        closeModal();
      } else {
        toast.dismiss();
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const emptyState = useMemo(() => list.length === 0, [list.length]);

  return (
    <section className='admin-fade-up'>
      <div className='mb-5'>
        <h2 className='text-2xl sm:text-3xl'>All Products</h2>
        <p className='muted-text text-sm mt-1'>Edit pricing, details, and stock status of your catalog.</p>
      </div>

      {emptyState ? (
        <div className='admin-panel p-5 text-sm muted-text'>No products found yet.</div>
      ) : (
        <div className='space-y-3 stagger-grid'>
          <div className='hidden lg:grid grid-cols-[90px_2fr_1fr_120px_170px] gap-3 px-4 py-3 admin-panel text-sm font-semibold'>
            <p>Image</p>
            <p>Name</p>
            <p>Category</p>
            <p>Price</p>
            <p>Actions</p>
          </div>

          {list.map((item) => (
            <div
              className='admin-card grid grid-cols-1 lg:grid-cols-[90px_2fr_1fr_120px_170px] gap-3 items-center px-4 py-3'
              key={item._id}
            >
              <img className='w-16 h-16 rounded-lg object-cover border border-[var(--border)]' src={item.image[0]} alt={item.name} />
              <div>
                <p className='font-semibold'>{item.name}</p>
                <p className='text-xs muted-text mt-1'>{item.description}</p>
              </div>
              <p className='text-sm'>{item.category}</p>
              <p className='font-semibold'>{currency}{item.price}</p>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => openEditModal(item)}
                  className='admin-button-ghost text-sm px-3 py-1.5'
                >
                  Edit
                </button>
                <button
                  type='button'
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this product?')) {
                      removeProduct(item._id);
                    }
                  }}
                  className='rounded-full border border-red-400/45 text-red-300 px-3 py-1.5 text-sm hover:bg-red-500/18 transition-colors'
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && editProduct && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8'>
          <div className='admin-glass w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto'>
            <h3 className='text-2xl mb-4'>Edit Product</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProduct();
              }}
              className='space-y-4'
            >
              <div>
                <label className='block text-sm font-medium mb-1'>Name</label>
                <input
                  type='text'
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  className='admin-input w-full px-3 py-2.5'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>Description</label>
                <textarea
                  value={editProduct.description}
                  onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                  className='admin-input w-full px-3 py-2.5 min-h-24'
                  required
                />
              </div>

              <div className='grid sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>Price</label>
                  <input
                    type='number'
                    value={editProduct.price}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, price: Number(e.target.value) })
                    }
                    className='admin-input w-full px-3 py-2.5'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>Category</label>
                  <select
                    value={editProduct.category}
                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                    className='admin-input w-full px-3 py-2.5'
                  >
                    <option value='Men'>Men</option>
                    <option value='Women'>Women</option>
                    <option value='Kids'>Kids</option>
                  </select>
                </div>
              </div>

              <div className='grid sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>Sub Category</label>
                  <select
                    value={editProduct.subCategory}
                    onChange={(e) => setEditProduct({ ...editProduct, subCategory: e.target.value })}
                    className='admin-input w-full px-3 py-2.5'
                  >
                    <option value='Topwear'>Topwear</option>
                    <option value='Winterwear'>Winterwear</option>
                    <option value='Bottomwear'>Bottomwear</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>Availability</label>
                  <select
                    value={editProduct.inStock ? 'true' : 'false'}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, inStock: e.target.value === 'true' })
                    }
                    className='admin-input w-full px-3 py-2.5'
                  >
                    <option value='true'>In Stock</option>
                    <option value='false'>Out Of Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>Sizes (comma separated)</label>
                <input
                  type='text'
                  value={editProduct.sizes.join(', ')}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      sizes: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    })
                  }
                  className='admin-input w-full px-3 py-2.5'
                />
              </div>

              <label htmlFor='editBestseller' className='flex items-center gap-2 w-fit cursor-pointer'>
                <input
                  type='checkbox'
                  checked={editProduct.bestseller}
                  onChange={(e) => setEditProduct({ ...editProduct, bestseller: e.target.checked })}
                  id='editBestseller'
                  className='w-4 h-4'
                />
                <span className='text-sm'>Add to bestseller</span>
              </label>

              <div className='flex justify-end gap-2 pt-2'>
                <button type='button' onClick={closeModal} className='admin-button-ghost px-4 py-2 text-sm'>
                  Cancel
                </button>
                <button type='submit' className='admin-button px-4 py-2 text-sm'>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default List;
