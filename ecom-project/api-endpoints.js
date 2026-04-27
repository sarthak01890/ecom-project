// ═══════════════════════════════════════════════════════════
// E-COM MongoDB API Endpoints
// Frontend mein in endpoints ko use karo
// ═══════════════════════════════════════════════════════════

const API_BASE = 'http://localhost:5000/api';

// ━━━ PRODUCTS ━━━
async function getProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function getProduct(productId) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// ━━━ ORDERS ━━━
async function createOrder(orderData) {
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    return { error: error.message };
  }
}

async function getOrders() {
  try {
    const response = await fetch(`${API_BASE}/orders`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// ━━━ WISHLIST ━━━
async function addToWishlist(wishlistItem) {
  try {
    const response = await fetch(`${API_BASE}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wishlistItem)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return { error: error.message };
  }
}

async function getWishlist() {
  try {
    const response = await fetch(`${API_BASE}/wishlist`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }
}

// ━━━ USAGE IN index.html ━━━
/*
// Frontend mein use karo:

// Products load karo
const products = await getProducts();

// Order place karo
const orderData = {
  userId: null,
  items: cart,
  shipping: {
    firstName: document.getElementById('cf_first').value,
    lastName: document.getElementById('cf_last').value,
    email: document.getElementById('cf_email').value,
    phone: document.getElementById('cf_phone').value,
    address: document.getElementById('cf_addr').value,
    city: document.getElementById('cf_city').value,
    pinCode: document.getElementById('cf_pin').value,
  },
  total: cartTotal,
};
const result = await createOrder(orderData);

// Wishlist add karo
const wishItem = {
  productId: product.id,
  productName: product.name,
  productImg: product.img,
  price: product.price,
};
await addToWishlist(wishItem);
*/
