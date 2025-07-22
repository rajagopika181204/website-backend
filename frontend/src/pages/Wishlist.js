import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import axios from "axios";

const Wishlist = () => {
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  }, []);

  const removeFromWishlist = (productId) => {
    const updatedWishlist = wishlist.filter((id) => id !== productId);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
  };

  const wishlistProducts = products.filter((product) =>
    wishlist.includes(product.id)
  );

  return (
    <div className="font-sans bg-gradient-to-r from-pink-50 via-white to-pink-50 min-h-screen">
      {/* Navbar */}
      <header className="bg-pink-700 shadow-md py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/">
            <img
              src="/images/logo.jpeg"
              alt="Tech Gadgets Store"
              className="w-14 h-14 rounded-full border-2 border-white"
            />
          </Link>
          <h1 className="text-2xl font-bold text-white">Tech Gadgets Store</h1>
        </div>
        <nav className="flex gap-6">
          <Link
            to="/about"
            className="text-white text-lg font-semibold hover:text-gray-200 transition duration-200"
          >
            About
          </Link>
          <Link
            to="/products"
            className="text-white text-lg font-semibold hover:text-gray-200 transition duration-200 flex items-center gap-2"
          >
            <FaHome /> Home
          </Link>
          <Link
            to="/cart"
            className="text-white text-lg font-semibold hover:text-gray-200 transition duration-200 flex items-center gap-2"
          >
            <FaShoppingCart /> Cart
          </Link>
        </nav>
      </header>

      {/* Wishlist Section */}
      <main className="py-10 px-6">
        <center>
          <h2 className="text-5xl font-extrabold text-pink-700 mb-8">
            Your Wishlist
          </h2>
        </center>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {wishlistProducts.length > 0 ? (
            wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transform hover:scale-105 transition duration-300"
              >
                <img
                  src={`http://localhost:3000/images/${product.image_url}`}
                  alt={product.name}
                  className="w-full h-64 object-cover cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    {product.name}
                  </h3>
                  <p className="text-pink-700 font-bold text-lg mt-3">
                    ₹{product.price}
                  </p>
                  <button
                    className="mt-6 w-full bg-pink-700 text-white py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-pink-600 transition duration-200"
                    onClick={() => removeFromWishlist(product.id)}
                  >
                    <FaTrashAlt /> Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 text-lg col-span-full">
              Your wishlist is empty. Start adding items!
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-pink-700 shadow-md py-8 text-center mt-10">
        <p className="text-white text-lg font-semibold">
          © 2025 Tech Gadgets Store. All rights reserved.
        </p>
        <div className="mt-4 flex justify-center gap-6">
          <Link
            to="/"
            className="text-white hover:underline transition duration-200"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-white hover:underline transition duration-200"
          >
            About
          </Link>
          <Link
            to="/contact"
            className="text-white hover:underline transition duration-200"
          >
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Wishlist;
