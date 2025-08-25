const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Razorpay = require("razorpay");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = '123!@#';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json());
app.use('/images', express.static('images')); // Serving static images

// ✅ MySQL Connection Pool
const pool = mysql.createPool({
  host: 'bzc4l5ypnuyygzydy1xh-mysql.services.clever-cloud.com',
  user: 'uwrnkvjswnpfwmxl',
  password: 'Hu3HboH6bCxP3nq3y31V',
  database: 'bzc4l5ypnuyygzydy1xh',
  waitForConnections: true,
  connectionLimit: 5, // Clever Cloud free limit
  queueLimit: 0
});

async function connectDB() {
  return pool;
}

// 🔹 SIGNUP
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const db = await connectDB();
  try {
    const [existing] = await db.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, raw_password) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, password]
    );

    if (result.affectedRows === 1) {
      res.json({ message: 'User registered successfully' });
    } else {
      res.status(500).json({ error: 'Failed to register user' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 🔹 LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = await connectDB();
  try {
    const [users] = await db.execute('SELECT * FROM users WHERE email= ?', [email]);
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
  }
});

// 🔹 Fetch Products
app.get('/products', async (req, res) => {
  const db = await connectDB();
  try {
    const [products] = await db.execute('SELECT * FROM products WHERE quantity > 0');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 🔹 Update Stock
app.post('/api/update-stock', async (req, res) => {
  const { productId, quantityPurchased } = req.body;
  if (!productId || !Number.isInteger(quantityPurchased) || quantityPurchased <= 0) {
    return res.status(400).json({ error: 'Invalid product ID or quantity' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [results] = await conn.execute('SELECT quantity FROM products WHERE id = ? FOR UPDATE', [productId]);

    if (results.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentQuantity = results[0].quantity;
    if (currentQuantity < quantityPurchased) {
      await conn.rollback();
      return res.status(400).json({ error: 'Not enough stock' });
    }

    await conn.execute('UPDATE products SET quantity = quantity - ? WHERE id = ?', [quantityPurchased, productId]);
    await conn.commit();
    res.json({ message: 'Stock updated successfully' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Update failed', details: err.message });
  } finally {
    conn.release();
  }
});

// 🔹 Create Order
app.post('/api/orders', async (req, res) => {
  const { items, userDetails, total, paymentMethod } = req.body;
  if (!items || !userDetails.email || !total || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const transactionId = paymentMethod === "upi" ? `TXN${Date.now()}` : null;
    const trackingId = `TRK${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    const [orderResult] = await conn.execute(
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
        transactionId,
        trackingId,
      ]
    );

    await conn.execute(
      `INSERT INTO user_addresses (email, name, address, city, pincode, phone) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       name = VALUES(name), address = VALUES(address), city = VALUES(city), pincode = VALUES(pincode), phone = VALUES(phone)`,
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

    for (const item of items) {
      const totalAmount = item.quantity * item.product.price;
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, price, total_price, product_name) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product.id, item.quantity, item.product.price, totalAmount, item.product.name]
      );

      const [stockResult] = await conn.execute(`SELECT quantity FROM products WHERE id = ? FOR UPDATE`, [item.product.id]);
      const currentStock = stockResult[0]?.quantity;
      if (!currentStock || currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product.name}`);
      }

      await conn.execute(`UPDATE products SET quantity = quantity - ? WHERE id = ?`, [item.quantity, item.product.id]);
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: 'Order Created successfully',
      orderId, trackingId, transactionId, userDetails, items, total, paymentMethod,
    });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Order creation failed' });
  } finally {
    conn.release();
  }
});

// 🔹 Fetch Orders
app.get("/api/order", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const db = await connectDB();
  try {
    const [orders] = await db.execute(
      "SELECT id, name, address, city, email, pincode, phone, total_amount, payment_method, transaction_id, tracking_id, created_at FROM orders WHERE email = ?",
      [email]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// 🔹 Save Cart
app.post('/api/cart', async (req, res) => {
  const { userId, cartItems } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

    for (const item of cartItems) {
      await conn.execute('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, item.productId, item.quantity]);
    }

    await conn.commit();
    res.json({ message: 'Cart saved successfully' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Failed to save cart' });
  } finally {
    conn.release();
  }
});

// 🔹 Address APIs (✅ keep only one GET)
app.get('/api/address/:email', async (req, res) => {
  const { email } = req.params;
  const db = await connectDB();
  try {
    const [result] = await db.execute(`SELECT * FROM user_addresses WHERE email = ?`, [email]);
    const latestAddress = result[result.length - 1];
    res.status(200).json({ success: true, address: latestAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch address" });
  }
});

app.post('/api/save-address', async (req, res) => {
  const { name, address, city, email, pincode, phone } = req.body;
  const db = await connectDB();
  try {
    await db.execute(
      `INSERT INTO user_addresses (name, address, city, email, pincode, phone)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address), city = VALUES(city), pincode = VALUES(pincode), phone = VALUES(phone)`,
      [name, address, city, email, pincode, phone]
    );
    const [savedAddress] = await db.execute(`SELECT * FROM user_addresses WHERE email = ?`, [email]);
    res.json({ success: true, address: savedAddress[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save address." });
  }
});

app.delete("/api/delete-address/:id", async (req, res) => {
  try {
    const db = await connectDB();
    await db.execute("DELETE FROM user_addresses WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔹 Razorpay Integration
const razorpay = new Razorpay({
  key_id: "rzp_test_EH1UEwLILEPXCj",
  key_secret: "ppM7JhyVpBtycmMcFGxYdacw",
});

app.post("/api/create-order", async (req, res) => {
  const { amount, currency = "INR", receipt } = req.body;
  try {
    const options = { amount: amount * 100, currency, receipt };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

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
      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
});

// 🔹 Convert image to base64
app.get('/api/image-base64/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'images', filename);

  try {
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const ext = path.extname(filename).slice(1);
    const base64 = fs.readFileSync(imagePath, { encoding: 'base64' });
    res.json({ image: `data:image/${ext};base64,${base64}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to convert image', details: err.message });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
