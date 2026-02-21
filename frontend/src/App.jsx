import { useEffect, useState } from "react";

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [result, setResult] = useState(null);
  const API = import.meta.env.VITE_API_BASE || "";

  useEffect(() => {
    fetch(`${API}/api/products`)
      .then(r => r.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const add = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const remove = (id) => setCart(c => {
    const next = { ...c };
    next[id] = Math.max(0, (next[id] || 0) - 1);
    if (next[id] === 0) delete next[id];
    return next;
  });

  const checkout = async () => {
    const items = Object.entries(cart).map(([id, qty]) => ({ id, qty }));
    const res = await fetch(`${API}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1>Kitten Feed Store 🐾</h1>
      <p>Select food and checkout (no database, demo).</p>

      <h2>Products</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {products.map(p => (
          <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
            <b>{p.name}</b>
            <div>${p.price}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => remove(p.id)}>-</button>
              <span>{cart[p.id] || 0}</span>
              <button onClick={() => add(p.id)}>+</button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 28 }}>Checkout</h2>
      <button onClick={checkout} disabled={Object.keys(cart).length === 0}>
        Create Order
      </button>

      {result && (
        <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 12, marginTop: 12 }}>
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
