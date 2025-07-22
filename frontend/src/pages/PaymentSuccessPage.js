import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaArrowRight, FaShoppingCart } from "react-icons/fa";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    orderId,
    trackingId,
    transactionId,
    userDetails,
    items,
    total,
    paymentMethod,
  } = location.state || {};

  if (!orderId || !trackingId) {
    return (
      <div className="flex justify-center items-center h-screen bg-pink-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-pink-700 text-2xl font-bold">Error</h1>
          <p className="text-gray-600 mt-4">
            Payment details are missing. Please try again!
          </p>
          <button
            className="bg-pink-700 text-white px-6 py-2 mt-6 rounded-lg hover:bg-pink-700"
            onClick={() => navigate("/")}
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleViewOrders = () => {
    navigate("/billing", {
      state: {
        orderId,
        trackingId,
        transactionId,
        userDetails,
        items,
        total,
        paymentMethod,
      },
    });
  };

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <FaCheckCircle className="text-green-700 mx-auto text-6xl" />
          <h1 className="text-3xl font-extrabold text-pink-600 mt-4">
            Order Confirmed!
          </h1>
          <p className="text-gray-700 mt-3">
            Thank you for your purchase. Your order is being processed.
          </p>
        </div>

        <div className="bg-pink-100 p-6 rounded-lg shadow-inner mb-8">
          <h2 className="text-lg font-bold text-pink-700">Order Details</h2>
          <p className="text-gray-700 mt-2">
            <strong>Order ID:</strong> {orderId}
          </p>
          <p className="text-gray-700 mt-1">
            <strong>Tracking ID:</strong> {trackingId}
          </p>
          {paymentMethod === "upi" && transactionId && (
            <p className="text-gray-700 mt-1">
              <strong>Transaction ID:</strong> {transactionId}
            </p>
          )}
        </div>

        <div className="flex space-x-4 justify-center">
          <button
            className="flex items-center gap-2 bg-pink-700 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition duration-300"
            onClick={() => navigate("/")}
          >
            Go to Home <FaArrowRight />
          </button>
          <button
            className="flex items-center gap-2 bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-5700 transition duration-300"
            onClick={handleViewOrders}
          >
            <FaShoppingCart /> View Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
