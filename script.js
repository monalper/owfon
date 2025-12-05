const STORAGE_PRICE = "tly_m_price";
const STORAGE_DATE = "tly_m_date";

// --- AYARLAR VE AĞIRLIKLAR ---

// Sabit Getirili Kısım (BPP Fonu)
// Bu kısım borsa düşse de sabit getiri sağlar.
const BPP_WEIGHT = 23.34; 
const BPP_ANNUAL_RATE = 44.00; // Mevduat/Para piyasası yıllık tahmini getiri

// Portfolio Data (Görseldeki Dağılım)
const HOLDINGS = [
  { s: "TERA.IS", w: 20.31 },
  { s: "TEHOL.IS", w: 13.67 },
  { s: "SMRVA.IS", w: 9.17 },
  { s: "RALYH.IS", w: 8.23 },
  { s: "TRHOL.IS", w: 6.84 },
  { s: "PEKGY.IS", w: 6.75 },
  { s: "DSTKF.IS", w: 5.94 },
  
  // "DİĞER" kısmı XU100 endeksi ile takip ediliyor
  { s: "XU100.IS", w: 5.75, name: "DİĞER (BIST)" } 
];

// Toplam Ağırlık (Normalize etmek için kullanılır, görselde 100 olduğu için 100'dür)
const totalW = 100.0;

// UI Elements
const ui = {
  status: document.getElementById("statusIndicator"),
  estPrice: document.getElementById("estimatedPrice"),
  estChange: document.getElementById("estimatedChange"),
  offPrice: document.getElementById("officialPrice"),
  offDate: document.getElementById("officialDate"),
  list: document.getElementById("stockList"),
  refresh: document.getElementById("refreshBtn"),
  input: document.getElementById("manualPriceInput"),
  saveBtn: document.getElementById("saveManualBtn"),
  manualSection: document.getElementById("manualSection"),
  toggleManual: document.getElementById("toggleManualBtn")
};

// Helpers
const fmtMoney = (n) => n?.toLocaleString("tr-TR", {minimumFractionDigits: 4, maximumFractionDigits: 4}) ?? "-";
const fmtPct = (n) => n?.toLocaleString("tr-TR", {minimumFractionDigits: 2, maximumFractionDigits: 2}) ?? "-";
const setStatus = (msg) => ui.status.textContent = msg;

function getTefasDateStr(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth()+1).padStart(2, '0');
  return `${d}.${m}.${dateObj.getFullYear()}`;
}

// --- API İŞLEMLERİ (KRİTİK GÜNCELLEME) ---

async function getTefasPrice() {
  const today = new Date();
  // 7 gün geriye giderek son fiyatı bulmaya çalışır
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
    } catch(e) { console.error("Tefas Error:", e); }
  }
  return null;
}

async function getYahooData(symbol) {
  try {
    // interval=1d ve range=5d yaparak garanti veri çekiyoruz
    const res = await fetch(`/api/yahoo?symbol=${encodeURIComponent(symbol)}&interval=1d&range=5d`);
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    
    if (!result) return { pct: 0 };

    // Meta verisinden "Önceki Kapanış"ı (Previous Close) al
    // Bu veri, doğru yüzde değişimi hesaplamak için en güvenilir kaynaktır.
    const prevClose = result.meta.chartPreviousClose;
    
    // Anlık fiyat dizisi
    const quotes = result.indicators.quote[0].close;
    // Null olmayan son fiyatı bul
    const currentPrice = quotes.filter(q => q != null).pop();

    if (prevClose && currentPrice) {
      // (Son Fiyat - Önceki Kapanış) / Önceki Kapanış
      const changePct = ((currentPrice - prevClose) / prevClose) * 100;
      return { pct: changePct };
    }
    
    return { pct: 0 };

  } catch (err) {
    console.error(`Yahoo Data Error (${symbol}):`, err);
    return { pct: 0 };
  }
}

// --- ANA MANTIK ---
async function update() {
  ui.refresh.disabled = true;
  setStatus("Veriler çekiliyor...");
  ui.list.innerHTML = "";

  // 1. Baz Fiyatı Al (Tefas veya Manuel)
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

  // 2. Hisse Verilerini Çek ve Hesapla
  const promises = HOLDINGS.map(async h => {
    const { pct } = await getYahooData(h.s);
    
    // Portföye Etkisi = (Hissenin Günlük Değişimi) * (Portföydeki Ağırlığı)
    // Örnek: Hisse %10 arttı, ağırlığı %20 ise -> 10 * 0.20 = %2 etki.
    const impact = pct * (h.w / totalW);
    
    return { ...h, pct, impact };
  });

  const results = await Promise.all(promises);

  // 3. BPP (Para Piyasası) Sabit Getirisini Ekle
  // Günlük Getiri = Yıllık Oran / 365
  const dailyBppPct = BPP_ANNUAL_RATE / 365;
  const bppImpact = dailyBppPct * (BPP_WEIGHT / totalW);

  results.push({
    s: "BPP (Nakit/Fon)",
    w: BPP_WEIGHT,
    pct: dailyBppPct,
    impact: bppImpact,
    isFixed: true // Özel işaretleme
  });
  
  // 4. Listeyi Oluştur ve Toplamı Hesapla
  let totalWeightedPct = 0;

  // Ağırlığa göre sırala (İsteğe bağlı)
  results.sort((a,b) => b.w - a.w);

  results.forEach(r => {
    totalWeightedPct += r.impact;
    
    const item = document.createElement("div");
    item.className = "stock-item";
    
    // Renk Ayarları (Pozitif/Negatif)
    const isPos = r.pct >= 0;
    const colorClass = isPos ? "color-pos" : "color-neg";
    const sign = isPos ? "+" : "";
    
    const cleanSym = r.name ? r.name : r.s.replace(".IS",""); 
    
    // Etki gösterimi (Örn: +0.25%)
    const impactStr = `${sign}%${r.impact.toFixed(2)}`;

    item.innerHTML = `
      <div class="stock-main">
        <span class="stock-sym">${cleanSym}</span>
        <span class="stock-w">%${r.w.toFixed(2)}</span>
      </div>
      <div class="stock-vals">
        <div class="val-row">
           <span class="lbl">Değ:</span>
           <span class="stock-pct ${colorClass}">${sign}%${fmtPct(r.pct)}</span>
        </div>
        <div class="val-row">
           <span class="lbl">Etki:</span>
           <span class="stock-imp ${colorClass}">${impactStr}</span>
        </div>
      </div>
    `;
    ui.list.appendChild(item);
  });
  
  // İkonları güncelle
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // 5. Sonuçları Göster
  const finalSign = totalWeightedPct >= 0 ? "+" : "";
  const finalClass = totalWeightedPct >= 0 ? "pos" : "neg";
  
  ui.estChange.className = `change-badge ${finalClass}`;
  ui.estChange.textContent = `${finalSign}%${fmtPct(totalWeightedPct)}`;

  if (base && base.price) {
    const estimated = base.price * (1 + totalWeightedPct / 100);
    ui.estPrice.textContent = fmtMoney(estimated) + " ₺";
    
    const time = new Date().toLocaleTimeString("tr-TR", {hour: '2-digit', minute:'2-digit'});
    setStatus(`Güncellendi: ${time}`);
  } else {
    ui.estPrice.textContent = "--";
    setStatus("TEFAS fiyatı bekleniyor");
  }

  ui.refresh.disabled = false;
}

// Event Listeners

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

ui.toggleManual.addEventListener("click", () => {
  if (!ui.manualSection) return;
  ui.manualSection.classList.toggle("is-hidden");
});

// Otomatik Başlat
update();
