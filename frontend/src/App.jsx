import { useEffect, useMemo, useState } from "react";

const money = (n) => `$${n.toFixed(2)}`;

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({}); // id -> qty
  const [status, setStatus] = useState({ type: "idle", msg: "" });
  const [checkout, setCheckout] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const cartItems = useMemo(() => {
    return products
      .filter((p) => cart[p.id] > 0)
      .map((p) => ({ ...p, qty: cart[p.id] }));
  }, [products, cart]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.price * i.qty, 0),
    [cartItems]
  );

  const totalItems = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.qty, 0),
    [cartItems]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setStatus({ type: "loading", msg: "Loading products..." });
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProducts(data);
        setStatus({ type: "ok", msg: "" });
      } catch (e) {
        setStatus({
          type: "err",
          msg: "Backend is not reachable. Check service/ingress.",
        });
      }
    };
    load();
  }, []);

  const add = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const remove = (id) =>
    setCart((c) => {
      const next = { ...c };
      next[id] = Math.max(0, (next[id] || 0) - 1);
      if (next[id] === 0) delete next[id];
      return next;
    });

  const clearCart = () => setCart({});

  const placeOrder = async () => {
    if (!checkout.name || !checkout.phone || !checkout.address) {
      setStatus({ type: "err", msg: "Please fill all checkout fields." });
      return;
    }
    if (cartItems.length === 0) {
      setStatus({ type: "err", msg: "Your cart is empty." });
      return;
    }

    try {
      setStatus({ type: "loading", msg: "Placing order..." });
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: checkout,
          items: cartItems.map((i) => ({ id: i.id, qty: i.qty })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const out = await res.json();
      clearCart();
      setCheckout({ name: "", phone: "", address: "" });
      setStatus({
        type: "ok",
        msg: `✅ Order placed! Order ID: ${out.orderId}`,
      });
    } catch (e) {
      setStatus({ type: "err", msg: "Order failed. Try again." });
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.brand}>Kitten Feed Store</div>
          <div style={styles.tagline}>Healthy food for happy kittens 🐾</div>
        </div>

        <div style={styles.cartBadge}>
          <span style={{ fontWeight: 700 }}>Cart</span>
          <span style={styles.pill}>{totalItems}</span>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Best sellers</div>

          {status.type === "loading" && (
            <div style={styles.note}>{status.msg}</div>
          )}
          {status.type === "err" && (
            <div style={{ ...styles.note, ...styles.err }}>{status.msg}</div>
          )}

          <div style={styles.grid}>
            {products.map((p) => (
              <div key={p.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.kitIcon}>🐱</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.cardTitle}>{p.name}</div>
                    <div style={styles.cardDesc}>{p.description}</div>
                  </div>
                </div>

                <div style={styles.cardBottom}>
                  <div style={styles.price}>{money(p.price)}</div>
                  <div style={styles.qty}>
                    <button style={styles.btn} onClick={() => remove(p.id)}>
                      −
                    </button>
                    <div style={styles.qtyNum}>{cart[p.id] || 0}</div>
                    <button style={styles.btnPrimary} onClick={() => add(p.id)}>
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside style={styles.aside}>
          <div style={styles.asideCard}>
            <div style={styles.sectionTitle}>Checkout</div>

            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              value={checkout.name}
              onChange={(e) => setCheckout((c) => ({ ...c, name: e.target.value }))}
              placeholder="Your name"
            />

            <label style={styles.label}>Phone</label>
            <input
              style={styles.input}
              value={checkout.phone}
              onChange={(e) =>
                setCheckout((c) => ({ ...c, phone: e.target.value }))
              }
              placeholder="+1 (xxx) xxx-xxxx"
            />

            <label style={styles.label}>Address</label>
            <textarea
              style={{ ...styles.input, height: 80, resize: "none" }}
              value={checkout.address}
              onChange={(e) =>
                setCheckout((c) => ({ ...c, address: e.target.value }))
              }
              placeholder="Delivery address"
            />

            <div style={styles.summary}>
              <div style={styles.row}>
                <span>Items</span>
                <span>{totalItems}</span>
              </div>
              <div style={styles.row}>
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div style={styles.row}>
                <span>Shipping</span>
                <span>{subtotal > 0 ? "$4.99" : "$0.00"}</span>
              </div>
              <div style={{ ...styles.row, fontWeight: 800 }}>
                <span>Total</span>
                <span>{money(subtotal > 0 ? subtotal + 4.99 : 0)}</span>
              </div>
            </div>

            <button style={styles.checkoutBtn} onClick={placeOrder}>
              Place order
            </button>

            <button style={styles.clearBtn} onClick={clearCart}>
              Clear cart
            </button>

            {status.type === "ok" && status.msg && (
              <div style={{ ...styles.note, ...styles.ok }}>{status.msg}</div>
            )}
            {status.type === "err" && status.msg && (
              <div style={{ ...styles.note, ...styles.err }}>{status.msg}</div>
            )}
          </div>
        </aside>
      </main>

      <footer style={styles.footer}>
        <span>Demo project • Jenkins + DockerHub + GitOps + ArgoCD + EKS</span>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    background:
      "radial-gradient(1200px 800px at 20% 10%, #f0f7ff 0%, #ffffff 55%, #fff7f0 100%)",
    color: "#0f172a",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 26px",
    position: "sticky",
    top: 0,
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(15,23,42,0.08)",
  },
  brand: { fontSize: 22, fontWeight: 900, letterSpacing: 0.2 },
  tagline: { fontSize: 13, opacity: 0.75, marginTop: 4 },
  cartBadge: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "white",
  },
  pill: {
    display: "inline-flex",
    minWidth: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    padding: "0 8px",
    borderRadius: 999,
    background: "#0f172a",
    color: "white",
    fontWeight: 800,
    fontSize: 12,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "1.7fr 1fr",
    gap: 18,
    padding: 26,
    maxWidth: 1200,
    margin: "0 auto",
  },
  section: {},
  sectionTitle: { fontSize: 16, fontWeight: 900, marginBottom: 12 },
  note: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    background: "rgba(2, 132, 199, 0.08)",
    border: "1px solid rgba(2, 132, 199, 0.18)",
    fontSize: 13,
  },
  ok: {
    background: "rgba(16,185,129,0.10)",
    border: "1px solid rgba(16,185,129,0.25)",
  },
  err: {
    background: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(239,68,68,0.25)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  cardTop: { display: "flex", gap: 12, alignItems: "flex-start" },
  kitIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(15,23,42,0.06)",
    fontSize: 22,
  },
  cardTitle: { fontWeight: 900, fontSize: 15 },
  cardDesc: { fontSize: 12, opacity: 0.75, marginTop: 4, lineHeight: 1.4 },
  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { fontWeight: 900, fontSize: 15 },
  qty: { display: "flex", gap: 8, alignItems: "center" },
  qtyNum: {
    width: 30,
    textAlign: "center",
    fontWeight: 800,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,0.14)",
    background: "white",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: "32px",
  },
  btnPrimary: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(15,23,42,0.14)",
    background: "#0f172a",
    color: "white",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: "32px",
  },
  aside: { position: "sticky", top: 90, alignSelf: "start" },
  asideCard: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
  },
  label: { display: "block", fontSize: 12, fontWeight: 800, marginTop: 10 },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.14)",
    outline: "none",
    background: "white",
  },
  summary: {
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px solid rgba(15,23,42,0.10)",
    display: "grid",
    gap: 8,
    fontSize: 13,
  },
  row: { display: "flex", justifyContent: "space-between" },
  checkoutBtn: {
    width: "100%",
    marginTop: 14,
    padding: "12px 12px",
    borderRadius: 14,
    background: "#0f172a",
    color: "white",
    fontWeight: 900,
    border: "none",
    cursor: "pointer",
  },
  clearBtn: {
    width: "100%",
    marginTop: 10,
    padding: "12px 12px",
    borderRadius: 14,
    background: "white",
    color: "#0f172a",
    fontWeight: 900,
    border: "1px solid rgba(15,23,42,0.14)",
    cursor: "pointer",
  },
  footer: {
    padding: 18,
    textAlign: "center",
    fontSize: 12,
    opacity: 0.7,
  },
};
