import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext.jsx";
import Title from "./Title.jsx";
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
    <section className="ui-section my-12">
      <div className="text-center py-6 text-3xl">
        <Title text1={"LATEST"} text2={"COLLECTIONS"} />
        <p className="w-11/12 sm:w-3/4 m-auto text-sm md:text-base muted-text">
          Curated drops fresh from this season. Discover silhouettes designed to stand out and stay timeless.
        </p>
      </div>

      <div className="stagger-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {filteredProducts.length === 0 ? (
          <p className='text-center text-lg mt-4 col-span-full'>No Products Found</p>
        ) : (
          filteredProducts.map((item) => (
            <ProductItem key={item._id} id={item._id} image={item.image} name={item.name} price={item.price} />
          ))
        )}
      </div>
    </section>
  );
};

export default LatestCollection;
