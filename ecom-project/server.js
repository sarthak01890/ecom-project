const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const http = require('http');
const { Server: SocketIO } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ═══ MIDDLEWARE ═══
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ═══ FILE UPLOAD CONFIG ═══
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    console.log('📁 Upload destination:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + '-' + file.originalname;
    console.log('📄 Generated filename:', filename);
    cb(null, filename);
  }
});
const upload = multer({ storage });

// ═══ DATABASE CONNECTION ═══
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_LOCAL;
    
    if (!mongoURI) {
      console.error('❌ ERROR: MONGODB_URI not found in .env file!');
      console.log('💡 Please add MONGODB_URI to .env file');
      process.exit(1);
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 45000,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      writeConcern: { w: 'majority' }
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Database: ecom-db');
    
    // Monitor connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected - attempting to reconnect...');
    });
    
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error.message);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check MongoDB URI in .env file');
    console.log('   2. Ensure MongoDB is running');
    console.log('   3. Check network access in MongoDB Atlas');
    console.log('   4. Check your internet connection');
    process.exit(1);
  }
};

connectDB();

// ═══ SCHEMAS ═══

// User Schema (Sign Up ke data ko store karega)
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    trim: true
  },
  username: { 
    type: String, 
    unique: true, 
    required: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    trim: true
  },
  avatar: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Product Schema
const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  brand: String,
  price: Number,
  oldPrice: Number,
  img: String,
  badge: String,
  rating: String,
  gender: String,
  category: String,
  tags: [String],
  sizes: [String],
  desc: String,
  stock: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now },
});

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  items: [{
    productId: Number,
    name: String,
    price: Number,
    quantity: Number,
    size: String,
  }],
  shipping: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    pinCode: String,
  },
  total: Number,
  status: { type: String, default: 'pending' }, // pending, confirmed, shipped, delivered
  createdAt: { type: Date, default: Date.now },
});

// Wishlist Schema
const wishlistSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  productId: Number,
  productName: String,
  productImg: String,
  price: Number,
  addedAt: { type: Date, default: Date.now },
});

// Cart Schema - Track user ke add to cart items
const cartSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  productId: Number,
  productName: String,
  price: Number,
  quantity: Number,
  size: String,
  addedAt: { type: Date, default: Date.now },
});

// ═══ RENTAL SCHEMAS ═══

// Rental Product Schema
const rentalProductSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  ownerName: String,
  ownerEmail: String,
  title: String,
  description: String,
  category: String, // wedding-suit, kurta, shoes, watch, tie, suitcase, etc.
  pricePerDay: Number,
  images: [String], // Array of image URLs
  sizes: [String], // For clothing items
  condition: { type: String, default: 'excellent' }, // excellent, good, fair
  availability: { type: Boolean, default: true },
  quantity: Number,
  rating: { type: Number, default: 0 },
  reviews: [{
    userId: mongoose.Schema.Types.ObjectId,
    userName: String,
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Rental Booking Schema
const rentalBookingSchema = new mongoose.Schema({
  rentalProductId: mongoose.Schema.Types.ObjectId,
  renterId: mongoose.Schema.Types.ObjectId,
  renterName: String,
  renterEmail: String,
  ownerId: mongoose.Schema.Types.ObjectId,
  productTitle: String,
  startDate: Date,
  endDate: Date,
  numberOfDays: Number,
  pricePerDay: Number,
  totalPrice: Number,
  securityDeposit: Number,
  status: { type: String, default: 'pending' }, // pending, confirmed, active, completed, cancelled
  paymentStatus: { type: String, default: 'unpaid' }, // unpaid, paid, refunded
  createdAt: { type: Date, default: Date.now }
});

// Messages Schema - For real-time chat
const messageSchema = new mongoose.Schema({
  senderId: mongoose.Schema.Types.ObjectId,
  senderName: String,
  receiverId: mongoose.Schema.Types.ObjectId,
  receiverName: String,
  bookingId: mongoose.Schema.Types.ObjectId,
  rentalProductId: mongoose.Schema.Types.ObjectId,
  message: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

// Wholesale Product Schema
const wholesaleProductSchema = new mongoose.Schema({
  sellerId: mongoose.Schema.Types.ObjectId,
  sellerName: String,
  sellerEmail: String,
  title: String,
  description: String,
  category: String, // electronics, clothing, home, books, etc.
  wholesalePrice: Number, // Minimum order price
  retailPrice: Number, // Suggested retail price
  minOrderQuantity: { type: Number, default: 10 },
  availableQuantity: Number,
  images: [String], // Array of image URLs
  specifications: String, // Product specs/details
  brand: String,
  condition: { type: String, default: 'new' }, // new, refurbished, used
  location: String, // Seller location
  shippingInfo: String,
  paymentTerms: String,
  availability: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  reviews: [{
    buyerId: mongoose.Schema.Types.ObjectId,
    buyerName: String,
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ═══ MODELS ═══
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
const Cart = mongoose.model('Cart', cartSchema);
const RentalProduct = mongoose.model('RentalProduct', rentalProductSchema);
const RentalBooking = mongoose.model('RentalBooking', rentalBookingSchema);
const Message = mongoose.model('Message', messageSchema);
const WholesaleProduct = mongoose.model('WholesaleProduct', wholesaleProductSchema);

// ═══ ROUTES ═══

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: '✅ Server running with MongoDB!', status: 'ok' });
});

// ━━━ AUTHENTICATION ROUTES ━━━

// SIGN UP - Naya user create karne ke liye
// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, username, password, fullName } = req.body;

    console.log('🔍 Signup attempt:', { email, username });

    // Validation
    if (!email || !username || !password) {
      console.log('❌ Validation failed: Missing fields');
      return res.status(400).json({ 
        error: 'Email, username, and password required' 
      });
    }

    // Check user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({ 
        error: 'Email or username already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user document in MongoDB
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      fullName: fullName || username,
      createdAt: new Date()
    });

    // Save to MongoDB - with explicit error handling
    await newUser.save();
    
    // Verify user was actually saved
    const savedUser = await User.findById(newUser._id);
    
    if (!savedUser) {
      console.error('⚠️  User created but could not be retrieved:', newUser._id);
      throw new Error('User save verification failed');
    }

    console.log(`✅ New user created successfully: ${email} (ID: ${newUser._id})`);

    res.status(201).json({
      message: '✅ Account created successfully!',
      success: true,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        fullName: newUser.fullName
      }
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    
    // More specific error messages
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ error: `${field} already exists` });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Invalid user data: ' + Object.values(error.errors).map(e => e.message).join(', ') });
    } else {
      res.status(500).json({ error: 'Server error: ' + error.message });
    }
  }
});

// LOGIN - User ko verify karne ke liye
// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password required' 
      });
    }

    // MongoDB se user find karo
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ Login failed: User not found:', email);
      return res.status(401).json({ 
        error: 'User not found' 
      });
    }

    // Password match karo
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log('❌ Login failed: Invalid password for user:', email);
      return res.status(401).json({ 
        error: 'Invalid password' 
      });
    }

    console.log(`✅ Login successful: ${email}`);

    res.status(200).json({
      message: '✅ Login successful!',
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// GET ALL USERS (Testing ke liye)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    console.log(`📊 Total users in database: ${users.length}`);
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET USER COUNT (Quick verification)
app.get('/api/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ 
      success: true,
      totalUsers: count,
      message: `Database contains ${count} registered users`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ━━━ PRODUCT ROUTES ━━━
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ 
      message: '✅ Order placed successfully!', 
      orderNumber: order._id,
      order: order 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to wishlist
app.post('/api/wishlist', async (req, res) => {
  try {
    const wishlistItem = new Wishlist(req.body);
    await wishlistItem.save();
    res.json({ message: '✅ Added to wishlist!', item: wishlistItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wishlist
app.get('/api/wishlist', async (req, res) => {
  try {
    const wishlist = await Wishlist.find();
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ━━━ CART ROUTES ━━━
// Add to cart
app.post('/api/cart/add', async (req, res) => {
  try {
    const { userId, productId, productName, price, quantity, size } = req.body;

    console.log('🛒 Cart add attempt:', { userId, productId, productName, quantity });

    if (!userId || !productId) {
      return res.status(400).json({ 
        error: 'User ID and Product ID required' 
      });
    }

    // Check if item already in cart
    const existingItem = await Cart.findOne({ 
      userId, 
      productId 
    });

    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
      await existingItem.save();
      console.log('✅ Cart item updated:', { productId, newQty: existingItem.quantity });
      res.json({ 
        message: '✅ Cart item updated!', 
        success: true,
        item: existingItem 
      });
    } else {
      // Add new item
      const cartItem = new Cart({
        userId,
        productId,
        productName,
        price,
        quantity,
        size: size || 'One Size'
      });
      
      await cartItem.save();
      console.log('✅ New cart item added:', { productId, quantity });
      res.status(201).json({ 
        message: '✅ Added to cart!', 
        success: true,
        item: cartItem 
      });
    }
  } catch (error) {
    console.error('❌ Cart add error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's cart
app.get('/api/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cartItems = await Cart.find({ userId });
    
    console.log(`📊 Cart for user ${userId}: ${cartItems.length} items`);
    
    res.json({
      success: true,
      userId: userId,
      itemCount: cartItems.length,
      items: cartItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove from cart
app.delete('/api/cart/:cartItemId', async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const result = await Cart.findByIdAndDelete(cartItemId);
    
    if (!result) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    console.log('✅ Cart item removed:', cartItemId);
    res.json({ message: '✅ Item removed from cart!', success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ━━━ WHOLESALE ROUTES ━━━

// Upload wholesale product
app.post('/api/wholesale/upload', upload.array('images', 5), async (req, res) => {
  try {
    const { sellerId, sellerName, sellerEmail, title, description, category, wholesalePrice, retailPrice, minOrderQuantity, availableQuantity, specifications, brand, condition, location, shippingInfo, paymentTerms } = req.body;
    
    console.log('📦 Wholesale product upload:', { title, category, wholesalePrice });

    if (!sellerId || !title || !wholesalePrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const imageUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const wholesaleProduct = new WholesaleProduct({
      sellerId: mongoose.Types.ObjectId(sellerId),
      sellerName,
      sellerEmail,
      title,
      description,
      category,
      wholesalePrice: parseFloat(wholesalePrice),
      retailPrice: retailPrice ? parseFloat(retailPrice) : null,
      minOrderQuantity: parseInt(minOrderQuantity) || 10,
      availableQuantity: parseInt(availableQuantity) || 0,
      images: imageUrls,
      specifications,
      brand,
      condition,
      location,
      shippingInfo,
      paymentTerms,
      availability: true
    });

    await wholesaleProduct.save();
    console.log('✅ Wholesale product created:', wholesaleProduct._id);

    res.status(201).json({
      message: '✅ Wholesale product uploaded!',
      success: true,
      product: wholesaleProduct
    });
  } catch (error) {
    console.error('❌ Wholesale upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all wholesale products
app.get('/api/wholesale/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, location } = req.query;
    let filter = { availability: true };

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.wholesalePrice = {};
      if (minPrice) filter.wholesalePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.wholesalePrice.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    const products = await WholesaleProduct.find(filter).sort({ createdAt: -1 });
    console.log(`📊 Found ${products.length} wholesale products`);

    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    console.error('❌ Wholesale products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single wholesale product
app.get('/api/wholesale/products/:productId', async (req, res) => {
  try {
    const product = await WholesaleProduct.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('❌ Wholesale product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ━━━ RENTAL ROUTES ━━━

// Test endpoint to create a sample rental product
app.post('/api/rental/test-upload', async (req, res) => {
  try {
    console.log('🧪 Creating test rental product...');
    
    const testProduct = new RentalProduct({
      ownerId: "507f1f77bcf86cd799439011",
      ownerName: "Test User",
      ownerEmail: "test@example.com",
      title: "Test Wedding Suit",
      description: "A beautiful test wedding suit for rent",
      category: "wedding-suit",
      pricePerDay: 500,
      images: [],
      sizes: [],
      condition: "excellent",
      quantity: 1,
      availability: true
    });

    await testProduct.save();
    console.log('✅ Test rental product created:', testProduct._id);

    res.status(201).json({
      message: '✅ Test product created!',
      success: true,
      product: testProduct
    });
  } catch (error) {
    console.error('❌ Test product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload rental product (with images)
app.post('/api/rental/upload', upload.array('images', 5), async (req, res) => {
  try {
    console.log('📤 Rental upload request - FormData keys:', Array.from(req.body.keys ? req.body.keys() : Object.keys(req.body)));
    console.log('📸 Files received:', req.files ? req.files.length : 0);
    
    const { ownerId, ownerName, ownerEmail, title, description, category, pricePerDay, sizes, quantity, condition } = req.body;
    
    console.log('📄 Extracted data:', { ownerId, title, category, pricePerDay });

    if (!ownerId || !title || !pricePerDay) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: ownerId, title, pricePerDay' });
    }

    const imageUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    console.log('🖼️ Image URLs:', imageUrls);

    const rentalProduct = new RentalProduct({
      ownerId: ownerId,
      ownerName,
      ownerEmail,
      title,
      description,
      category,
      pricePerDay: parseFloat(pricePerDay),
      images: imageUrls,
      sizes: sizes ? (Array.isArray(sizes) ? sizes : JSON.parse(sizes)) : [],
      condition,
      quantity: parseInt(quantity) || 1,
      availability: true
    });

    const savedProduct = await rentalProduct.save();
    console.log('✅ Rental product saved:', savedProduct._id);

    res.status(201).json({
      message: '✅ Product uploaded for rent!',
      success: true,
      product: savedProduct
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all rental products
app.get('/api/rental/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    let filter = { availability: true };

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await RentalProduct.find(filter).sort({ createdAt: -1 });
    console.log(`📊 Found ${products.length} rental products`);

    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single rental product
app.get('/api/rental/products/:productId', async (req, res) => {
  try {
    const product = await RentalProduct.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create rental booking
app.post('/api/rental/book', async (req, res) => {
  try {
    const { rentalProductId, renterId, renterName, renterEmail, startDate, endDate, ownerId } = req.body;

    console.log('📅 Booking request:', { rentalProductId, renterId, renterName });

    const product = await RentalProduct.findById(rentalProductId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = numberOfDays * product.pricePerDay;
    const securityDeposit = totalPrice * 0.2; // 20% security deposit

    const booking = new RentalBooking({
      rentalProductId,
      renterId,
      renterName,
      renterEmail,
      ownerId,
      productTitle: product.title,
      startDate: start,
      endDate: end,
      numberOfDays,
      pricePerDay: product.pricePerDay,
      totalPrice,
      securityDeposit,
      status: 'pending'
    });

    await booking.save();
    console.log('✅ Booking created:', booking._id);

    res.status(201).json({
      message: '✅ Booking request sent!',
      success: true,
      booking: booking
    });
  } catch (error) {
    console.error('❌ Booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's rental bookings
app.get('/api/rental/bookings/:userId', async (req, res) => {
  try {
    const bookings = await RentalBooking.find({
      $or: [
        { renterId: req.params.userId },
        { ownerId: req.params.userId }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings: bookings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking status
app.put('/api/rental/bookings/:bookingId', async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await RentalBooking.findByIdAndUpdate(
      req.params.bookingId,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log(`✅ Booking status updated: ${status}`);
    res.json({
      message: '✅ Booking updated!',
      success: true,
      booking: booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══ START SERVER ═══
// ━━━ MESSAGES API ━━━

// Get messages between two users for a specific product
app.get('/api/messages/:userId/:otherUserId/:productId', async (req, res) => {
  try {
    const { userId, otherUserId, productId } = req.params;
    
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId, rentalProductId: productId },
        { senderId: otherUserId, receiverId: userId, rentalProductId: productId }
      ]
    }).sort({ timestamp: 1 });
    
    res.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══ SOCKET.IO - Real-time Chat ═══
const activeChats = new Map(); // Store active chat connections

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join chat room
  socket.on('join-chat', (data) => {
    const { userId, otherUserId, productId, chatType } = data;
    const roomId = `${userId}-${otherUserId}-${productId}`;
    
    socket.join(roomId);
    activeChats.set(socket.id, { userId, otherUserId, productId, roomId, chatType });
    console.log(`💬 User ${userId} joined chat ${roomId} (${chatType})`);
  });

  // Send message
  socket.on('send-message', async (data) => {
    try {
      const { senderId, senderName, receiverId, receiverName, productId, chatType, message } = data;
      
      // Save message to MongoDB
      const newMessage = new Message({
        senderId,
        senderName,
        receiverId,
        receiverName,
        rentalProductId: productId, // Using rentalProductId field for both rental and wholesale
        message
      });
      
      await newMessage.save();
      
      // Emit to chat room
      const roomId = `${senderId}-${receiverId}-${productId}`;
      socket.to(roomId).emit('receive-message', {
        id: newMessage._id,
        senderId,
        senderName,
        message,
        timestamp: newMessage.timestamp,
        chatType: chatType || 'rental'
      });
      
      // Send notification to receiver
      socket.to(roomId).emit('message-notification', {
        senderId,
        senderName,
        message: message.substring(0, 50),
        productId,
        chatType: chatType || 'rental'
      });
      
      console.log(`💬 ${chatType} message saved: ${message.substring(0, 30)}...`);
    } catch (error) {
      console.error('❌ Message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    activeChats.delete(socket.id);
    console.log('👤 User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
  console.log(`✅ MongoDB: Connected & Ready`);
  console.log(`💬 Socket.io: Ready for real-time chat`);
  console.log(`\n📝 Signup: POST /api/auth/signup`);
  console.log(`📝 Login:  POST /api/auth/login`);
  console.log(`� Wholesale Upload: POST /api/wholesale/upload`);
  console.log(`📦 Wholesale Products: GET /api/wholesale/products`);
  console.log(`�📤 Rental Upload: POST /api/rental/upload`);
  console.log(`📋 Rental Products: GET /api/rental/products`);  console.log(`📅 Rental Booking: POST /api/rental/book`);  console.log(`📅 Rental Booking: POST /api/rental/book\n`);
});
