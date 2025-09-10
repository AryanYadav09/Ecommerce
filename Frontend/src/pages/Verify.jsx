import React, { useContext, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLoading } from '../context/LoadingContext';

const Verify = () => {
    const { token, setCartItems, backendUrl } = useContext(ShopContext);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const success = searchParams.get('success');
    const orderId = searchParams.get('orderId');
    const userId = localStorage.getItem("userId");
    const { setLoading } = useLoading();

    useEffect(() => {
        if (!token || !orderId || !userId) {
            console.error("Missing required parameters", { token, orderId, userId });
            navigate('/cart');
            return;
        }

        const verifyPayment = async () => {
            try {
                setLoading(true); // Show loading spinner
                const response = await axios.get(`${backendUrl}/api/order/verifyStripe`, {
                    params: { success, orderId, userId },
                    headers: { token },
                });

                if (response.data.success) {
                    setCartItems({});
                    toast.dismiss();
                    toast.success("Payment Verified ✅");
                    navigate('/orders');
                } else {
                    toast.dismiss();
                    toast.error("Payment Failed ❌");
                    navigate('/cart');
                }
            } catch (error) {
                console.error("Payment verification failed:", error);
                toast.dismiss();
                toast.error(error.response?.data?.message || "Payment verification failed.");
                navigate('/cart');
            } finally {
                setLoading(false); // Hide loading spinner
            }
        };

        verifyPayment();
    }, [token, navigate, orderId, success, userId, backendUrl, setCartItems]);

    return <h2>Verifying Payment...</h2>;
};

export default Verify;
