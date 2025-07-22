import React from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Productlist from "./pages/Productlist";
import ProductDetails from "./pages/ProductDetails";
import CartPage from "./pages/CartPage";
import { CartProvider } from "./context/CartContext";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import BillingPage from "./pages/BillingPage";
import AboutPage from "./pages/About";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile.js";
import BuyNowPage from "./pages/BuyNowPage.js";
function AppWrapper() {
  return (
    <>
      
      <Routes>
        <Route path="/" element={<Productlist />} />
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup />} />
        <Route path="/products" element={<Productlist />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/buy-now" element={<BuyNowPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/About" element={<AboutPage/>} />
        <Route path="/Wishlist" element={<Wishlist/>} />
        <Route path="/profile" element={<Profile />} />   
      </Routes>
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AppWrapper />
      </Router>
    </CartProvider>
  );
}

export default App;
