
import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const SERVER = "http://localhost:5000";
const API = SERVER + "/api";
const socket = io(SERVER);

const foodImages = {
  Samosa: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600",
  "Vada Pav": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600",
  "Veg Sandwich": "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=600",
  "Veg Biryani": "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=600",
  Thali: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600",
  Tea: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600",
  "Cold Coffee": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600",
};

const getImage = (food) =>
  food.image?.includes("placehold.co")
    ? foodImages[food.name] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"
    : food.image || foodImages[food.name] ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";

const STATUSES = ["Pending", "Accepted", "Preparing", "Ready", "Completed", "Rejected"];

// AUTH
function Auth({ onLogin }) {
  const [isReg, setIsReg] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(API + (isReg ? "/register" : "/login"), form);
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-image">
        <div>
          <span className="hero-tag">WELCOME TO SMARTCANTEEN</span>
          <h1>Good Food.<br />Good Mood.</h1>
          <p>Fresh food, easy ordering and happy moments.</p>
        </div>
      </div>
      <div className="auth-form">
        <div className="auth-icon">🍔</div>
        <h2>{isReg ? "Create Account" : "Welcome Back!"}</h2>
        <p>Order your favourite food from your college canteen.</p>
        <form onSubmit={submit}>
          {isReg && (
            <input className="form-control mb-3" placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required />
          )}
          <input className="form-control mb-3" type="email" placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required />
          <input className="form-control mb-3" type="password" placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required />
          {error && <div className="alert alert-danger">{error}</div>}
          <button className="btn btn-primary w-100 py-2">
            {isReg ? "Create Account" : "Login"} →
          </button>
        </form>
        <p className="mt-3 text-center">
          {isReg ? "Already registered?" : "New student?"}
          <button className="btn btn-link" onClick={() => {
            setIsReg(!isReg);
            setError("");
          }}>
            {isReg ? "Login" : "Create Account"}
          </button>
        </p>
        <small className="text-muted">Admin demo: admin@canteen.com / admin123</small>
      </div>
    </div>
  );
}

// STUDENT MENU
function Menu({ cart, setCart }) {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(API + "/foods")
      .then((res) => setFoods(res.data))
      .catch(() => alert("Unable to load menu"))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...new Set(foods.map((f) => f.category))];
  const filtered = foods.filter((f) =>
    (category === "All" || f.category === category) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const add = (food) => {
    const found = cart.find((c) => c._id === food._id);
    setCart(found
      ? cart.map((c) => c._id === food._id ? { ...c, qty: c.qty + 1 } : c)
      : [...cart, { ...food, qty: 1 }]
    );
  };

  return (
    <>
      <section className="food-hero">
        <div className="hero-content">
          <span className="hero-tag">FRESH • TASTY • DELICIOUS</span>
          <h1>Your Favourite Food,<br />Just a Click Away!</h1>
          <p>Skip the queue. Order online and enjoy fresh food at your college.</p>
          <a href="#food-menu" className="btn btn-light hero-btn">Explore Menu ↓</a>
        </div>
        <div className="hero-food">
          <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800" alt="Food" />
        </div>
      </section>

      <section className="features">
        <div>🍱 <span>Fresh Food</span></div>
        <div>⚡ <span>Quick Ordering</span></div>
        <div>💳 <span>Easy Payment</span></div>
        <div>❤️ <span>Happy Eating</span></div>
      </section>

      <section id="food-menu" className="menu-section">
        <div className="section-heading">
          <div>
            <span className="section-label">OUR MENU</span>
            <h2>Explore Our Delicious Food</h2>
            <p>Choose your favourite food and order now!</p>
          </div>
          <div className="food-count">{filtered.length} Items</div>
        </div>

        <div className="menu-tools">
          <input className="form-control" placeholder="🔍 Search your favourite food..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="form-select" value={category}
            onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading ? <p className="text-center p-5">Loading delicious food...</p> : (
          <div className="food-grid">
            {filtered.map((food) => (
              <div className="food-card" key={food._id}>
                <div className="food-image">
                  <img src={getImage(food)} alt={food.name} />
                  <span className="food-category">{food.category}</span>
                </div>
                <div className="food-details">
                  <h5>{food.name}</h5>
                  <div className="food-bottom">
                    <h4>₹{food.price}</h4>
                    {food.available
                      ? <button onClick={() => add(food)}>+ Add</button>
                      : <span className="unavailable">Unavailable</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && <p className="text-center p-5">No food items found.</p>}
      </section>
    </>
  );
}

// CART AND UPI QR PAYMENT
function Cart({ cart, setCart, auth, done }) {
  const [payment, setPayment] = useState("COD");
  const [processing, setProcessing] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const change = (id, amount) => {
    setCart(cart.map((c) => c._id === id ? { ...c, qty: c.qty + amount } : c)
      .filter((c) => c.qty > 0));
  };

  const placeOrder = async () => {
    if (!cart.length || processing) return;

    if (payment === "ONLINE" && !window.confirm(
      `SMARTCANTEEN DEMO PAYMENT\n\nAmount: ₹${total}\n\nThis is a demo only. No real payment will happen and no money will be deducted.\n\nClick OK to confirm your order.`
    )) return;

    setProcessing(true);
    try {
      const items = cart.map((c) => ({ foodId: c._id, qty: c.qty }));
      await axios.post(API + "/orders", { items, paymentMethod: payment }, auth);
      alert(payment === "ONLINE"
        ? "Demo Payment Confirmed! Your order has been booked successfully."
        : "Your order has been placed! Pay at the canteen counter.");
      setCart([]);
      done();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to place order.");
    } finally {
      setProcessing(false);
    }
  };

  if (!cart.length) return (
    <div className="empty-cart">
      <div>🛒</div><h2>Your Cart is Empty</h2>
      <p>Add some delicious food to get started!</p>
    </div>
  );

  return (
    <div className="checkout-page">
      <h2>Your Shopping Cart 🛒</h2>
      <p>Review your items before checkout.</p>
      <div className="checkout-layout">
        <div className="cart-items">
          {cart.map((c) => (
            <div className="cart-item" key={c._id}>
              <img src={getImage(c)} alt={c.name} />
              <div className="cart-item-info">
                <h5>{c.name}</h5><p>₹{c.price} each</p>
                <div className="quantity">
                  <button onClick={() => change(c._id, -1)}>-</button>
                  <b>{c.qty}</b>
                  <button onClick={() => change(c._id, 1)}>+</button>
                </div>
              </div>
              <h5>₹{c.price * c.qty}</h5>
            </div>
          ))}
        </div>

        <div className="payment-card">
          <h4>Order Summary</h4>
          <div className="summary-line"><span>Subtotal</span><b>₹{total}</b></div>
          <div className="summary-line"><span>Delivery</span><b>Free</b></div>
          <hr />
          <div className="summary-line grand-total"><span>Total</span><b>₹{total}</b></div>

          <h5 className="mt-4">Select Payment Method</h5>

          <label className={`payment-option ${payment === "COD" ? "selected" : ""}`}>
            <input type="radio" checked={payment === "COD"} onChange={() => setPayment("COD")} />
            <span>💵</span>
            <div><b>Cash on Pickup</b><small>Pay at the canteen counter</small></div>
          </label>

          <label className={`payment-option ${payment === "ONLINE" ? "selected" : ""}`}>
            <input type="radio" checked={payment === "ONLINE"} onChange={() => setPayment("ONLINE")} />
            <span>📱</span>
            <div><b>UPI QR Code Payment</b><small>Demo QR code</small></div>
          </label>

          {payment === "ONLINE" && (
            <div className="text-center mt-3 p-3 border rounded">
              <h5>Scan QR Code</h5>
              <div className="demo-qr-art">
                <div className="demo-qr-corner corner-one"><span /></div>
                <div className="demo-qr-corner corner-two"><span /></div>
                <div className="demo-qr-corner corner-three"><span /></div>
                <div className="demo-qr-noise" />
                <div className="demo-qr-center">DEMO</div>
              </div>
              <h4>₹{total}</h4>
              <small className="text-muted">
                Demo QR only – not scannable for real payment.
              </small>
            </div>
          )}

          <button className="btn btn-primary w-100 mt-3 py-3" disabled={processing} onClick={placeOrder}>
            {processing ? "Please wait..." : payment === "COD" ? "Place Preorder →" : `Confirm Demo Payment →`}
          </button>
          <small className="text-muted d-block text-center mt-2">SmartCanteen Secure Checkout</small>
        </div>
      </div>
    </div>
  );
}

// STUDENT ORDERS
function MyOrders({ auth, refresh }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get(API + "/orders/my", auth).then((res) => setOrders(res.data)).catch(() => {});
  }, [refresh]);

  return (
    <div className="orders-page">
      <h2>My Orders 📦</h2><p>Track your food orders here.</p>
      {orders.length === 0 && <div className="empty-cart">
        <div>🍽️</div><h3>No Orders Yet</h3><p>Your delicious journey starts with your first order!</p>
      </div>}
      {orders.map((o) => (
        <div className="order-card" key={o._id}>
          <div className="d-flex justify-content-between">
            <b>Order #{o._id.slice(-6).toUpperCase()}</b>
            <span className="badge bg-warning text-dark">{o.status}</span>
          </div>
          <small>{new Date(o.createdAt).toLocaleString()}</small>
          <p className="mt-2">{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</p>
          <div className="d-flex justify-content-between">
            <b>Total: ₹{o.total}</b>
            <span>{o.paymentMethod === "ONLINE" ? "Demo Online Payment" : "Cash on Pickup"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ADMIN DASHBOARD
function Admin({ auth, refresh }) {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [report, setReport] = useState({ orders: 0, sales: 0 });

  const empty = { name: "", category: "", price: "", image: "" };
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = () => {
    axios.get(API + "/orders", auth).then((r) => setOrders(r.data)).catch(() => {});
    axios.get(API + "/foods").then((r) => setFoods(r.data)).catch(() => {});
    axios.get(API + "/reports", auth).then((r) => setReport(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [refresh]);

  const save = async () => {
    try {
      if (editId) await axios.put(API + "/foods/" + editId, form, auth);
      else await axios.post(API + "/foods", form, auth);

      setForm(empty);
      setEditId(null);
      load();
      alert("Menu updated successfully!");
    } catch (e) {
      alert(e.response?.data?.message || "Unable to save item");
    }
  };

  const deleteFood = async (id) => {
    if (!window.confirm("Delete this food item?")) return;
    try {
      await axios.delete(API + "/foods/" + id, auth);
      load();
      alert("Food item deleted successfully!");
    } catch (e) {
      alert(e.response?.data?.message || "Unable to delete item");
    }
  };

  // DELETE ORDER FROM DATABASE
  const deleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order permanently?")) {
      return;
    }

    try {
      await axios.delete(API + "/orders/" + id, auth);

      setOrders((current) => current.filter((order) => order._id !== id));

      await load();

      alert("Order deleted successfully!");
    } catch (e) {
      alert(e.response?.data?.message || "Unable to delete order");
    }
  };

  const setStatus = async (id, status) => {
    try {
      await axios.put(API + "/orders/" + id, { status }, auth);
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Unable to update order");
    }
  };

  const toggle = async (food) => {
    try {
      await axios.put(API + "/foods/" + food._id, {
        available: !food.available
      }, auth);
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Unable to update item");
    }
  };

  return (
    <div className="new-admin-dashboard">

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>🍔</span>
          <div>
            <h3>SmartCanteen</h3>
            <small>ADMIN PANEL</small>
          </div>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <button
          className={tab === "orders" ? "sidebar-link selected" : "sidebar-link"}
          onClick={() => setTab("orders")}
        >
          <span>📊</span> Dashboard
        </button>

        <button
          className={tab === "menu" ? "sidebar-link selected" : "sidebar-link"}
          onClick={() => setTab("menu")}
        >
          <span>🍽️</span> Manage Food
        </button>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">A</div>
            <div>
              <b>Administrator</b>
              <small>System Manager</small>
            </div>
          </div>
        </div>
      </aside>

      <section className="admin-main-content">

        <header className="admin-topbar">
          <div>
            <h2>{tab === "orders" ? "Dashboard Overview" : "Food Management"}</h2>
            <p>Welcome back! Manage your canteen operations.</p>
          </div>

          <div className="admin-top-right">
            <span className="admin-live">● Live Dashboard</span>
            <div className="admin-top-avatar">A</div>
          </div>
        </header>

        {tab === "orders" && (
          <>
            <div className="admin-welcome-banner">
              <div>
                <span>SMARTCANTEEN MANAGEMENT</span>
                <h2>Good Day, Admin! 👋</h2>
                <p>Here's what's happening with your canteen today.</p>
              </div>
              <div className="banner-icon">🍱</div>
            </div>

            <div className="new-admin-stats">
              <div className="new-stat-card">
                <div className="new-stat-icon purple">📦</div>
                <div>
                  <p>Total Orders Today</p>
                  <h2>{report.orders}</h2>
                  <small>Today's orders</small>
                </div>
              </div>

              <div className="new-stat-card">
                <div className="new-stat-icon green">💰</div>
                <div>
                  <p>Total Sales Today</p>
                  <h2>₹{report.sales}</h2>
                  <small>Today's revenue</small>
                </div>
              </div>

              <div className="new-stat-card">
                <div className="new-stat-icon orange">🍔</div>
                <div>
                  <p>Total Food Items</p>
                  <h2>{foods.length}</h2>
                  <small>Menu collection</small>
                </div>
              </div>

              <div className="new-stat-card">
                <div className="new-stat-icon blue">⏳</div>
                <div>
                  <p>Pending Orders</p>
                  <h2>{orders.filter(o => o.status === "Pending").length}</h2>
                  <small>Need attention</small>
                </div>
              </div>
            </div>

            <div className="admin-content-card">
              <div className="admin-section-heading">
                <div>
                  <h3>Recent Orders</h3>
                  <p>View and manage student food orders.</p>
                </div>
                <span className="orders-count">{orders.length} Orders</span>
              </div>

              {orders.length === 0 ? (
                <div className="admin-empty">
                  <span>📭</span>
                  <h3>No Orders Yet</h3>
                  <p>New student orders will appear here.</p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="new-admin-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>STUDENT</th>
                        <th>FOOD ITEMS</th>
                        <th>AMOUNT</th>
                        <th>PAYMENT</th>
                        <th>DATE</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id}>
                          <td>
                            <b>#{o._id.slice(-6).toUpperCase()}</b>
                          </td>

                          <td>{o.user?.name || "Student"}</td>

                          <td>
                            {o.items.map((i) =>
                              `${i.name} × ${i.qty}`
                            ).join(", ")}
                          </td>

                          <td><b>₹{o.total}</b></td>

                          <td>
                            {o.paymentMethod === "ONLINE" ? "UPI Demo" : "Cash"}
                          </td>

                          <td>
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>

                          <td>
                            <select
                              className={`admin-status-select status-${o.status?.toLowerCase()}`}
                              value={o.status}
                              onChange={(e) => setStatus(o._id, e.target.value)}
                            >
                              {STATUSES.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </td>

                          <td>
                            <button
                              className="admin-delete-order-btn"
                              onClick={() => deleteOrder(o._id)}
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "menu" && (
          <>
            <div className="admin-welcome-banner food-banner">
              <div>
                <span>MENU MANAGEMENT</span>
                <h2>Manage Your Food 🍔</h2>
                <p>Add, edit and manage your canteen food items.</p>
              </div>
              <div className="banner-icon">🥗</div>
            </div>

            <div className="admin-content-card admin-add-food">
              <div className="admin-section-heading">
                <div>
                  <h3>{editId ? "Edit Food Item" : "Add New Food Item"}</h3>
                  <p>Enter the food details below.</p>
                </div>
                <span className="add-food-icon">➕</span>
              </div>

              <div className="new-food-form">
                <div>
                  <label>Food Name</label>
                  <input
                    className="form-control"
                    placeholder="Enter food name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label>Category</label>
                  <input
                    className="form-control"
                    placeholder="Enter category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>

                <div>
                  <label>Price (₹)</label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="Enter price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>

                <div>
                  <label>Food Image URL</label>
                  <input
                    className="form-control"
                    placeholder="Paste image URL"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-buttons">
                <button className="admin-save-btn" onClick={save}>
                  {editId ? "✓ Update Food Item" : "+ Add Food Item"}
                </button>

                {editId && (
                  <button
                    className="admin-cancel-btn"
                    onClick={() => {
                      setForm(empty);
                      setEditId(null);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="admin-food-heading">
              <div>
                <h3>All Food Items</h3>
                <p>Manage availability and food details.</p>
              </div>
              <span>{foods.length} Items</span>
            </div>

            <div className="new-admin-food-grid">
              {foods.map((f) => (
                <div className="new-admin-food-card" key={f._id}>
                  <div className="new-admin-food-image">
                    <img src={getImage(f)} alt={f.name} />
                    <span className={f.available ? "food-active" : "food-inactive"}>
                      {f.available ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <div className="new-admin-food-details">
                    <h4>{f.name}</h4>
                    <p>{f.category}</p>
                    <h3>₹{f.price}</h3>

                    <div className="new-admin-food-actions">
                      <button onClick={() => toggle(f)}>
                        {f.available ? "Disable" : "Enable"}
                      </button>

                      <button onClick={() => {
                        setEditId(f._id);
                        setForm({
                          name: f.name,
                          category: f.category,
                          price: f.price,
                          image: f.image || ""
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}>
                        ✏️ Edit
                      </button>

                      <button onClick={() => deleteFood(f._id)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </section>
    </div>
  );
}

// CHATBOT
function Chat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const send = async () => {
    if (!text.trim()) return;
    const question = text;
    setMessages((m) => [...m, { me: question }]);
    setText("");
    try {
      const res = await axios.post(API + "/chat", { text: question });
      setMessages((m) => [...m, { bot: res.data.reply }]);
    } catch {
      setMessages((m) => [...m, { bot: "Sorry, please try again." }]);
    }
  };

  return (
    <div className="chat-widget">
      {open && <div className="chat-box">
        <div className="chat-header">💬 SmartCanteen Help</div>
        <div className="chat-messages">
          {messages.map((m, i) => <p key={i} className={m.me ? "chat-me" : "chat-bot"}>{m.me || m.bot}</p>)}
          {messages.length === 0 && <p>Hello! How can I help you?</p>}
        </div>
        <div className="chat-input">
          <input className="form-control" placeholder="Ask something..." value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()} />
          <button onClick={send}>➤</button>
        </div>
      </div>}
      <button className="chat-toggle" onClick={() => setOpen(!open)}>💬 Help</button>
    </div>
  );
}

// MAIN APP
export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [page, setPage] = useState("menu");
  const [cart, setCart] = useState([]);
  const [msg, setMsg] = useState("");
  const [refresh, setRefresh] = useState(0);

  const auth = { headers: { Authorization: "Bearer " + user?.token } };

  useEffect(() => {
    if (!user) return;
    socket.emit("join", user.role === "admin" ? "admin" : user.id);
    const notify = (message) => {
      setMsg(message);
      setRefresh((n) => n + 1);
      setTimeout(() => setMsg(""), 5000);
    };
    socket.on("notify", notify);
    return () => socket.off("notify", notify);
  }, [user]);

  const login = (u) => {
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    setPage(u.role === "admin" ? "admin" : "menu");
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setCart([]);
    setPage("menu");
  };

  if (!user) return <Auth onLogin={login} />;

  return (
    <>
      <nav className="navbar navbar-expand-lg smart-navbar">
        <div className="container-fluid">
          <a className="navbar-brand" href="#home" onClick={() => setPage("menu")}>🍔 SmartCanteen</a>
          <div className="nav-actions">
            {user.role === "student" && <>
              <button onClick={() => setPage("menu")}>Home</button>
              <button onClick={() => setPage("cart")}>🛒 Cart ({cart.reduce((s, c) => s + c.qty, 0)})</button>
              <button onClick={() => setPage("orders")}>My Orders</button>
            </>}
            <span className="user-name">Hi, {user.name}</span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
      </nav>

      {msg && <div className="alert alert-success m-3">{msg}</div>}
      <main className="main-container">
        {user.role === "admin" ? <Admin auth={auth} refresh={refresh} /> : <>
          {page === "menu" && <Menu cart={cart} setCart={setCart} />}
          {page === "cart" && <Cart cart={cart} setCart={setCart} auth={auth}
            done={() => { setPage("orders"); setRefresh((n) => n + 1); }} />}
          {page === "orders" && <MyOrders auth={auth} refresh={refresh} />}
        </>}
      </main>

      <footer className="smart-footer">
        <h4>🍔 SmartCanteen</h4>
        <p>Fresh Food • Easy Ordering • Happy Eating</p>
        <small>© 2026 SmartCanteen. All rights reserved.</small>
      </footer>
      <Chat />
    </>
  );
}
