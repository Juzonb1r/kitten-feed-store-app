import express from "express";

const app = express();
app.use(express.json());

const PRODUCTS = [
  { id: "k1", name: "Kitten Chicken Crunch", price: 12.99 },
  { id: "k2", name: "Kitten Salmon Soft Bites", price: 14.49 },
  { id: "k3", name: "Kitten Milk Formula", price: 18.99 },
];

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/api/products", (req, res) => res.json(PRODUCTS));

app.post("/api/checkout", (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const total = items.reduce((sum, it) => {
    const p = PRODUCTS.find(x => x.id === it.id);
    const qty = Number(it.qty || 1);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const orderId = `ORD-${Date.now()}`;
  res.json({ orderId, total: Math.round(total * 100) / 100, status: "created" });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Backend running on :${port}`));
