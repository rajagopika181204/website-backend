import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaUserAlt, FaEnvelope, FaLock } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/signup", {
        username,
        email,
        password,
      });

      toast.success(res.data.message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setTimeout(() => {
        navigate("/login");
      }, 3000); // Redirect after displaying success toast
    } catch (err) {
      toast.error(err.response?.data?.error || "Signup failed", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <div className="font-sans bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 min-h-screen flex items-center justify-center">
      {/* Toast Container */}
      <ToastContainer />
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-lg p-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-pink-700">
            <FaUserAlt className="inline-block mb-1 mr-2" /> TechGadget Store
          </h1>
          <p className="text-lg text-gray-600 mt-3">Create a new account today!</p>
        </div>

        {/* Signup Form */}
        <form
          onSubmit={handleSignup}
          className="space-y-8 animate-fade-in duration-500"
        >
          {/* Username Field */}
          <div className="relative">
            <label
              htmlFor="username"
              className="block text-lg font-semibold text-gray-700 mb-2"
            >
              Username
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg focus-within:ring-4 focus-within:ring-pink-300">
              <FaUserAlt className="text-pink-700 mx-4 text-xl" />
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full py-3 px-4 text-lg border-none focus:ring-0 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="relative">
            <label
              htmlFor="email"
              className="block text-lg font-semibold text-gray-700 mb-2"
            >
              Email
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg focus-within:ring-4 focus-within:ring-pink-300">
              <FaEnvelope className="text-pink-700 mx-4 text-xl" />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full py-3 px-4 text-lg border-none focus:ring-0 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="relative">
            <label
              htmlFor="password"
              className="block text-lg font-semibold text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg focus-within:ring-4 focus-within:ring-pink-300">
              <FaLock className="text-pink-700 mx-4 text-xl" />
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full py-3 px-4 text-lg border-none focus:ring-0 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            className="w-full py-4 text-xl bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold rounded-full hover:shadow-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-300"
          >
            Signup
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-lg text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-pink-700 font-bold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
