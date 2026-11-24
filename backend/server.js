
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const STATUSES = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
  "Completed",
  "Rejected"
];

// ---------- DATABASE MODELS ----------

const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "student" }
}));

const Food = mongoose.model("Food", new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  image: String,
  available: { type: Boolean, default: true }
}));

const Order = mongoose.model("Order", new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [{
    name: String,
    price: Number,
    qty: Number
  }],
  total: Number,
  status: { type: String, default: "Pending" },
  paymentMethod: { type: String, default: "COD" },
  paymentStatus: { type: String, default: "Pending" }
}, { timestamps: true }));

// ---------- AUTH MIDDLEWARE ----------

const auth = (req, res, next) => {
  try {
    const token = (req.headers.authorization || "").split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Please login first"
      });
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired login"
    });
  }
};

const adminOnly = (req, res, next) => {
  req.user.role === "admin"
    ? next()
    : res.status(403).json({ message: "Admin only" });
};

const makeToken = (u) => ({
  token: jwt.sign(
    { id: u._id, role: u.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  ),
  id: u._id,
  name: u.name,
  role: u.role
});

// ---------- HELPER: VALIDATE CART ----------

const getOrderItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty");
  }

  const orderItems = [];
  let total = 0;

  for (const item of items) {
    if (
      !Number.isInteger(item.qty) ||
      item.qty < 1 ||
      item.qty > 50
    ) {
      throw new Error("Invalid quantity");
    }

    const food = await Food.findById(item.foodId);

    if (!food || !food.available) {
      throw new Error("An item is not available");
    }

    orderItems.push({
      name: food.name,
      price: food.price,
      qty: item.qty
    });

    total += food.price * item.qty;
  }

  return { orderItems, total };
};

// ---------- AUTH ROUTES ----------

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({
        message: "Name, email and password (min 6 chars) required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10)
    });

    res.json(makeToken(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: (req.body.email || "").trim().toLowerCase()
    });

    if (
      !user ||
      !(await bcrypt.compare(req.body.password || "", user.password))
    ) {
      return res.status(400).json({
        message: "Wrong email or password"
      });
    }

    res.json(makeToken(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- FOOD ROUTES ----------

app.get("/api/foods", async (req, res) => {
  try {
    res.json(await Food.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/foods", auth, adminOnly, async (req, res) => {
  try {
    const { name, category, price } = req.body;

    if (!name || !category || !(Number(price) > 0)) {
      return res.status(400).json({
        message: "Name, category and valid price required"
      });
    }

    const food = await Food.create({
      ...req.body,
      price: Number(price)
    });

    res.json(food);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/foods/:id", auth, adminOnly, async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({
        message: "Food not found"
      });
    }

    res.json(food);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/foods/:id", auth, adminOnly, async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      return res.status(404).json({
        message: "Food not found"
      });
    }

    res.json({
      success: true,
      message: "Food deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- PLACE ORDER: COD + DEMO ONLINE ----------

app.post("/api/orders", auth, async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    const selectedPayment = paymentMethod || "COD";

    if (!["COD", "ONLINE"].includes(selectedPayment)) {
      return res.status(400).json({
        message: "Invalid payment method"
      });
    }

    const { orderItems, total } = await getOrderItems(items);

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      total,
      paymentMethod: selectedPayment,
      paymentStatus:
        selectedPayment === "ONLINE" ? "Paid" : "Pending"
    });

    io.to("admin").emit(
      "notify",
      selectedPayment === "ONLINE"
        ? "New demo online payment order received!"
        : "New cash order received!"
    );

    res.json({
      success: true,
      message: "Order placed successfully",
      order
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ---------- STUDENT ORDERS ----------

app.get("/api/orders/my", auth, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id
    }).sort("-createdAt");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- ADMIN ORDERS ----------

app.get("/api/orders", auth, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name")
      .sort("-createdAt");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE ORDER STATUS

app.put("/api/orders/:id", auth, adminOnly, async (req, res) => {
  try {
    if (!STATUSES.includes(req.body.status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    io.to(String(order.user)).emit(
      "notify",
      "Your order is now: " + order.status
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE ORDER - ADMIN ONLY

app.delete("/api/orders/:id", auth, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    io.to(String(order.user)).emit(
      "notify",
      "Your order has been deleted by the canteen admin."
    );

    io.to("admin").emit(
      "notify",
      "An order has been deleted."
    );

    res.json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ---------- DAILY REPORT ----------

app.get("/api/reports", auth, adminOnly, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: start },
      status: { $ne: "Rejected" },
      $or: [
        { paymentMethod: "COD" },
        { paymentStatus: "Paid" }
      ]
    });

    res.json({
      orders: orders.length,
      sales: orders.reduce(
        (sum, order) => sum + order.total,
        0
      )
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- FAQ CHATBOT ----------

const faqs = [
  [["order", "how"], "Add items to cart, open Cart and place your order."],
  [["pay", "payment"], "Choose Cash on Pickup or Demo Online Payment at checkout. Demo payment does not deduct real money."],
  [["time", "open", "timing"], "The canteen is open from 9 AM to 5 PM on college days."],
  [["cancel"], "Please contact canteen staff to cancel a Pending order."],
  [["status", "track"], "Open My Orders to see your order status."],
  [["menu", "price"], "See the Menu page for food items and prices."]
];

app.post("/api/chat", (req, res) => {
  const text = (req.body.text || "").toLowerCase();

  const hit = faqs.find(([keys]) =>
    keys.some((key) => text.includes(key))
  );

  res.json({
    reply: hit
      ? hit[1]
      : "Sorry, I can answer questions about ordering, timing, payment and status."
  });
});

// ---------- SOCKET.IO ----------

io.on("connection", (socket) => {
  socket.on("join", (room) => socket.join(room));
});

// ---------- HEALTH CHECK ----------

app.get("/", (req, res) => {
  res.send("SmartCanteen Backend is Running!");
});

// ---------- START SERVER ----------

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected successfully!");

    if (!(await User.findOne({ role: "admin" }))) {
      await User.create({
        name: "Admin",
        email: "admin@canteen.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin"
      });

      console.log("Default admin created");
    }

    if ((await Food.countDocuments()) === 0) {
      const img = (name) =>
        "https://placehold.co/300x200?text=" + name;

      await Food.insertMany([
        { name: "Samosa", category: "Snacks", price: 15, image: img("Samosa") },
        { name: "Vada Pav", category: "Snacks", price: 20, image: img("Vada+Pav") },
        { name: "Veg Sandwich", category: "Snacks", price: 40, image: img("Sandwich") },
        { name: "Veg Biryani", category: "Meals", price: 90, image: img("Biryani") },
        { name: "Thali", category: "Meals", price: 100, image: img("Thali") },
        { name: "Tea", category: "Drinks", price: 10, image: img("Tea") },
        { name: "Cold Coffee", category: "Drinks", price: 40, image: img("Coffee") }
      ]);
    }

    server.listen(PORT, () => {
      console.log("SmartCanteen running on port " + PORT);
      console.log("Demo payment enabled - no real money is deducted");
    });

  })
  .catch((error) => {
    console.log("MongoDB error:", error.message);
  });
