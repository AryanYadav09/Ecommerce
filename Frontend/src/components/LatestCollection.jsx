import React, { useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext.jsx";
import Title from "./Title.jsx";
import { useContext } from "react";
import ProductItem from "./ProductItem.jsx";

const LatestCollection = () => {
  const { products, search } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {

    setLatestProducts(products.slice(0, 10));
  }, [products]);


  const filteredProducts = latestProducts.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );



  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={"LATEST"} text2={"COLLECTIONS"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Suscipit
          voluptate consectetur earum repellat
        </p>
      </div>

      {/* rendring the products  */}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6" >
        {filteredProducts.length === 0 ? <p className='text-center text-lg mt-4' >No Products Found</p> :
          filteredProducts.map((item, index) => (
            <ProductItem  key={index} id={item._id} image={item.image} name={item.name} price={item.price} />
          ))
        }

      </div>
     </div>
  );
};

export default LatestCollection;
