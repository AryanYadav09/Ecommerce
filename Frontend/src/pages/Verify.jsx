import React, { useContext, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Verify = () => {
    const { token, setCartItems, backendUrl } = useContext(ShopContext);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const success = searchParams.get('success');
    const orderId = searchParams.get('orderId');
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        if (!token || !orderId || !userId) {
            console.error("Missing required parameters", { token, orderId, userId });
            navigate('/cart');
            return;
        }

        const verifyPayment = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/order/verifyStripe`, {
                    params: { success, orderId, userId },
                    headers: { token },
                });

                if (response.data.success) {
                    setCartItems({});
                    toast.success("Payment Verified ✅");
                    navigate('/orders');
                } else {
                    toast.error("Payment Failed ❌");
                    navigate('/cart');
                }
            } catch (error) {
                console.error("Payment verification failed:", error);
                toast.error(error.response?.data?.message || "Payment verification failed.");
                navigate('/cart');
            }
        };

        verifyPayment();
    }, [token, navigate, orderId, success, userId, backendUrl, setCartItems]);

    return <h2>Verifying Payment...</h2>;
};

export default Verify;
