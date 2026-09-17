/* =========================================================
   JORDAN PLUS PHARMACEUTICAL — Order cart (React)
   This is the "bit of React" in the site: a self-contained
   component with real state (useState/useEffect) that renders
   the cart and the bulk-order form, and listens for "add"
   events on window.jpCartBus fired by the plain-JS catalog.

   Note: this file is compiled in the browser via Babel
   Standalone for convenience (no build step needed to preview
   it on GitHub Pages). For a production app you'd precompile
   this with a real bundler (Vite/CRA) instead.
========================================================= */

const { useState, useEffect, useRef } = React;

const OWNER_PHONE = "2348035905191";
const OWNER_EMAIL = "jodaadedejio1@gmail.com";

function nairaFmt(n) {
  return "₦" + n.toLocaleString();
}

function OrderApp() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("jp_cart") || "[]"));
  const [form, setForm] = useState({
    business: "", name: "", phone: "", email: "",
    deliveryType: "Delivery", address: "", when: "",
    payment: "", notes: ""
  });
  const [validated, setValidated] = useState(false);
  const formRef = useRef(null);

  // Persist cart + listen for items pushed in from the vanilla catalog
  useEffect(() => {
    localStorage.setItem("jp_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    function handleAdd(e) {
      const { name, unit, unitLabel, price } = e.detail;
      setCart(prev => {
        const key = `${name}__${unit}`;
        const existing = prev.find(i => i.key === key);
        if (existing) {
          return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
        }
        return [...prev, { key, name, unit, unitLabel, price, qty: 1 }];
      });
    }
    window.jpCartBus.addEventListener("add", handleAdd);
    return () => window.jpCartBus.removeEventListener("add", handleAdd);
  }, []);

  function changeQty(key, delta) {
    setCart(prev => prev
      .map(i => i.key === key ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0));
  }

  function removeItem(key) {
    setCart(prev => prev.filter(i => i.key !== key));
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  function handleChange(e) {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const el = formRef.current;

    if (cart.length === 0) {
      window.jpShowToast("Add at least one item from the catalog before ordering.", "error");
      return;
    }
    if (!el.checkValidity()) {
      setValidated(true);
      return;
    }

    const itemLines = cart.map(i => `- ${i.qty} x ${i.name} (${i.unitLabel}) — ${nairaFmt(i.price * i.qty)}`).join("\n");

    const summary =
`New B2B order — ${form.business || "N/A"}
Contact: ${form.name}
Phone: ${form.phone}
Email: ${form.email}
Type: ${form.deliveryType}${form.deliveryType === "Delivery" ? " to " + form.address : " (pickup at Koan)"}
Preferred date: ${form.when || "as soon as possible"}
Payment: ${form.payment}
Items:
${itemLines}
Total: ${nairaFmt(total)}
Notes: ${form.notes || "none"}`;

    const orders = JSON.parse(localStorage.getItem("jp_orders") || "[]");
    orders.push({ ...form, items: cart, total, date: new Date().toISOString() });
    localStorage.setItem("jp_orders", JSON.stringify(orders));

    const waLink = `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(summary)}`;
    const mailLink = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent("New B2B order — " + (form.business || form.name))}&body=${encodeURIComponent(summary)}`;

    document.getElementById("confirmWhatsapp").href = waLink;
    document.getElementById("confirmEmail").href = mailLink;
    document.getElementById("confirmText").textContent =
      `Thanks ${form.name || "there"}! Your order (${nairaFmt(total)}) has been recorded. Tap a button below to also send it straight to Jordan Plus.`;

    new bootstrap.Modal(document.getElementById("confirmModal")).show();

    setCart([]);
    setForm({ business: "", name: "", phone: "", email: "", deliveryType: "Delivery", address: "", when: "", payment: "", notes: "" });
    setValidated(false);
  }

  return (
    <div className="row g-4">

      {/* Cart summary */}
      <div className="col-lg-5">
        <div className="jp-cart">
          <span className="jp-react-badge"><i className="bi bi-lightning-charge-fill"></i> Live React cart</span>
          <h3><i className="bi bi-basket3 me-2"></i>Your order</h3>
          {cart.length === 0 ? (
            <p className="text-muted small mb-0">Nothing here yet — add items from the drug catalog above.</p>
          ) : (
            <div>
              {cart.map(item => (
                <div className="jp-cart-row" key={item.key}>
                  <div>
                    <div className="jp-cart-name">{item.name}</div>
                    <div className="jp-cart-sub">{item.unitLabel} · {nairaFmt(item.price)} each</div>
                  </div>
                  <div className="jp-cart-qty">
                    <button type="button" onClick={() => changeQty(item.key, -1)} aria-label="Decrease quantity">−</button>
                    <span>{item.qty}</span>
                    <button type="button" onClick={() => changeQty(item.key, 1)} aria-label="Increase quantity">+</button>
                  </div>
                  <button type="button" className="jp-cart-remove" onClick={() => removeItem(item.key)}>Remove</button>
                </div>
              ))}
            </div>
          )}
          <div className="jp-cart-total d-flex justify-content-between">
            <span>Subtotal</span>
            <strong>{nairaFmt(total)}</strong>
          </div>
        </div>
      </div>

      {/* Order form */}
      <div className="col-lg-7">
        <form
          ref={formRef}
          className={"jp-form needs-validation" + (validated ? " was-validated" : "")}
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="business">Pharmacy / business name</label>
              <input type="text" className="form-control" id="business" value={form.business} onChange={handleChange} required />
              <div className="invalid-feedback">Tell us your business name.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="name">Contact person</label>
              <input type="text" className="form-control" id="name" value={form.name} onChange={handleChange} required />
              <div className="invalid-feedback">Who should we ask for?</div>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="phone">Phone number</label>
              <input type="tel" className="form-control" id="phone" value={form.phone} onChange={handleChange} required />
              <div className="invalid-feedback">We need a number to reach you on.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="email">Email</label>
              <input type="email" className="form-control" id="email" value={form.email} onChange={handleChange} required />
              <div className="invalid-feedback">A valid email helps us send your invoice.</div>
            </div>

            <div className="col-md-6">
              <label className="form-label d-block">Order type</label>
              <div className="btn-group w-100" role="group">
                <input type="radio" className="btn-check" name="deliveryType" id="typeDelivery"
                  checked={form.deliveryType === "Delivery"}
                  onChange={() => setForm(prev => ({ ...prev, deliveryType: "Delivery" }))} />
                <label className="btn btn-outline-jp" htmlFor="typeDelivery">Delivery</label>

                <input type="radio" className="btn-check" name="deliveryType" id="typePickup"
                  checked={form.deliveryType === "Pickup"}
                  onChange={() => setForm(prev => ({ ...prev, deliveryType: "Pickup" }))} />
                <label className="btn btn-outline-jp" htmlFor="typePickup">Pickup (Koan)</label>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="when">Preferred date &amp; time</label>
              <input type="datetime-local" className="form-control" id="when" value={form.when} onChange={handleChange} required />
              <div className="invalid-feedback">Pick a date and time.</div>
            </div>

            {form.deliveryType === "Delivery" && (
              <div className="col-12">
                <label className="form-label" htmlFor="address">Delivery address</label>
                <input type="text" className="form-control" id="address" value={form.address} onChange={handleChange} placeholder="Street, area, landmark" required />
                <div className="invalid-feedback">We need an address to deliver to.</div>
              </div>
            )}

            <div className="col-md-6">
              <label className="form-label" htmlFor="payment">Payment method</label>
              <select className="form-select" id="payment" value={form.payment} onChange={handleChange} required>
                <option value="">Choose one…</option>
                <option>Bank transfer</option>
                <option>Cash on delivery</option>
                <option>Invoice (net 7 days)</option>
                <option>Card online</option>
              </select>
              <div className="invalid-feedback">Select how you'll pay.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="notes">Anything we should know?</label>
              <input type="text" className="form-control" id="notes" value={form.notes} onChange={handleChange} placeholder="e.g. call before delivery" />
            </div>
          </div>

          <button type="submit" className="btn btn-jp btn-lg w-100 mt-4">
            <i className="bi bi-send-check me-2"></i>Place order
          </button>
          <p className="text-muted small mt-2 mb-0">We'll confirm on WhatsApp or email — no payment is taken here.</p>
        </form>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("jpOrderRoot")).render(<OrderApp />);
