import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { QRCodeSVG } from "qrcode.react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaRupeeSign,
  FaCreditCard,
  FaQrcode,
  FaShoppingCart,
  FaPlus,
  FaCheck,
  FaArrowLeft,
  FaHome,
} from "react-icons/fa";

const Navbar = ({ onBack }) => {
  const navigate = useNavigate();

  return (
    <nav className="bg-gradient-to-r from-pink-600 to-pink-700 text-white py-4 px-6 shadow-md flex justify-between items-center">
      <div className="flex items-center">
        {onBack && (
          <button
            className="text-white text-xl mr-4 hover:text-gray-200"
            onClick={onBack}
          >
            <FaArrowLeft />
          </button>
        )}
        <h1 className="text-2xl font-bold">Tech Gadgets Store</h1>
      </div>
      <div className="flex space-x-6">
        <button
          className="flex items-center gap-2 text-lg hover:text-gray-200"
          onClick={() => navigate("/")}
        >
          <FaHome />
          Home
        </button>
        <button
          className="flex items-center gap-2 text-lg hover:text-gray-200"
          onClick={() => navigate("/cart")}
        >
          <FaShoppingCart /> Cart
        </button>
      </div>
    </nav>
  );
};

const BuyNowPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { product, quantity, cartDetails, totalPrice } = location.state || {};
  const { user } = useContext(UserContext);

  const [userDetails, setUserDetails] = useState({
    name: "",
    address: "",
    city: "",
    email: user?.email || "",
    pincode: "",
    phone: "",
    paymentMethod: "creditCard",
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [upiPayment, setUpiPayment] = useState({
    show: false,
    link: "",
    qrData: "",
    qrVisible: false,
  });

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.email) return;

      try {
        const response = await axios.get(
          `http://localhost:5000/api/address/${user.email}`
        );

        if (response.data.success) {
          setSavedAddresses(
            Array.isArray(response.data.address)
              ? response.data.address
              : [response.data.address]
          );
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
      }
    };

    fetchAddresses();
  }, [user?.email]);

  const items = cartDetails || (product ? [{ product, quantity }] : []);
  const calculatedTotal = cartDetails
    ? totalPrice
    : product
    ? product.price * quantity
    : 0;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address.id);
    setUserDetails({
      ...userDetails,
      name: address.name,
      address: address.address,
      city: address.city,
      pincode: address.pincode,
      phone: address.phone,
    });
  };

  const handleSaveNewAddress = async () => {
    if (!userDetails.name || !userDetails.address || !userDetails.email) {
       toast.error("Please fill all required fields!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/save-address",
        userDetails
      );

      if (response.data.success) {
        setSavedAddresses([response.data.address]);
        setShowNewAddressForm(false);
        toast.success("Address saved successfully!");
      }
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to save address.");
    }
  };

  const handleGenerateUPI = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/generate-upi-link",
        { amount: calculatedTotal, orderId: `ORDER_${Date.now()}` }
      );
      setUpiPayment({
        show: true,
        link: response.data.upiLink,
        qrData: response.data.qrData,
        qrVisible: false,
      });
      toast.success("UPI Payment Link Generated!");
    } catch (err) {
      console.error("UPI Generation Error:", err);
      toast.error("Failed to generate UPI link. Please try again.");
    }
  };

  const handlePlaceOrder = async () => {
    if (
      !userDetails.name ||
      !userDetails.address ||
      !userDetails.city ||
      !userDetails.email ||
      !userDetails.pincode ||
      !userDetails.phone
    ) {
      toast.error("Please fill out all required fields.");
      return;
    }

    if (userDetails.paymentMethod === "upi" && !upiPayment.show) {
      toast.error("Please generate UPI Payment before placing the order.");
      return;
    }
    const orderId 
    
    = `ORDER_${Date.now()}`;
    const trackingId = `TRACK_${Date.now()}`;
    const transactionId = `TXN_${Date.now()}`;
    if (userDetails.paymentMethod === "razorpay") {
      if (!window.Razorpay) {
      toast.error("Payment failed. Check your connection and try again.");
      return;
    }
        const options = {
          key: "rzp_test_EH1UEwLILEPXCj", // Replace with your Razorpay Key ID
          amount: calculatedTotal * 100, // Amount in paise
          currency: "INR",
          name: "Tech Gadgets Store",
          description: "Purchase Description",

          handler:() => {
          navigate("/payment-success", {
            state: {
              orderId,
              trackingId,
              transactionId,
              userDetails,
              items,
              total: calculatedTotal,
              paymentMethod: userDetails.paymentMethod,
            },
          });
        },
          prefill: {
            name: userDetails.name,
            email: userDetails.email,
            contact: userDetails.phone,
          },
          theme: {
            color: "#F37254",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        setTimeout(() => {
      navigate("/payment-success", {
        state: {
          orderId,
          trackingId,
          transactionId,
          userDetails,
          items,
          total: calculatedTotal,
          paymentMethod: userDetails.paymentMethod,
        },
      });
      }, 3000); 
    }

    try {
      const transactionId =
        userDetails.paymentMethod === "upi" || "razorpay" ? `TXN${Date.now()}` : null;

      const response = await axios.post("http://localhost:5000/api/orders", {
        items,
        userDetails,
        total: calculatedTotal,
        paymentMethod: userDetails.paymentMethod,
        transactionId,
      });

      if (response.data && response.data.orderId) {
  toast.success("Order placed successfully!");

  // Delay navigation to let the toast display
  setTimeout(() => {
    navigate("/payment-success", {
      state: {
        orderId: response.data.orderId,
        trackingId: response.data.trackingId,
        transactionId: response.data.transactionId,
        userDetails: userDetails,
        items: items,
        total: calculatedTotal,
        paymentMethod: userDetails.paymentMethod,
      },
    });
  }, 3000); // 3-second delay to match the toast display duration
}

    } catch (err) {
      console.error("Order Placement Error:", err.response?.data || err.message);
      toast.success("Order Placed Successfully!.");
    }
  };

  return (
    <>
    <div className="font-sans bg-pink-50 min-h-screen pb-12">
      <Navbar onBack={() => navigate(-1)} />
        <ToastContainer />
      <div className="py-10 px-6 max-w-4xl mx-auto">
        <h1 className="text-center text-3xl font-bold mb-8 text-gray-800">Checkout</h1>

        {/* Order Summary */}
        <div className="bg-gradient-to-r from-pink-100 to-pink-500 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Summary 🛒</h2>
          {items.map((item, index) => (
            <p key={index} className="text-gray-700">
              {item.product.name} (x{item.quantity}) — ₹{item.product.price * item.quantity}
            </p>
          ))}
          <h3 className="text-lg font-semibold mt-4">Total: ₹{calculatedTotal}</h3>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Delivery Address 📦</h2>
          {savedAddresses.length > 0 ? (
            <div key={Date.now()} className="space-y-4">
              {savedAddresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedAddress === address.id
                      ? "bg-gradient-to-r from-pink-100 to-pink-400 border-pink-500"
                      : "border-gray-300"
                  }`}
                  onClick={() => handleAddressSelect(address)}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddress === address.id}
                    onChange={() => handleAddressSelect(address)}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-semibold">{address.name}</p>
                    <p>{address.address}</p>
                    <p>
                      {address.city} - {address.pincode}
                    </p>
                    <p>Phone: {address.phone}</p>
                    <p>Email: {address.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No saved addresses found.</p>
          )}
          <button
            onClick={() => setShowNewAddressForm(true)}
            className="mt-6 px-5 py-3 bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded-lg hover:shadow-lg transition"
          >
            <FaPlus className="inline-block mr-2" /> Add New Address
          </button>
        </div>

        {/* New Address Form */}
        {showNewAddressForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">📦New Shipping Address</h2>
            {"name address city email pincode phone"
              .split(" ")
              .map((field) => (
                <input
                  key={field}
                  type="text"
                  name={field}
                  placeholder={field[0].toUpperCase() + field.slice(1)}
                  value={userDetails[field]}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-pink-300"
                />
              ))}
            <div className="flex space-x-4">
              <button
                onClick={handleSaveNewAddress}
                className="px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                <FaCheck className="inline-block mr-2" /> Save Address
              </button>
              <button
                onClick={() => setShowNewAddressForm(false)}
                className="px-5 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="bg-gradient-to-r from-pink-100 to-pink-500 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            <FaCreditCard className="inline-block mr-2" /> Payment Method
          </h2>
          <select
            name="paymentMethod"
            value={userDetails.paymentMethod}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-400"
          >
            <option value="creditCard">Credit Card</option>
            <option value="upi">UPI</option>
            <option value="razorpay">Razorpay</option>
            <option value="cashOnDelivery">Cash on Delivery</option>
          </select>
        </div>

        {/* UPI Payment */}
        {userDetails.paymentMethod === "upi" && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <button
              onClick={handleGenerateUPI}
              className="w-full px-5 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition mb-4"
            >
              <FaRupeeSign className="inline-block mr-2" /> Generate UPI Payment Link
            </button>
            {upiPayment.show && (
              <div>
                
                <button
                  onClick={() =>
                    setUpiPayment((prev) => ({ ...prev, qrVisible: true }))
                  }
                  className="w-full px-5 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition"
                >
                  <FaQrcode className="inline-block mr-2" /> Show QR Code
                </button>
                {upiPayment.qrVisible && (
                  <div className="flex justify-center mt-4">
                    <QRCodeSVG value={upiPayment.qrData} size={150} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handlePlaceOrder}
          className="w-full px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          Place Order
        </button>
      </div>
      </div>
    </>
  );
};

export default BuyNowPage;  