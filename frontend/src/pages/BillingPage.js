import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FaFileInvoice,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaShoppingCart,
  FaCheckCircle,
  FaArrowLeft,
  FaFilePdf,
  FaUser,
} from "react-icons/fa";

const BillingPage = () => {
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

  const generateInvoice = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Tech Gadgets Store", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Your Trusted Electronics Partner", 105, 30, { align: "center" });
    doc.line(20, 35, 190, 35);

    doc.setFontSize(16);
    doc.text("Invoice", 20, 45);
    doc.setFontSize(12);
    doc.text(`Order ID: ${orderId}`, 20, 55);
    doc.text(`Tracking ID: ${trackingId}`, 20, 65);
    doc.text(`Transaction ID: ${transactionId}`, 20, 75);
    doc.text(`Payment Method: ${paymentMethod}`, 20, 85);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details", 20, 100);
    doc.setFontSize(12);
    doc.text(`Name: ${userDetails?.name || "N/A"}`, 20, 110);
    doc.text(`Address: ${userDetails?.address || "N/A"}`, 20, 120);
    doc.text(`City: ${userDetails?.city || "N/A"}`, 20, 130);
    doc.text(`Email: ${userDetails?.email || "N/A"}`, 20, 140);
    doc.text(`Phone: ${userDetails?.phone || "N/A"}`, 20, 150);

    doc.text("Order Items", 20, 165);
    autoTable(doc, {
      startY: 170,
      head: [["Product Name", "Quantity", "Price", "Total"]],
      body: items.map((item) => [
        item.product.name,
        item.quantity,
        item.product.price,
        item.quantity * item.product.price,
      ]),
      theme: "grid",
      headStyles: { fillColor: [240, 128, 128] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`Total Amount: ${total || 0}`, 20, finalY);

    doc.setFontSize(10);
    doc.text("Thank you for shopping with Tech Gadgets Store!", 105, 290, {
      align: "center",
    });

    doc.save(`Invoice_Order_${orderId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-pink-50 py-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-center text-3xl font-bold text-pink-700 mb-6">
          Billing Details <FaFileInvoice className="inline-block ml-2" />
        </h1>

        {/* Order Details */}
        <div className="bg-pink-100 p-5 rounded-lg shadow-md mb-6">
          <h2 className="text-pink-700 font-bold text-lg mb-3">Order Details:</h2>
          <p>
            <FaShoppingCart className="inline-block text-pink-700 mr-2" />
            <strong>Order ID:</strong> {orderId || "N/A"}
          </p>
          <p>
            <FaCheckCircle className="inline-block text-pink-700 mr-2" />
            <strong>Tracking ID:</strong> {trackingId || "N/A"}
          </p>
          <p>
            <FaCheckCircle className="inline-block text-pink-700 mr-2" />
            <strong>Transaction ID:</strong> {transactionId || "N/A"}
          </p>
          <p>
            <FaCheckCircle className="inline-block text-pink-700 mr-2" />
            <strong>Payment Method:</strong> {paymentMethod || "NULL"}
          </p>
        </div>

        {/* Shipping Details */}
        <div className="bg-pink-100 p-5 rounded-lg shadow-md mb-6">
          <h2 className="text-pink-700 font-bold text-lg mb-3">
            Shipping Details:
          </h2>
          <p>
            <FaUser className="inline-block text-pink-700 mr-2" />
            {userDetails?.name || "N/A"}
          </p>
          <p>
            <FaMapMarkerAlt className="inline-block text-pink-700 mr-2" />
            {userDetails?.address || "N/A"}, {userDetails?.city || "N/A"}
          </p>
          <p>
            <FaEnvelope className="inline-block text-pink-700 mr-2" />
            {userDetails?.email || "N/A"}
          </p>
          <p>
            <FaPhone className="inline-block text-pink-700 mr-2" />
            {userDetails?.phone || "N/A"}
          </p>
        </div>

        {/* Order Items */}
        <div className="bg-pink-100 p-5 rounded-lg shadow-md mb-6">
          <h2 className="text-pink-700 font-bold text-lg mb-3">Order Items:</h2>
          {items?.length > 0 ? (
            <ul>
              {items.map((item, index) => (
                <li key={index} className="mb-2">
                  <FaCheckCircle className="inline-block text-pink-700 mr-2" />
                  {item.product.name} (x{item.quantity}) — ₹
                  {item.quantity * item.product.price}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items found.</p>
          )}
        </div>

        <h3 className="text-center text-xl font-bold text-gray-800 mb-6">
          Total Amount: <span className="text-pink-700">₹{total || 0}</span>
        </h3>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            className="bg-pink-700 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition duration-300"
            onClick={generateInvoice}
          >
            <FaFilePdf className="inline-block mr-2" />
            Download Invoice
          </button>
          <button
            className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-300"
            onClick={() => navigate("/")}
          >
            <FaArrowLeft className="inline-block mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
