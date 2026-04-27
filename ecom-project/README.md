# E-Com — MongoDB Setup Guide ✅

E-Commerce store with **MongoDB** for data storage (Supabase removed ❌)

## Files
```
ecom-project/
├── index.html              ← Frontend (MongoDB connected ✅)
├── style.css               ← Styling
├── package.json            ← Node.js dependencies
├── server.js               ← Express + MongoDB backend
├── api-endpoints.js        ← API helper functions
├── mongodb-setup.md        ← Detailed setup guide
├── .env.example            ← Environment template
├── supabase-setup.sql      ← ❌ DEPRECATED (removed)
└── README.md               ← Yeh file
```

---

## QUICK START (3 Steps)

### STEP 1 — MongoDB Setup

**Option A: Cloud (Recommended)** 
- Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create free account & cluster
- Get connection string

**Option B: Local**
- Download from [mongodb.com](https://www.mongodb.com)
- Connection: `mongodb://localhost:27017/ecom-db`

Detailed guide: See `mongodb-setup.md`

### STEP 2 — Install & Configure

```bash
# Install dependencies
npm install

# Create .env file (copy template)
cp .env.example .env

# Edit .env with your MongoDB URI:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecom-db
```

### STEP 3 — Start Server

```bash
npm start
# Or with auto-reload: npm run dev
```

Server runs on: `http://localhost:5000`

---

## Verify Everything Works

**Open in browser:**
```
http://localhost:5000/api/health
```

Should show:
```json
{"message":"✅ Server running with MongoDB!","status":"ok"}
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/products` | GET | All products |
| `/api/products/:id` | GET | Single product |
| `/api/orders` | POST | Create order |
| `/api/orders` | GET | Get orders |
| `/api/wishlist` | POST | Add wishlist |
| `/api/wishlist` | GET | Get wishlist |

---

## Database Collections

**Auto-created by MongoDB:**

```
✓ users       - User profiles & authentication
✓ products    - Product catalog
✓ orders      - Customer orders  
✓ wishlists   - Saved items
```

---

## What Changed from Supabase ❌ → MongoDB ✅

| Feature | Supabase | MongoDB |
|---------|----------|---------|
| Database | PostgreSQL | NoSQL |
| Setup | Cloud only | Cloud + Local |
| Auth | Built-in | Manual (needed) |
| Backend | Serverless | Express server |
| SQL | Yes | No (JSON) |
| Free tier | Yes | Yes (Atlas) |

---

## Frontend Usage

In `index.html`, use helper functions from `api-endpoints.js`:

```javascript
// Get all products
const products = await getProducts();

// Place an order
const orderData = {
  userId: null,
  items: cart,
  shipping: { /* address info */ },
  total: 10000
};
const result = await createOrder(orderData);

// Add to wishlist
await addToWishlist({
  productId: product.id,
  productName: product.name,
  productImg: product.img,
  price: product.price
});
```

---

## Troubleshooting

### ❌ "Cannot connect to MongoDB"
- Verify MongoDB is running: `mongosh` (local) or check Atlas dashboard
- Check `.env` file has correct URI
- Ensure firewall allows port 27017 (local)

### ❌ "Server won't start"
- Kill existing Node process: `lsof -ti:5000 | xargs kill` (Mac/Linux) or `netstat -ano | findstr :5000` (Windows)
- Clear cache: `rm -rf node_modules && npm install`
- Check error logs in terminal

### ❌ "Products not loading"
- Ensure server is running: `npm start`
- Check browser console (F12)
- Verify API_BASE URL in index.html matches server

### ❌ "CORS errors"
- Ensure CORS is enabled in `server.js`
- Check frontend URL matches CORS whitelist
- Restart server after changes

---

## Features Working ✅

| Feature | Status |
|---------|--------|
| Browse products | ✅ Working |
| Search | ✅ Working |
| Filter by category | ✅ Working |
| Add to cart | ✅ Working (local) |
| Wishlist | ✅ Working (via MongoDB) |
| Checkout | ✅ Working (saves to DB) |
| Orders | ✅ Working (MongoDB) |

---

## Files Reference

- **server.js** - Express backend + MongoDB schemas
- **api-endpoints.js** - Frontend helper functions
- **mongodb-setup.md** - Complete MongoDB guide
- **package.json** - Dependencies
- **.env.example** - Configuration template

---

## Next Steps

1. ✅ MongoDB connected
2. ⏭️ Load product data to database
3. ⏭️ Add user authentication (JWT)
4. ⏭️ Add payment gateway
5. ⏭️ Deploy to production

**For detailed MongoDB setup:** See `mongodb-setup.md` 🚀
