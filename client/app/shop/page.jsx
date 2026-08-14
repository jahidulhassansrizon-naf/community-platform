"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import API from "../../services/api";
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";

export default function ShopPage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // New State for Product Details Modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
    phone: "",
  });

  // 1. Fetch User and Cart
  useEffect(() => {
    const fetchUserAndCart = async () => {
      try {
        const { data: userData } = await API.get("/auth/me");
        setUser(userData);

        if (userData && (userData._id || userData.id)) {
          const cartRes = await API.get("/cart");
          if (cartRes.data && cartRes.data.items) {
            setCart(cartRes.data.items);
          }
        }
      } catch (error) {
        console.error("Error fetching user or cart:", error);
      }
    };
    fetchUserAndCart();
  }, []);

  const updateCartInDB = async (updatedItems) => {
    if (user) {
      try {
        await API.post("/cart", { items: updatedItems });
      } catch (err) {
        console.error("Error saving cart to DB:", err);
      }
    }
  };

  // 2. Fetch Categories from Backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await API.get("/shop/categories");
        if (response.data && response.data.success) {
          setCategories(response.data.categories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // 3. Fetch Products from Local Backend Multi-Source Search Route
  useEffect(() => {
    const fetchProductsFromBackend = async () => {
      setLoading(true);
      try {
        const query = searchQuery ? searchQuery.trim() : "";
        const categoryParam =
          selectedCategory !== "all" ? selectedCategory : "";

        const response = await API.get(
          `/shop/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(categoryParam)}`,
        );

        if (response.data && response.data.success) {
          setProducts(response.data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching from backend search:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchProductsFromBackend();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory]);

  // Cart Functions
  const addToCart = (product, e) => {
    if (e) e.stopPropagation(); // Prevent opening modal when clicking cart button directly
    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => (item.productId || item.id) === product.id,
      );
      let updatedCart;
      if (existing) {
        updatedCart = prevCart.map((item) =>
          (item.productId || item.id) === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        updatedCart = [
          ...prevCart,
          {
            productId: product.id,
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1,
          },
        ];
      }
      updateCartInDB(updatedCart);
      return updatedCart;
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) => {
      const updatedCart = prevCart
        .map((item) => {
          const itemId = item.productId || item.id;
          if (itemId === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);

      updateCartInDB(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter(
        (item) => (item.productId || item.id) !== id,
      );
      updateCartInDB(updatedCart);
      return updatedCart;
    });
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Handle Checkout / Order Submission
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.phone) {
      alert("দয়া করে সব তথ্য পূরণ করুন!");
      return;
    }

    try {
      await API.post("/orders", {
        orderItems: cart,
        shippingAddress: shippingInfo,
        totalPrice: totalPrice,
        paymentMethod: "Cash on Delivery",
      });

      setOrderSuccess(true);
      await updateCartInDB([]);

      setTimeout(() => {
        setCart([]);
        setOrderSuccess(false);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        setShippingInfo({ name: "", address: "", phone: "" });
      }, 3000);
    } catch (err) {
      console.error("Order submission error:", err);
      alert("অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white/85 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Explore & Shop Products
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Find your favorite items, electronics, and accessories easily.
            </p>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all duration-300"
          >
            <ShoppingCart size={20} />
            <span>Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
            }}
            className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 shadow-xs capitalize"
          >
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-16 text-center border border-white shadow-sm">
            <ShoppingBag size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700">
              No products found
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-full h-48 bg-slate-50 rounded-2xl p-4 flex items-center justify-center mb-4 relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-2xs">
                      {product.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">
                    {product.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Price
                    </span>
                    <span className="text-lg font-black text-emerald-600">
                      ${product.price}
                    </span>
                  </div>
                  <button
                    onClick={(e) => addToCart(product, e)}
                    className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white p-3 rounded-2xl font-bold transition duration-300 shadow-2xs"
                    title="Add to Cart"
                  >
                    <ShoppingBag size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 relative animate-in zoom-in-95 duration-200 flex flex-col md:flex-row gap-6">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 z-10"
            >
              <X size={20} />
            </button>

            <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-50 rounded-2xl p-4 flex items-center justify-center relative">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                {selectedProduct.category}
              </span>
            </div>

            <div className="w-full md:w-1/2 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-2">
                  {selectedProduct.title}
                </h2>
                <span className="text-2xl font-black text-emerald-600 block mb-4">
                  ${selectedProduct.price}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-6">
                  {selectedProduct.description}
                </p>
              </div>

              <button
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingBag size={18} /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="text-emerald-600" size={22} />
                <h2 className="font-black text-lg text-slate-900">
                  Your Shopping Cart
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag
                    size={40}
                    className="mx-auto text-slate-300 mb-2"
                  />
                  <p className="text-sm font-bold text-slate-600">
                    Your cart is empty
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const itemId = item.productId || item.id;
                  return (
                    <div
                      key={itemId}
                      className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-14 h-14 object-contain bg-white rounded-xl p-1"
                      />
                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs font-black text-emerald-600 mt-0.5">
                          ${item.price}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(itemId, -1)}
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold text-slate-800 w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(itemId, 1)}
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(itemId)}
                        className="text-rose-400 hover:text-rose-600 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-500">
                    Total Amount:
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            {orderSuccess ? (
              <div className="text-center py-10">
                <CheckCircle2
                  size={64}
                  className="text-emerald-500 mx-auto mb-4 animate-bounce"
                />
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Order Placed Successfully!
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Thank you for your purchase. Cash on Delivery is confirmed.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-1">
                  Shipping Details
                </h2>
                <p className="text-xs text-slate-500 font-medium mb-6">
                  Enter your delivery address and contact info for Cash on
                  Delivery.
                </p>

                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={shippingInfo.name}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Delivery Address
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Street, City, Area"
                      value={shippingInfo.address}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          address: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +8801XXXXXXXXX"
                      value={shippingInfo.phone}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          phone: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs font-bold text-emerald-800 flex justify-between items-center">
                    <span>Payment Method:</span>
                    <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg">
                      Cash on Delivery
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition text-sm"
                    >
                      Confirm Order (${totalPrice.toFixed(2)})
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
