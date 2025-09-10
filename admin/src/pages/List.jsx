import axios from 'axios';
import React, { useEffect } from 'react'
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';

const List = ({ token }) => {

  const [list, setList] = React.useState([]);
  const [editProduct, setEditProduct] = React.useState(null); // Stores the product being edited
  const [showModal, setShowModal] = React.useState(false); // Controls modal visibility


  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list');
      if (response.data.success) {

        setList(response.data.products);
      } else {
        toast.dismiss();
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.dismiss();
      toast.error(error.message);


    }
  }

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } });

      if (response.data.success) {
        toast.dismiss();
        toast.success(response.data.message);
        await fetchList();

      } else {
        toast.dismiss();
        toast.error(response.data.message);
      }

    } catch (error) {
      console.log(error);
      toast.dismiss();
      toast.error(error.message);

    }
  }

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
        // Optionally add image field if you allow image updates.
      };
      // Send the updated product info to the backend
      const response = await axios.post(
        backendUrl + '/api/product/update',
        updatedData,
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Product updated successfully!");
        await fetchList(); // Refresh list after update
        setShowModal(false);
        setEditProduct(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };




  useEffect(() => {
    fetchList();
  }, [])

  return (
    <>
      <p className='mb-2' >All Products List</p>
      <div className='flex flex-col gap-2' >

        {/* list of the products  */}

        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm' >
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>

        {/*displaying product lists */}
        {
          list.map((item, index) => (
            <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr]  items-center gap-2 py-1 px-2 border text-sm' key={index} >
              <img className='w-12' src={item.image[0]} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p >{currency}{item.price}</p>
              {/* <button onClick={() => setEditProduct(item) || setShowModal(true)} className="text-gray-500 underline">Edit</button> */}
              <div className="flex items-center gap-4">
                <p
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this product?")) {
                      removeProduct(item._id);
                    }
                  }}
                  className="text-red-500 cursor-pointer text-lg font-bold hover:text-red-700"
                >
                  X
                </p>
                <p
                  onClick={() => {
                    setEditProduct(item);
                    setShowModal(true);
                  }}
                  className="text-gray-500 underline cursor-pointer hover:text-gray-700"
                >
                  Edit
                </p>
              </div>


            </div>
          ))
        }

        {/* edit product model  */}
        {showModal && editProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Product</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProduct();
                }}
              >
                {/* Product Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md p-2"
                    required
                  />
                </div>

                {/* Product Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={editProduct.description}
                    onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md p-2"
                    required
                  ></textarea>
                </div>

                {/* Product Price */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md p-2"
                    required
                  />
                </div>

                {/* Product Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={editProduct.category}
                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md p-2"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>

                {/* Product SubCategory */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Sub Category</label>
                  <select
                    value={editProduct.subCategory}
                    onChange={(e) => setEditProduct({ ...editProduct, subCategory: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md p-2"
                  >
                    <option value="Topwear">Topwear</option>
                    <option value="Winterwear">Winterwear</option>
                    <option value="Bottomwear">Bottomwear</option>
                  </select>
                </div>

                {/* Product Sizes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Sizes (comma separated)</label>
                  <input
                    type="text"
                    value={editProduct.sizes.join(", ")}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        sizes: e.target.value.split(",").map((s) => s.trim()),
                      })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md p-2"
                  />
                </div>

                {/* Bestseller Checkbox */}
                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editProduct.bestseller}
                    onChange={(e) => setEditProduct({ ...editProduct, bestseller: e.target.checked })}
                    id="editBestseller"
                  />
                  <label htmlFor="editBestseller" className="text-sm">
                    Add to Bestseller
                  </label>
                </div>

                {/* Availability Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Availability</label>
                  <select
                    value={editProduct.inStock ? "true" : "false"}
                    onChange={(e) => setEditProduct({ ...editProduct, inStock: e.target.value === "true" })}
                    className="mt-1 block w-full border-gray-300 rounded-md p-2"
                  >
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditProduct(null);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      </div>



    </>
  )
}

export default List
