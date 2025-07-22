import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {UserContext} from '../context/UserContext';
import { FaArrowLeft, FaSignOutAlt, FaBoxOpen, FaUserCircle } from "react-icons/fa";

const Profile = () => {
  const { user, setUser } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  // Fetch orders when the component mounts
  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        navigate("/login");
        return;
      }
      setUser(JSON.parse(storedUser));
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/order?email=${user?.email}`
        );
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    };

    if (user?.email) {
      fetchOrders();
    }
  }, [user, setUser, navigate]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="font-sans bg-pink-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-pink-700 transition duration-200 text-2xl"
            aria-label="Go Back"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        </div>

        {/* User Information */}
        <div className="relative bg-gradient-to-r from-pink-700 via-pink-400 to-pink-700 p-8 rounded-2xl shadow-lg text-white mb-10">
          <div className="flex items-center space-x-6">
            {/* User Icon */}
            <FaUserCircle className="text-9xl text-white shadow-lg" />
            <div>
              <p className="text-xl font-semibold">{user.username || "User Name"}</p>
              <p className="text-sm">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-6 bg-white text-pink-700 py-2 px-6 rounded-lg shadow-md hover:bg-gray-200 transition"
          >
            <FaSignOutAlt className="inline-block mr-2" />
            Logout
          </button>
        </div>

        {/* Order History */}
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-6">
          <FaBoxOpen className="mr-3 text-pink-700" />
          Order History
        </h2>
        <div className="grid gap-6">
          {orders.length === 0 ? (
            <p className="text-gray-500 text-lg text-center">No orders found.</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-200 shadow-md rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <p className="text-gray-700">
                  <strong>Order ID:</strong> {order.id}
                </p>
                <p className="text-gray-700">
                  <strong>Amount:</strong> ₹{order.total_amount}
                </p>
                <p className="text-gray-700">
                  <strong>Payment Method:</strong> {order.payment_method}
                </p>
                <p className="text-gray-700">
                  <strong>Transaction ID:</strong>{" "}
                  {order.transaction_id || "NULL"}
                </p>
                <p className="text-gray-700">
                  <strong>Tracking ID:</strong> {order.tracking_id || "N/A"}
                </p>
                <p className="text-gray-700">
                  <strong>Order Date:</strong>{" "}
                  {new Date(order.created_at).toLocaleString()}
                </p>
                <p className="text-gray-700">
                  <strong>Delivery Address:</strong> {order.address}, {order.city}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
