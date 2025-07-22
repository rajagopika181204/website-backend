import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { FaEnvelope, FaLock, FaUserAlt, FaHome } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Login() {
  const { setUser } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });
      const { user } = res.data; // Assume server sends user info
      setUser(user); // Update global user state

      toast.success("Login successful!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setTimeout(() => {
        navigate("/products");
      }, 3000); // Delay navigation to let the toast display
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed", {
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
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-lg">
        <button
          className="absolute top-8 left-8 text-pink-600 text-2xl hover:text-pink-700 transition"
          onClick={() => navigate("/")}
        >
          <FaHome className="inline-block mr-2" /> Home
        </button>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-pink-700">
            <FaUserAlt className="inline-block mr-3" /> TechGadget Store
          </h1>
          <p className="text-lg text-gray-600 mt-3">
            Login to access the best tech gadgets!
          </p>
        </div>
        <form
          onSubmit={handleLogin}
          className="space-y-8 animate-fade-in duration-500"
        >
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
                type="text"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full py-3 px-4 text-lg border-none focus:ring-0 focus:outline-none bg-transparent"
              />
            </div>
          </div>
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
                autoComplete="current-password"
                className="w-full py-3 px-4 text-lg border-none focus:ring-0 focus:outline-none bg-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-4 text-xl bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold rounded-full hover:shadow-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-300"
          >
            Login
          </button>
        </form>
        <p className="text-center text-lg text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-pink-700 font-bold hover:underline"
          >
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
