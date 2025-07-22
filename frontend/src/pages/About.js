import React from "react";
import { Link } from "react-router-dom";
import { FaHome, FaInfoCircle, FaTh, FaPhone } from "react-icons/fa";

function AboutPage() {
  return (
    <div className="font-sans bg-gradient-to-r from-pink-50 via-white to-pink-50 min-h-screen">
      {/* Navbar */}
      <nav className="bg-pink-700 text-white py-4 px-6 flex justify-between items-center shadow-md sticky top-0 z-50">
        <div className="text-xl font-bold">
          <Link to="/" className="hover:text-gray-200 transition duration-200">
            Tech Gadgets Store
          </Link>
        </div>
        <div className="flex gap-6 text-lg font-medium">
          <Link
            to="/"
            className="flex items-center gap-2 hover:text-gray-200 transition duration-200"
          >
            <FaHome /> Home
          </Link>
          <Link
            to="/about"
            className="flex items-center gap-2 hover:text-gray-200 transition duration-200"
          >
            <FaInfoCircle /> About
          </Link>
          <Link
            to="/products"
            className="flex items-center gap-2 hover:text-gray-200 transition duration-200"
          >
            <FaTh /> Products
          </Link>
          <Link
            to="/contact"
            className="flex items-center gap-2 hover:text-gray-200 transition duration-200"
          >
            <FaPhone /> Contact
          </Link>
        </div>
      </nav>

      {/* About Content */}
      <div className="py-10 px-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-center text-4xl font-bold text-pink-700 mb-6">
            About Us
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            Welcome to <strong>Tech Gadgets Store</strong>! We are passionate
            about offering cutting-edge gadgets and technology to enhance your
            lifestyle. Since our establishment in <strong>2025</strong>, we
            have been dedicated to delivering innovative products that blend
            functionality with style.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <img
              src="/images/aboutus.jpg"
              alt="About Tech Gadgets Store"
              className="rounded-lg shadow-md w-full object-cover"
            />
            <div className="flex flex-col justify-center">
              <p className="text-lg text-gray-700 leading-relaxed">
                At <strong>Tech Gadgets Store</strong>, we believe in:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Providing top-notch quality products.</li>
                <li>Ensuring exceptional customer service.</li>
                <li>Offering fast and reliable delivery.</li>
                <li>Keeping up with the latest tech trends.</li>
              </ul>
            </div>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed mt-6">
            Whether you're looking for smart devices, accessories, or
            must-have tech essentials, we have a wide range of products to meet
            your needs. Your satisfaction is our priority, and we strive to
            make your shopping experience enjoyable and hassle-free.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed mt-4">
            Thank you for choosing <strong>Tech Gadgets Store</strong>. We look
            forward to serving you with the best in technology today and in the
            future!
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-pink-700 text-white text-center py-4">
        <p>© 2025 Tech Gadgets Store. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AboutPage;
