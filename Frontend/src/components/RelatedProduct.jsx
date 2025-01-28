import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext.jsx'
import Title from './Title.jsx'
import ProductItem from './ProductItem.jsx'
import { Link } from 'react-router-dom'



const RelatedProduct = ({ category, subCategory }) => {

    const { products } = useContext(ShopContext);
    const [related, setRelated] = useState([]);

    useEffect(() => {
        let productCopy = products.slice();

        if (productCopy.length > 0) {
            productCopy = productCopy.filter((item) => item.category === category);
            productCopy = productCopy.filter((item) => item.subCategory === subCategory);

            setRelated(productCopy.slice(0, 5));

        }


    }, [products])

    return (
        <div className='my-24' >
            <div className='text-center text-3xl py-2' >
                <Title text1={'RELATED'} text2={'PRODUCTS'} />

            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
                {
                    related.map((item, index) => (
                        <Link to={`/product/${item._id}`} >
                            <ProductItem key={index} id={item._id} image={item.image} name={item.name} price={item.price} />
                        </Link>
                    ))
                }

            </div>



        </div>
    )
}

export default RelatedProduct
