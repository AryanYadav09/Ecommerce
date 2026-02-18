import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const BestSellers = () => {
  const { products, search } = useContext(ShopContext);
  const [bestSeller, setBestSeller] = useState([]);

  useEffect(() => {
    if (products && products.length > 0) {
      const bestProduct = products.filter((item) => item.bestseller);
      setBestSeller(bestProduct.slice(0, 5));
    }
  }, [products]);

  const filteredBestSellers = bestSeller.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="ui-section py-12">
      <div className="text-center text-3xl py-6">
        <Title text1={"BEST"} text2={"SELLERS"} />
        <p className="w-11/12 sm:w-3/4 m-auto text-sm md:text-base muted-text">
          Your most-loved picks, chosen by shoppers who keep coming back for standout quality.
        </p>
      </div>
      <div className="stagger-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {filteredBestSellers.length > 0 ? (
          filteredBestSellers.map((item) => (
            <ProductItem
              key={item._id}
              id={item._id}
              image={item.image}
              name={item.name}
              price={item.price}
            />
          ))
        ) : (
          <p className="text-center muted-text col-span-full text-base py-8">
            No best sellers available at the moment.
          </p>
        )}
      </div>
    </section>
  );
};

export default BestSellers;
