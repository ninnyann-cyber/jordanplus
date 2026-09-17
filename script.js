/* =========================================================
   JORDAN PLUS PHARMACEUTICAL — front-end logic (vanilla part)
   The catalog, auth, reviews and contact form live here in
   plain JS. The order cart/form in #jpOrderRoot is a React
   component (see order-cart.jsx) — this file talks to it
   through a tiny event bus, window.jpCartBus.
   Accounts/orders/reviews are stored in localStorage as a
   front-end demo; swap in real API calls for production.
========================================================= */

const OWNER_PHONE = "2348035905191";      // international format, no +, no spaces
const OWNER_EMAIL = "jodaadedejio1@gmail.com";

document.getElementById("yr").textContent = new Date().getFullYear();

/* Simple event bus so the vanilla catalog can push items into
   the React cart without either side needing to know the other's internals. */
window.jpCartBus = new EventTarget();

/* ---------------------------------------------------------
   1. CATALOG DATA + RENDER
   unit prices: tablet = per pack/strip, roll = per roll, carton = per carton
   omit a key if that unit doesn't apply to the product
--------------------------------------------------------- */
const CATALOG = {
  analgesics: {
    label: "Pain Relief",
    items: [
      { name: "Paracetamol 500mg Tablets", desc: "Strip of 10 tablets.", icon: "bi-capsule", tablet: 150, carton: 13000 },
      { name: "Ibuprofen 400mg Tablets", desc: "Strip of 10 tablets.", icon: "bi-capsule", tablet: 200, carton: 17000 },
      { name: "Diclofenac 50mg Tablets", desc: "Strip of 10 tablets.", icon: "bi-capsule", tablet: 220, carton: 18500 }
    ]
  },
  antibiotics: {
    label: "Antibiotics",
    items: [
      { name: "Amoxicillin 500mg Capsules", desc: "Strip of 10 capsules.", icon: "bi-capsule", tablet: 350, carton: 30000 },
      { name: "Ciprofloxacin 500mg Tablets", desc: "Strip of 10 tablets.", icon: "bi-capsule", tablet: 400, carton: 34000 },
      { name: "Metronidazole 400mg Tablets", desc: "Strip of 10 tablets.", icon: "bi-capsule", tablet: 250, carton: 21000 }
    ]
  },
  antimalarials: {
    label: "Antimalarials",
    items: [
      { name: "Artemether/Lumefantrine Tablets", desc: "Full adult treatment pack.", icon: "bi-capsule", tablet: 600, carton: 52000 },
      { name: "Chloroquine Tablets", desc: "Strip of 10 tablets.", icon: "bi-capsule", tablet: 250, carton: 20000 }
    ]
  },
  vitamins: {
    label: "Vitamins & Supplements",
    items: [
      { name: "Vitamin C 1000mg Tablets", desc: "Strip of 10 tablets.", icon: "bi-capsule", tablet: 450, carton: 38000 },
      { name: "Multivitamin Syrup", desc: "100ml bottle.", icon: "bi-droplet-half", tablet: 900, carton: 40000 },
      { name: "Folic Acid Tablets", desc: "Strip of 10 tablets.", icon: "bi-capsule", tablet: 180, carton: 15000 }
    ]
  },
  supplies: {
    label: "Medical Supplies",
    items: [
      { name: "Cotton Wool Roll (500g)", desc: "Single roll.", icon: "bi-bandaid", roll: 800, carton: 17500 },
      { name: "Gauze Bandage Roll", desc: "Single roll.", icon: "bi-bandaid", roll: 350, carton: 15000 },
      { name: "Elastic Crepe Bandage Roll", desc: "Single roll.", icon: "bi-bandaid", roll: 500, carton: 20000 },
      { name: "ORS Sachets", desc: "Pack of 10 sachets.", icon: "bi-droplet-half", tablet: 500, carton: 18000 },
      { name: "Antiseptic Solution", desc: "250ml bottle.", icon: "bi-droplet-half", tablet: 1200, carton: 26000 }
    ]
  }
};

const UNIT_LABELS = { tablet: "Pack", roll: "Roll", carton: "Carton" };

function renderCatalog() {
  Object.entries(CATALOG).forEach(([key, group]) => {
    const pane = document.getElementById(`pane-${key}`);
    if (!pane) return;
    pane.innerHTML = group.items.map((item, idx) => {
      const units = Object.keys(UNIT_LABELS).filter(u => item[u] !== undefined);
      const priceRows = units.map(u => `
        <div><span>${UNIT_LABELS[u]}</span><strong>₦${item[u].toLocaleString()}</strong></div>
      `).join("");
      const options = units.map(u => `<option value="${u}">${UNIT_LABELS[u]}</option>`).join("");

      return `
      <div class="col-sm-6 col-lg-4">
        <div class="jp-item-card">
          <div class="jp-item-icon"><i class="bi ${item.icon}"></i></div>
          <p class="jp-item-name">${item.name}</p>
          <p class="jp-item-desc">${item.desc}</p>
          <div class="jp-item-prices">${priceRows}</div>
          <div class="jp-item-footer">
            <select class="form-select jp-unit-select" id="unit-${key}-${idx}">${options}</select>
            <button class="btn btn-jp jp-add-btn jp-quick-add"
              data-name="${item.name}"
              data-unit-select="unit-${key}-${idx}"
              data-tablet="${item.tablet ?? ""}"
              data-roll="${item.roll ?? ""}"
              data-carton="${item.carton ?? ""}">
              Add
            </button>
          </div>
        </div>
      </div>`;
    }).join("");
  });
}
renderCatalog();

/* ---------------------------------------------------------
   2. TOASTS
--------------------------------------------------------- */
function showToast(message, variant = "jp") {
  const host = document.getElementById("toastHost");
  const el = document.createElement("div");
  el.className = "toast jp-toast align-items-center border-0 text-white";
  el.style.background = variant === "error" ? "#B7333D" : "#145C39";
  el.setAttribute("role", "alert");
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  host.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 3800 });
  toast.show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}
window.jpShowToast = showToast;

/* ---------------------------------------------------------
   3. ADD-TO-CART BUTTONS -> dispatch to the React cart
--------------------------------------------------------- */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".jp-quick-add");
  if (!btn) return;

  let unit, price;
  if (btn.dataset.unitSelect) {
    const select = document.getElementById(btn.dataset.unitSelect);
    unit = select.value;
    price = Number(btn.dataset[unit]);
  } else {
    // hero card: only carton price offered, fall back gracefully
    unit = btn.dataset.tablet ? "tablet" : (btn.dataset.roll ? "roll" : "carton");
    price = Number(btn.dataset[unit]);
  }

  window.jpCartBus.dispatchEvent(new CustomEvent("add", {
    detail: { name: btn.dataset.name, unit, unitLabel: UNIT_LABELS[unit], price }
  }));
  showToast(`${btn.dataset.name} (${UNIT_LABELS[unit]}) added to your order`);
});

/* ---------------------------------------------------------
   4. REVIEWS
--------------------------------------------------------- */
const seedReviews = [
  { name: "Grace Pharmacy, Ikorodu", rating: 5, text: "Cartons arrived exactly as invoiced, no shortages. Now our default supplier.", date: "2 weeks ago" },
  { name: "MedCare Clinic", rating: 5, text: "Good to finally order antibiotics by the pack instead of a full carton for a small clinic.", date: "1 month ago" },
  { name: "Femi A.", rating: 4, text: "Delivery took a day longer than expected but everything was correctly packed.", date: "1 month ago" }
];

let reviews = JSON.parse(localStorage.getItem("jp_reviews") || "null") || seedReviews;

function starString(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function renderReviews() {
  const list = document.getElementById("reviewsList");
  list.innerHTML = reviews.slice().reverse().map(r => `
    <div class="jp-review-card">
      <div class="jp-review-top">
        <span class="jp-review-name">${r.name}</span>
        <span class="jp-review-stars">${starString(r.rating)}</span>
      </div>
      <p class="jp-review-text">${r.text}</p>
      <span class="jp-review-date">${r.date}</span>
    </div>
  `).join("");
}
renderReviews();

const starWrap = document.getElementById("revStars");
const starIcons = starWrap.querySelectorAll("i");
function paintStars(val) {
  starIcons.forEach(icon => icon.classList.toggle("active", Number(icon.dataset.val) <= val));
  starWrap.dataset.rating = val;
}
paintStars(5);
starIcons.forEach(icon => icon.addEventListener("click", () => paintStars(Number(icon.dataset.val))));

function validateForm(form) {
  form.classList.add("was-validated");
  return form.checkValidity();
}

document.getElementById("reviewForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form)) return;

  const name = document.getElementById("revName").value.trim();
  const text = document.getElementById("revText").value.trim();
  const rating = Number(starWrap.dataset.rating);

  reviews.push({ name, rating, text, date: "just now" });
  localStorage.setItem("jp_reviews", JSON.stringify(reviews));
  renderReviews();

  showToast("Thanks for the review!");
  form.reset();
  form.classList.remove("was-validated");
  paintStars(5);
});

/* ---------------------------------------------------------
   5. SIGN UP / LOG IN (client-side demo only)
--------------------------------------------------------- */
function getUsers() { return JSON.parse(localStorage.getItem("jp_users") || "[]"); }
function saveUsers(users) { localStorage.setItem("jp_users", JSON.stringify(users)); }

function setLoggedInUI(user) {
  const welcome = document.getElementById("jpWelcome");
  const loginBtn = document.getElementById("jpLoginBtn");
  const signupBtn = document.getElementById("jpSignupBtn");
  const logoutBtn = document.getElementById("jpLogoutBtn");

  if (user) {
    welcome.textContent = `Hi, ${user.name.split(" ")[0]} (${user.business})`;
    welcome.classList.remove("d-none");
    loginBtn.classList.add("d-none");
    signupBtn.classList.add("d-none");
    logoutBtn.classList.remove("d-none");
  } else {
    welcome.classList.add("d-none");
    loginBtn.classList.remove("d-none");
    signupBtn.classList.remove("d-none");
    logoutBtn.classList.add("d-none");
  }
}

const currentUser = JSON.parse(localStorage.getItem("jp_current_user") || "null");
setLoggedInUI(currentUser);

document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form)) return;

  const business = document.getElementById("suBusiness").value.trim();
  const name = document.getElementById("suName").value.trim();
  const email = document.getElementById("suEmail").value.trim().toLowerCase();
  const phone = document.getElementById("suPhone").value.trim();
  const password = document.getElementById("suPassword").value;

  const users = getUsers();
  if (users.some(u => u.email === email)) {
    showToast("That email already has an account — try logging in instead.", "error");
    return;
  }

  const newUser = { business, name, email, phone, password };
  users.push(newUser);
  saveUsers(users);
  localStorage.setItem("jp_current_user", JSON.stringify(newUser));
  setLoggedInUI(newUser);

  showToast(`Account created — welcome, ${name.split(" ")[0]}!`);
  form.reset();
  form.classList.remove("was-validated");
  bootstrap.Modal.getInstance(document.getElementById("signupModal")).hide();
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form)) return;

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  const users = getUsers();
  const match = users.find(u => u.email === email && u.password === password);

  if (!match) {
    showToast("Email or password doesn't match any account.", "error");
    return;
  }

  localStorage.setItem("jp_current_user", JSON.stringify(match));
  setLoggedInUI(match);
  showToast(`Welcome back, ${match.name.split(" ")[0]}!`);
  form.reset();
  form.classList.remove("was-validated");
  bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
});

document.getElementById("jpLogoutBtn").addEventListener("click", () => {
  localStorage.removeItem("jp_current_user");
  setLoggedInUI(null);
  showToast("You've been logged out. See you soon!");
});

/* ---------------------------------------------------------
   6. CONTACT FORM
--------------------------------------------------------- */
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form)) return;

  const name = document.getElementById("cName").value.trim();
  const email = document.getElementById("cEmail").value.trim();
  const message = document.getElementById("cMessage").value.trim();

  const mailLink = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent("Message from " + name + " via Jordan Plus site")}&body=${encodeURIComponent(message + "\n\nReply to: " + email)}`;
  window.open(mailLink, "_blank");

  showToast("Message sent! We'll get back to you soon.");
  form.reset();
  form.classList.remove("was-validated");
});
