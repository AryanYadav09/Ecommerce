import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProduct from "../components/RelatedProduct";

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart, toggleWishlist, isInWishlist, backendUrl, token, navigate } = useContext(ShopContext);

  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");

  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProductData = () => {
      const product = products.find((item) => item._id === productId);
      if (product) {
        setProductData(product);
        setImage(product.image[0]);
      }
    };

    fetchProductData();
  }, [productId, products]);

  const loadProductReviews = useCallback(async () => {
    try {
      const response = await axios.post(backendUrl + '/api/product/reviews', { productId });

      if (response.data.success) {
        setReviews(Array.isArray(response.data.reviews) ? response.data.reviews : []);
        setAverageRating(Number(response.data.averageRating || 0));
        setTotalReviews(Number(response.data.totalReviews || 0));
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || error.message || 'Failed to load reviews');
    }
  }, [backendUrl, productId]);

  useEffect(() => {
    if (productId) {
      loadProductReviews();
    }
  }, [productId, loadProductReviews]);

  const renderStars = (rating) => {
    const normalizedRating = Math.round(Number(rating || 0));

    return Array.from({ length: 5 }, (_, index) => {
      const isActive = index < normalizedRating;
      return (
        <img
          key={index}
          src={isActive ? assets.star_icon : assets.star_dull_icon}
          alt={isActive ? 'Filled star' : 'Empty star'}
          className="w-4 h-4"
        />
      );
    });
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.dismiss();
      toast.error('Please login to submit a review');
      navigate('/login');
      return;
    }

    if (!reviewComment.trim()) {
      toast.dismiss();
      toast.error('Please write your review');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const response = await axios.post(
        backendUrl + '/api/product/review/add',
        {
          productId,
          rating: reviewRating,
          comment: reviewComment.trim()
        },
        { headers: { token } }
      );

      if (response.data.success) {
        setReviews(Array.isArray(response.data.reviews) ? response.data.reviews : []);
        setAverageRating(Number(response.data.averageRating || 0));
        setTotalReviews(Number(response.data.totalReviews || 0));
        setReviewComment('');
        toast.dismiss();
        toast.success(response.data.message || 'Review submitted');
      } else {
        toast.dismiss();
        toast.error(response.data.message || 'Failed to submit review');
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || error.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const reviewSummaryLabel = useMemo(() => {
    if (!totalReviews) {
      return 'No reviews yet';
    }
    return `${averageRating.toFixed(1)} (${totalReviews} ${totalReviews > 1 ? 'reviews' : 'review'})`;
  }, [averageRating, totalReviews]);

  return productData ? (
    <div className="ui-section border-t border-white/10 pt-10 transition-opacity ease-in duration-500 opacity-100">
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image?.map((item, index) => (
              <img
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer rounded-lg"
                alt={`Product Image ${index + 1}`}
                onClick={() => setImage(item)}
              />
            ))}
          </div>
          <div className="flex-1 ui-media rounded-2xl">
            <img src={image} alt="Selected Product" className="w-full" />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2 ">{productData.name}</h1>
          <div className="flex items-center gap-1 mt-2">
            {renderStars(averageRating)}
            <p className="pl-2 text-sm muted-text">{reviewSummaryLabel}</p>
          </div>

          <p className="mt-5 text-3xl font-medium">
            {currency}
            {productData.price}
          </p>
          <p className="mt-5 muted-text md:w-4/5">
            {productData.description}
          </p>
          <div className="flex flex-col gap-4 my-8">
            <p>Select Size</p>
            <div className="flex gap-2 flex-wrap">
              {productData.sizes.map((item) => {
                const isSelected = item === size;
                return (
                <button
                  type="button"
                  onClick={() => setSize(item)}
                  className={`ui-button-ghost py-2 px-4 text-sm font-medium ${
                    isSelected
                      ? "bg-[var(--accent-alt)] border-[var(--accent-alt)] text-white shadow-[0_10px_24px_rgba(22,163,74,0.35)]"
                      : ""
                  }`}
                  key={item}
                >
                  {item}
                </button>
                );
              })}
            </div>
            {size && <p className="text-sm muted-text">Selected size: <span className="font-semibold text-[var(--accent-alt)]">{size}</span></p>}
          </div>
          <button onClick={() => addToCart(productData._id, size)} className="ui-button px-8 py-3 text-sm">
            ADD TO CART
          </button>
          <button
            onClick={() => toggleWishlist(productData._id)}
            className={`ml-3 px-6 py-3 text-sm ui-button-ghost ${isInWishlist(productData._id) ? 'border-[var(--accent-soft)]' : ''}`}
          >
            {isInWishlist(productData._id) ? 'WISHLISTED' : 'ADD TO WISHLIST'}
          </button>
          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm muted-text mt-5 flex flex-col gap-1">
            <p>100% Original Product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and Exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`ui-button-ghost px-5 py-3 text-sm ${activeTab === 'description' ? 'border-[var(--accent-soft)]' : ''}`}
          >
            Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`ui-button-ghost px-5 py-3 text-sm ${activeTab === 'reviews' ? 'border-[var(--accent-soft)]' : ''}`}
          >
            Reviews ({totalReviews})
          </button>
        </div>

        {activeTab === 'description' ? (
          <div className="ui-card flex flex-col gap-4 px-6 py-6 text-sm muted-text mt-4">
            <p>{productData.description}</p>
            <p>
              Crafted with quality-first materials and tailored for all-day comfort. This product is designed to be
              easy to style, durable in daily use, and reliable across seasons.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Premium build quality</li>
              <li>Comfortable fit with size options</li>
              <li>Easy returns and fast support</li>
            </ul>
          </div>
        ) : (
          <div className="ui-card px-6 py-6 mt-4">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-lg font-medium">Customer Reviews</p>
                <div className="flex items-center gap-2 mt-2">
                  {renderStars(averageRating)}
                  <p className="text-sm muted-text">{reviewSummaryLabel}</p>
                </div>
              </div>

              <div className="grid gap-3">
                {reviews.length === 0 ? (
                  <p className="text-sm muted-text">No reviews yet. Be the first to share your feedback.</p>
                ) : (
                  reviews.map((review, index) => (
                    <div key={`${review.userId}-${index}`} className="ui-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {review.userAvatar ? (
                            <img src={review.userAvatar} alt={review.userName} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-sm font-semibold">
                              {String(review.userName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{review.userName}</p>
                            <p className="text-xs muted-text">{new Date(review.date).toDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                      </div>
                      {review.comment && <p className="text-sm muted-text mt-3">{review.comment}</p>}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleReviewSubmit} className="ui-card p-4 sm:p-5">
                <p className="text-base font-medium mb-3">Write a Review</p>
                <div className="flex items-center gap-2 mb-4">
                  {Array.from({ length: 5 }, (_, index) => {
                    const starValue = index + 1;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        className="p-0.5"
                        onClick={() => setReviewRating(starValue)}
                      >
                        <img
                          src={starValue <= reviewRating ? assets.star_icon : assets.star_dull_icon}
                          alt={`${starValue} star`}
                          className="w-6 h-6"
                        />
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  maxLength={400}
                  placeholder="Share your experience with this product"
                  className="ui-input w-full rounded-lg px-4 py-3 text-sm resize-none"
                  required
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs muted-text">{reviewComment.length}/400 characters</p>
                  <button disabled={isSubmittingReview} className="ui-button px-6 py-2 text-sm disabled:opacity-70" type="submit">
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <RelatedProduct subCategory={productData.subCategory} category={productData.category} />
    </div>
  ) : (
    <div className="text-center text-gray-500">Loading product data...</div>
  );
};

export default Product;
