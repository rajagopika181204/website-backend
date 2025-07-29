const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 5000;
const JWT_SECRET = '123!@#';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
// Adjust for production
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/images', express.static('images')); // Serving static images



// MySQL connection
async function connectDB() {
  return await mysql.createConnection({
    host: 'tech-gadget-db.cr2ue6u44sny.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: 'ramchin123',
    database: 'techstore',
  });
}

// Update with your DB connection path

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input fields
  if (!username || !email  || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const connection = await connectDB();
  try {
    // Check if the user already exists
    const [existing] = await connection.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user into the database
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password, raw_password) VALUES (?, ?, ?, ?)',
      [username, email,  hashedPassword, password]
    );

    // Check if the user was successfully inserted
    if (result.affectedRows === 1) {
      res.json({ message: 'User registered successfully' });
    } else {
      res.status(500).json({ error: 'Failed to register user' });
    }
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  } finally {
    connection.end();
  }
});





// LOGIN Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const connection = await connectDB();
  try {
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email= ?',
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Email not found' });
    }

    const valid = await bcrypt.compare(password, users[0].password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

     const user = {
      id: users[0].id,
      username: users[0].username,
      email: users[0].email,
    };

    res.json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  } finally {
    connection.end();
  }
});

 
// Fetch Products Route
app.get('/products', async (req, res) => {
  const conn = await connectDB();
  try {
    const [products] = await conn.execute('SELECT * FROM products WHERE quantity > 0');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  } finally {
    conn.end();
  }
});

// Update Stock Route
app.post('/api/update-stock', async (req, res) => {
  const { productId, quantityPurchased } = req.body;

  if (!productId || !Number.isInteger(quantityPurchased) || quantityPurchased <= 0) {
    return res.status(400).json({ error: 'Invalid product ID or quantity' });
  }

  const connection = await connectDB();
  try {
    await connection.beginTransaction();

    const [results] = await connection.execute(
      'SELECT quantity FROM products WHERE id = ? FOR UPDATE',
      [productId]
    );

    if (results.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentQuantity = results[0].quantity;

    if (currentQuantity < quantityPurchased) {
      await connection.rollback();
      return res.status(400).json({ error: 'Not enough stock' });
    }

    await connection.execute(
      'UPDATE products SET quantity = quantity - ? WHERE id = ?',
      [quantityPurchased, productId]
    );
    await connection.commit();
    res.json({ message: 'Stock updated successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Update failed', details: err.message });
  } finally {
    connection.end();
  }
});


app.post('/api/orders', async (req, res) => {
  const { items, userDetails, total, paymentMethod } = req.body;

  // Validate request body
  if (!items || !userDetails.email || !total || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const connection = await connectDB();

  try {
    // Start transaction
    await connection.beginTransaction();

    // Generate transaction and tracking IDs
    const transactionId =
      paymentMethod === "upi" ? `TXN${Date.now()}` : null; // Only generate transactionId for UPI
    const trackingId = `TRK${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // Insert into orders table
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (name, address, city, email, pincode, phone, payment_method, total_amount, transaction_id, tracking_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userDetails.name,
        userDetails.address,
        userDetails.city,
        userDetails.email,
        userDetails.pincode,
        userDetails.phone,
        paymentMethod,
        total,
        transactionId, // Save transactionId only if it's generated (UPI)
        trackingId,
      ]
    );
    
    // Before inserting the order, save or update user address
await connection.execute(
  `INSERT INTO user_addresses (email, name, address, city, pincode, phone) 
   VALUES (?, ?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE 
   name = VALUES(name), 
   address = VALUES(address), 
   city = VALUES(city), 
   pincode = VALUES(pincode), 
   phone = VALUES(phone)`,
  [
    userDetails.email,
    userDetails.name,
    userDetails.address,
    userDetails.city,
    userDetails.pincode,
    userDetails.phone,
  ]
);

    const orderId = orderResult.insertId;

    // Insert items into order_items table and update stock
    for (const item of items) {
      const totalAmount = item.quantity * item.product.price;

      // Insert order item
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product.id,
          item.quantity,
          item.product.price,
          totalAmount,
          item.product.name,
        ]
      );

      // Check and update stock
      const [stockResult] = await connection.execute(
        `SELECT quantity FROM products WHERE id = ? FOR UPDATE`,
        [item.product.id]
      );

      const currentStock = stockResult[0]?.quantity;
      if (currentStock === undefined || currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product.name}`);
      }

      await connection.execute(
        `UPDATE products SET quantity = quantity - ? WHERE id = ?`,
        [item.quantity, item.product.id]
      );
    }

    // Commit transaction
    await connection.commit();

    // Send success response
    res.status(201).json({
      success: true,
      message:'Order Created successfully',
      orderId,
      trackingId,
      transactionId, // Include transactionId only if it's generated
      userDetails,
      items,
      total,
      paymentMethod,
    });

    console.log({
      orderId,
      trackingId,
      transactionId,
      userDetails,
      items,
      total,
      paymentMethod,
    });
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    console.error('Error creating order:', error.message || error);
    res.status(500).json({ success: false, message: 'Order creation failed' });
  } finally {
    // Ensure connection is closed
    connection.end();
  }
});


app.get("/api/order", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const connection = await connectDB(); // Establish database connection
    const [orders] = await connection.execute(
      "SELECT id, name, address, city, email, pincode, phone, total_amount, payment_method, transaction_id, tracking_id, created_at FROM orders WHERE email = ?",
      [email]
    );

    console.log("Orders from DB:", orders); // Debug database response
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err.message || err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});



// Generate UPI Link Route
app.post('/api/generate-upi-link', (req, res) => {
  const { amount, orderId } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ error: 'Amount and Order ID required' });
  }

  const upiId = '7598162840@axl'; // Replace with your UPI ID
  const upiLink = `upi://pay?pa=${upiId}&pn=TechStore&am=${amount}&tn=${orderId}&cu=INR`;

  res.json({ upiLink, qrData: upiLink });
});

let orders = []; // simple in-memory store



// Save Cart Items for a User
app.post('/api/cart', async (req, res) => {
  const { userId, cartItems } = req.body;
  const connection = await connectDB();

  try {
    await connection.beginTransaction();

    // Clear existing cart items for the user
    await connection.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

    // Insert new cart items
    for (const item of cartItems) {
      await connection.execute(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, item.productId, item.quantity]
      );
    }

    await connection.commit();
    res.json({ message: 'Cart saved successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed to save cart', details: err.message });
  } finally {
    connection.end();
  }
});




app.get('/api/address/:email', async (req, res) => {
  const { email } = req.params;

  const connection = await connectDB();

  try {
    const [result] = await connection.execute(
      `SELECT name, address, city, pincode, phone 
       FROM user_addresses 
       WHERE email = ?`,
      [email]
    );

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No saved address found.' });
    }

    res.status(200).json({ success: true, address: result[0] });
  } catch (error) {
    console.error('Error fetching address:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to fetch address' });
  } finally {
    connection.end();
  }
});


// Add this near your other route imports
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// GET All Addresses
app.get('/api/address/:email', async (req, res) => {
  const { email } = req.params;
  const connection = await connectDB();
  
  try {
    const [result] = await connection.execute(
      `SELECT * FROM user_addresses WHERE email = ?`,
      [email]
    );

    // Return the MOST RECENT address (assuming multiple entries are possible)
    const latestAddress = result[result.length - 1]; 
    res.status(200).json({ success: true, address: latestAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch address" });
  } finally {
    connection.end();
  }
});

app.post('/api/save-address', async (req, res) => {
  const { name, address, city, email, pincode, phone } = req.body;
  const connection = await connectDB();

  try {
    // Insert or update the address
    await connection.execute(
      `INSERT INTO user_addresses (name, address, city, email, pincode, phone)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         address = VALUES(address),
         city = VALUES(city),
         pincode = VALUES(pincode),
         phone = VALUES(phone)`,
      [name, address, city, email, pincode, phone]
    );

    // Fetch and return the saved address
    const [savedAddress] = await connection.execute(
      `SELECT * FROM user_addresses WHERE email = ?`,
      [email]
    );

    res.json({ success: true, address: savedAddress[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save address." });
  } finally {
    connection.end();
  }
});

// Delete Address
app.delete("/api/delete-address/:id", async (req, res) => {
  try {
    const connection = await connectDB();
    await connection.execute("DELETE FROM user_addresses WHERE id = ?", [req.params.id]);
    connection.end();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: "rzp_test_EH1UEwLILEPXCj", // Replace with your actual Razorpay key_id
  key_secret: "ppM7JhyVpBtycmMcFGxYdacw", // Replace with your Razorpay key_secret
});

app.post("/api/create-order", async (req, res) => {
  const { amount, currency = "INR", receipt } = req.body;
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ success: false, message: "Failed to create order", error });
  }
});

// Endpoint to verify Razorpay payment
app.post("/api/verify-payment", (req, res) => {
  const { paymentId, orderId, signature } = req.body;

  if (!paymentId || !orderId || !signature) {
    return res.status(400).json({ success: false, message: "Invalid payment details" });
  }

  try {
    const generatedSignature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature === signature) {
      // Payment is verified successfully
      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
});


// 🔥 Route to convert image file to base64 and send to frontend
app.get('/api/image-base64/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'images', filename); // images folder inside backend

  try {
    // Check if image file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const ext = path.extname(filename).slice(1); // jpg, png etc
    const base64 = fs.readFileSync(imagePath, { encoding: 'base64' });

    res.json({
      image: `data:image/${ext};base64,${base64}` // send base64 with correct MIME type
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to convert image', details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
