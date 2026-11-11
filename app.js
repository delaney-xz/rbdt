import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const configured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId !== "YOUR_PROJECT_ID";
const grid = document.querySelector("#product-grid");
const count = document.querySelector("#product-count");
const toast = document.querySelector("#toast");
const filters = document.querySelectorAll(".filter");
let products = [];
let activeCategory = "সব";
let selectedProduct = null;
let auth = null, db = null, unsubscribe = null, currentUser = null;

document.querySelector("#year").textContent = new Date().getFullYear();

function showToast(message) {
  toast.textContent = message; toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}
function money(n) { return "৳" + Number(n || 0).toLocaleString("bn-BD"); }
function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function safeImage(url) {
  try { const u = new URL(url); return ["https:","http:"].includes(u.protocol) ? u.href : ""; } catch { return ""; }
}
function renderProducts() {
  const shown = products.filter(p => activeCategory === "সব" || p.category === activeCategory || (activeCategory === "নতুন কালেকশন" && p.isNew));
  count.textContent = `${shown.length.toLocaleString("bn-BD")}টি পণ্য`;
  if (!shown.length) { grid.innerHTML = '<div class="empty">এই ক্যাটাগরিতে এখনো পণ্য যোগ করা হয়নি। নতুন পণ্য শিগগিরই আসছে!</div>'; return; }
  grid.innerHTML = shown.map(p => {
    const discount = p.oldPrice > p.price ? Math.round((p.oldPrice-p.price)/p.oldPrice*100) : 0;
    const img = safeImage(p.image);
    return `<article class="product-card">
      <div class="product-image">${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy">` : `<div class="empty">ছবি যোগ করা হয়নি</div>`}
      ${discount ? `<span class="discount-tag">${discount.toLocaleString("bn-BD")}% ছাড়</span>` : ""}</div>
      <div class="product-info"><h3>${escapeHtml(p.name)}</h3><div class="product-color">কালার: ${escapeHtml(p.color || "ছবির মতো")} · ${escapeHtml(p.category || "")}</div>
      <div class="price-row"><span class="price">${money(p.price)}</span>${p.oldPrice > p.price ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}</div>
      <button class="order-btn" data-order="${escapeHtml(p.id)}">অর্ডার করুন</button></div></article>`;
  }).join("");
  grid.querySelectorAll("[data-order]").forEach(btn => btn.addEventListener("click", () => openOrder(products.find(p => p.id === btn.dataset.order))));
}
function openOrder(product) {
  if (!product) return;
  selectedProduct = product;
  document.querySelector("#order-product").textContent = `${product.name} · ${money(product.price)} · কালার: ${product.color || "ছবির মতো"}`;
  document.querySelector("#order-quantity").value = 1;
  updateTotal();
  document.querySelector("#order-modal").classList.add("show");
}
function updateTotal() {
  if (selectedProduct) document.querySelector("#order-total").textContent = money(selectedProduct.price * Number(document.querySelector("#order-quantity").value || 1));
}
document.querySelector("#order-quantity").addEventListener("input", updateTotal);
document.querySelector("#close-order").addEventListener("click", () => document.querySelector("#order-modal").classList.remove("show"));
document.querySelector("#close-modal").addEventListener("click", () => document.querySelector("#success-modal").classList.remove("show"));
document.querySelector("#order-form").addEventListener("submit", e => {
  e.preventDefault();
  if (!selectedProduct) return;
  const name = document.querySelector("#customer-name").value.trim();
  const phone = document.querySelector("#customer-phone").value.trim();
  const address = document.querySelector("#customer-address").value.trim();
  const qty = Math.max(1, Number(document.querySelector("#order-quantity").value || 1));
  const total = selectedProduct.price * qty;
  const message = [
    "নতুন অর্ডার — রুফাইদা অনলাইন শপ",
    "পণ্যের নাম: " + selectedProduct.name,
    "কালার: " + (selectedProduct.color || "উল্লেখ করা হয়নি"),
    "দাম: " + money(selectedProduct.price),
    "পরিমাণ: " + qty,
    "মোট: " + money(total),
    "কাস্টমারের নাম: " + name,
    "মোবাইল: " + phone,
    "সম্পূর্ণ ঠিকানা: " + address
  ].join("\n");
  const url = "https://wa.me/8801874734373?text=" + encodeURIComponent(message);
  document.querySelector("#order-modal").classList.remove("show");
  document.querySelector("#success-modal").classList.add("show");
  window.open(url, "_blank", "noopener");
  document.querySelector("#order-form").reset();
});

filters.forEach(btn => btn.addEventListener("click", () => {
  filters.forEach(b => b.classList.toggle("active", b === btn));
  activeCategory = btn.dataset.category; renderProducts();
}));

function renderAdminProducts() {
  const list = document.querySelector("#admin-product-list");
  if (!products.length) { list.innerHTML = '<p class="muted">এখনো কোনো পণ্য যোগ করা হয়নি।</p>'; return; }
  list.innerHTML = products.map(p => `<div class="admin-product-row"><div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.category)} · ${money(p.price)} · ${escapeHtml(p.color || "")}</small></div><div><button class="outline-btn" data-edit="${escapeHtml(p.id)}">এডিট</button><button class="outline-btn" data-delete="${escapeHtml(p.id)}">ডিলিট</button></div></div>`).join("");
  list.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => fillEdit(products.find(p => p.id === b.dataset.edit))));
  list.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", async () => {
    const p = products.find(x => x.id === b.dataset.delete);
    if (p && confirm(`"${p.name}" পণ্যটি মুছে ফেলবেন?`)) {
      try { await deleteDoc(doc(db, "products", p.id)); showToast("পণ্য মুছে ফেলা হয়েছে"); }
      catch (err) { showToast("মুছতে সমস্যা হয়েছে: " + err.message); }
    }
  }));
}
function fillEdit(p) {
  if (!p) return;
  document.querySelector("#edit-id").value = p.id;
  document.querySelector("#p-name").value = p.name || "";
  document.querySelector("#p-category").value = p.category || "ছেলে বাবু";
  document.querySelector("#p-color").value = p.color || "";
  document.querySelector("#p-old-price").value = p.oldPrice || "";
  document.querySelector("#p-price").value = p.price || "";
  document.querySelector("#p-image").value = p.image || "";
  document.querySelector("#p-description").value = p.description || "";
  document.querySelector("#product-message").textContent = "এডিট মোড: পরিবর্তন করে সংরক্ষণ করুন।";
  document.querySelector("#admin").scrollIntoView({behavior:"smooth"});
}
function clearProductForm() { document.querySelector("#product-form").reset(); document.querySelector("#edit-id").value = ""; document.querySelector("#product-message").textContent = ""; }
document.querySelector("#cancel-edit").addEventListener("click", clearProductForm);
document.querySelector("#product-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser || currentUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;
  const data = {
    name: document.querySelector("#p-name").value.trim(),
    category: document.querySelector("#p-category").value,
    color: document.querySelector("#p-color").value.trim(),
    oldPrice: Number(document.querySelector("#p-old-price").value || 0),
    price: Number(document.querySelector("#p-price").value),
    image: safeImage(document.querySelector("#p-image").value.trim()),
    description: document.querySelector("#p-description").value.trim(),
    isNew: document.querySelector("#p-category").value === "নতুন কালেকশন",
    updatedAt: serverTimestamp()
  };
  if (!data.name || !data.price) return;
  try {
    const id = document.querySelector("#edit-id").value;
    if (id) await updateDoc(doc(db, "products", id), data);
    else await addDoc(collection(db, "products"), {...data, createdAt: serverTimestamp()});
    clearProductForm(); document.querySelector("#product-message").textContent = "সফলভাবে সংরক্ষণ হয়েছে।";
  } catch (err) { document.querySelector("#product-message").textContent = "সংরক্ষণ হয়নি: " + err.message; }
});

function setLoggedIn(user) {
  currentUser = user;
  const allowed = user && ADMIN_EMAIL && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  document.querySelector("#login-panel").hidden = !!allowed;
  document.querySelector("#manage-panel").hidden = !allowed;
  if (allowed) {
    document.querySelector("#signed-in-as").textContent = "লগইন: " + user.email;
    if (unsubscribe) unsubscribe();
    unsubscribe = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), snap => {
      products = snap.docs.map(d => ({id:d.id, ...d.data()})); renderProducts(); renderAdminProducts();
    }, err => showToast("পণ্য লোড হয়নি: " + err.message));
  } else {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (user) signOut(auth);
  }
}
if (configured) {
  const app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app);
  onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), snap => {
    products = snap.docs.map(d => ({id:d.id, ...d.data()})); renderProducts();
  }, err => { grid.innerHTML = `<div class="empty">পণ্য লোড করা যাচ্ছে না। Firebase সেটআপ ও Firestore Rules পরীক্ষা করুন।</div>`; console.error(err); });
  onAuthStateChanged(auth, setLoggedIn);
  document.querySelector("#login-btn").addEventListener("click", async () => {
    const email = document.querySelector("#admin-email").value.trim();
    const password = document.querySelector("#admin-password").value;
    try {
      if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) throw new Error("এই ইমেইলটি অ্যাডমিন হিসেবে অনুমোদিত নয়।");
      await signInWithEmailAndPassword(auth, email, password);
      document.querySelector("#login-message").textContent = "";
    } catch (err) { document.querySelector("#login-message").textContent = "লগইন হয়নি: " + err.message; }
  });
  document.querySelector("#logout-btn").addEventListener("click", () => signOut(auth));
} else {
  grid.innerHTML = '<div class="empty">ওয়েবসাইট চালু করতে প্রথমে firebase-config.js ফাইলে Firebase Web App config বসান। এরপর README.md-এর ধাপ অনুসরণ করুন।</div>';
  document.querySelector("#login-message").textContent = "Firebase সেটআপ সম্পন্ন হলে অ্যাডমিন লগইন চালু হবে।";
  document.querySelector("#login-btn").disabled = true;
}
