const STORAGE_PRICE = "tly_m_price";
const STORAGE_DATE = "tly_m_date";

// --- AYARLAR VE AĞIRLIKLAR (GÜNCELLENDİ) ---

// Ters Repo Ayarları
const REPO_WEIGHT = 11.04; // Portföydeki Ters Repo Ağırlığı (%)
const REPO_ANNUAL_RATE = 39.50; // Tahmini Yıllık Ters Repo Faizi (%) - Piyasa faizlerine göre ayarlanabilir.

// DSTKF ve Diğer Hisseler Ayarları (%17.23'lük Grubun Ayrıştırılması)
// DİKKAT: DSTKF_REAL_W değerini kendi raporundaki gerçek oranla güncellemelisin!
const DSTKF_GROUP_TOTAL = 17.23;
const DSTKF_REAL_W = 4.65; // <--- TAHMİNİ DEĞER: DSTKF'nin tek başına ağırlığı. Lütfen düzeltin.
const OTHER_W = DSTKF_GROUP_TOTAL - DSTKF_REAL_W; // Kalan kısım XU100'e endekslenecek.

// Portfolio Data
// DSTKF.IS 17.23'lük ağırlığı bölünerek listeye eklendi.
const HOLDINGS = [
  { s: "TERA.IS", w: 22.49 }, 
  
  // Grubu İkiye Böldük
  { s: "DSTKF.IS", w: DSTKF_REAL_W },       // Gerçek DSTKF Ağırlığı
  // Bilinmeyen "Diğer" hisselerin BIST 100 (XU100.IS) ile hareket ettiğini varsayıyoruz.
  { s: "XU100.IS", w: OTHER_W, name: "DİĞER HİS." }, 
  
  { s: "TURSG.IS", w: 1.23 },  
  { s: "PEKGY.IS", w: 6.96 }, 
  { s: "TRHOL.IS", w: 7.48 },  
  { s: "RALYH.IS", w: 8.59 }, 
  { s: "SMRVA.IS", w: 8.72 }, 
  { s: "HMV.IS", w: 3.90 },  
  { s: "TEHOL.IS", w: 13.25 }
];

// Toplam Ağırlık Hesabı (Hisseler + Repo dahil edilerek normalize edildi)
const stocksTotalW = HOLDINGS.reduce((a, b) => a + b.w, 0);
const totalW = stocksTotalW + REPO_WEIGHT; 

// UI Elements (DEĞİŞMEDİ)
const ui = {
  status: document.getElementById("statusIndicator"),
  estPrice: document.getElementById("estimatedPrice"),
  estChange: document.getElementById("estimatedChange"),
  offPrice: document.getElementById("officialPrice"),
  offDate: document.getElementById("officialDate"),
  list: document.getElementById("stockList"),
  refresh: document.getElementById("refreshBtn"),
  input: document.getElementById("manualPriceInput"),
  saveBtn: document.getElementById("saveManualBtn")
};

// Helpers (DEĞİŞMEDİ)
const fmtMoney = (n) => n?.toLocaleString("tr-TR", {minimumFractionDigits: 4, maximumFractionDigits: 4}) ?? "-";
const fmtPct = (n) => n?.toLocaleString("tr-TR", {minimumFractionDigits: 2, maximumFractionDigits: 2}) ?? "-";
const setStatus = (msg) => ui.status.textContent = msg;

function getTefasDateStr(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth()+1).padStart(2, '0');
  return `${d}.${m}.${dateObj.getFullYear()}`;
}

// API Calls (DEĞİŞMEDİ)
async function getTefasPrice() {
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getTefasDateStr(d);
    
    try {
      const res = await fetch("/api/tefas", {
        method: "POST",
        body: `fontip=YAT&fonkod=TLY&bastarih=${dateStr}&bittarih=${dateStr}`
      });
      if(!res.ok) continue;
      const json = await res.json();
      const row = json?.data?.[0];
      
      if(row) {
        let p = row.FIYAT;
        if(typeof p === "string") p = parseFloat(p.replace(/\./g,"").replace(",","."));
        return { price: p, date: dateStr };
      }
    } catch(e) {}
  }
  return null;
}

async function getYahooData(symbol) {
  try {
    const res = await fetch(`/api/yahoo?symbol=${encodeURIComponent(symbol)}`);
    const json = await res.json();
    const quotes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    const valid = quotes.filter(q => q != null);
    if(valid.length < 2) return { pct: 0 };
    
    const first = valid[0];
    const last = valid[valid.length - 1];
    return { pct: (last - first) / first * 100 };
  } catch {
    return { pct: 0 };
  }
}

// Main Logic (GÜNCELLENDİ)
async function update() {
  ui.refresh.disabled = true;
  setStatus("Veriler güncelleniyor...");
  ui.list.innerHTML = "";

  // 1. Base Price (Tefas or Manual)
  let base = await getTefasPrice();
  
  const manualP = localStorage.getItem(STORAGE_PRICE);
  if (!base && manualP) {
    base = { price: parseFloat(manualP), date: localStorage.getItem(STORAGE_DATE) || "Manuel" };
  }

  if (base) {
    ui.offPrice.textContent = fmtMoney(base.price) + " ₺";
    ui.offDate.textContent = base.date;
  } else {
    ui.offPrice.textContent = "Veri Yok";
    ui.offDate.textContent = "-";
  }

  // 2. Stocks & Impact Calculation
  // Hisselerin Yahoo verilerini eş zamanlı çek
  const promises = HOLDINGS.map(async h => {
    const { pct } = await getYahooData(h.s);
    // Hissenin portföydeki *gerçek* ağırlığı (Repo dahil toplam içindeki payı)
    const normW = h.w / totalW; 
    const impact = pct * normW;
    return { ...h, pct, impact };
  });

  const results = await Promise.all(promises);

  // --- REPO HESAPLAMASI (EKLENDİ) ---
  // Günlük Getiri = Yıllık Oran / 365
  const dailyRepoPct = REPO_ANNUAL_RATE / 365;
  const repoNormW = REPO_WEIGHT / totalW;
  const repoImpact = dailyRepoPct * repoNormW;

  // Repoyu listeye ekle
  results.push({
    s: "TERS REPO",
    w: REPO_WEIGHT,
    pct: dailyRepoPct,
    impact: repoImpact
  });
  // ------------------------------------
  
  // 3. Render & Final Sum
  let totalWeightedPct = 0;

  results.forEach(r => {
    totalWeightedPct += r.impact;
    
    const item = document.createElement("div");
    item.className = "stock-item";
    
    // Görsel Ayarlar
    const colorClass = r.pct >= 0 ? "color-pos" : "color-neg";
    const sign = r.pct >= 0 ? "+" : "";
    
    // Sembol ismini belirle: Özel isim varsa onu kullan, yoksa .IS uzantısını temizle
    const cleanSym = r.name ? r.name : r.s.replace(".IS",""); 
    
    item.innerHTML = `
      <div class="stock-main">
        <span class="stock-sym">${cleanSym}</span>
        <span class="stock-w">%${r.w.toFixed(2)} Ağr.</span>
      </div>
      <div class="stock-vals">
        <span class="stock-pct ${colorClass}">${sign}%${fmtPct(r.pct)}</span>
        <span class="stock-imp ${colorClass}">${sign}${fmtPct(r.impact * 100)} bp</span>
      </div>
    `;
    ui.list.appendChild(item);
  });
  
  // Lucide ikonlarını yeniden oluştur (uygulamanın kullandığı kütüphane)
  if (typeof lucide !== 'undefined') {
      lucide.createIcons();
  }

  // 4. Final Display
  const finalSign = totalWeightedPct >= 0 ? "+" : "";
  const finalClass = totalWeightedPct >= 0 ? "pos" : "neg";
  
  ui.estChange.className = `change-badge ${finalClass}`;
  ui.estChange.textContent = `${finalSign}%${fmtPct(totalWeightedPct)}`;

  if (base && base.price) {
    const estimated = base.price * (1 + totalWeightedPct / 100);
    ui.estPrice.textContent = fmtMoney(estimated) + " ₺";
    setStatus("Son güncelleme: Şimdi");
  } else {
    ui.estPrice.textContent = "--";
    setStatus("TEFAS verisi eksik");
  }

  ui.refresh.disabled = false;
}

// Event Listeners (DEĞİŞMEDİ)
ui.saveBtn.addEventListener("click", () => {
  const val = parseFloat(ui.input.value);
  if(val > 0) {
    localStorage.setItem(STORAGE_PRICE, val);
    localStorage.setItem(STORAGE_DATE, getTefasDateStr(new Date()) + " (Manuel)");
    ui.input.value = "";
    update();
  }
});

if(localStorage.getItem(STORAGE_PRICE)) {
    ui.input.placeholder = localStorage.getItem(STORAGE_PRICE);
}

ui.refresh.addEventListener("click", update);

// Auto-start
update();


