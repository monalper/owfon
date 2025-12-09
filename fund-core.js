
// --- SHARED CORE LOGIC ---

class FundCalculator {
    constructor(config) {
        this.fundCode = config.fundCode;
        this.holdings = config.holdings;
        this.fixedComponents = config.fixedComponents || []; // e.g. BPP
        this.totalWeight = config.totalWeight || 100.0;

        // Storage keys unique to fund
        this.limitKey = `limit_${this.fundCode.toLowerCase()}`;
        this.storagePriceKey = `${this.fundCode.toLowerCase()}_m_price`;
        this.storageDateKey = `${this.fundCode.toLowerCase()}_m_date`;

        // UI
        this.ui = {
            status: document.getElementById("statusIndicator"),
            estPrice: document.getElementById("estimatedPrice"),
            estChange: document.getElementById("estimatedChange"),
            offPrice: document.getElementById("officialPrice"),
            offDate: document.getElementById("officialDate"),
            list: document.getElementById("stockList"),
            refresh: document.getElementById("refreshBtn"),
            toggle: document.getElementById("toggleManualBtn"),
            manualSection: document.getElementById("manualPriceSection"),
            input: document.getElementById("manualPriceInput"),
            saveBtn: document.getElementById("saveManualBtn"),
            title: document.querySelector(".brand-title"),
            share: document.getElementById("shareBtn")
        };

        this.init();
    }

    init() {
        this.injectLoader();

        if (this.ui.saveBtn) {
            this.ui.saveBtn.addEventListener("click", () => this.saveManualPrice());
        }

        if (this.ui.refresh) {
            this.ui.refresh.addEventListener("click", () => this.update());
        }

        if (this.ui.share) {
            this.ui.share.addEventListener("click", () => this.generateSnapshot());
        }

        if (this.ui.toggle && this.ui.manualSection) {
            this.ui.toggle.addEventListener("click", () => {
                this.ui.manualSection.classList.toggle("active");
                // Focus input if opened
                if (this.ui.manualSection.classList.contains("active") && this.ui.input) {
                    this.ui.input.focus();
                }
            });
        }

        if (localStorage.getItem(this.storagePriceKey) && this.ui.input) {
            this.ui.input.placeholder = localStorage.getItem(this.storagePriceKey);
        }

        this.update();
    }

    async generateSnapshot() {
        if (typeof html2canvas === 'undefined') {
            alert("Snapshot kütüphanesi yüklenemedi.");
            return;
        }

        this.toggleLoader(true);
        this.setStatus("Görsel hazırlanıyor...");

        // Determine Data
        // Reformat Price to 2 decimals for Snapshot
        let rawPrice = this.ui.estPrice.textContent; // e.g. "2.769,7345 ₺"
        let priceVal = parseFloat(rawPrice.replace(' ₺', '').replace(/\./g, '').replace(',', '.'));
        // If parsing fails for some reason (e.g. "--"), keep original
        const price = isNaN(priceVal) ? rawPrice : priceVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '₺';

        let rawChange = this.ui.estChange.textContent.trim();

        const isPos = this.ui.estChange.classList.contains('pos');

        // Colors
        // Green: #30D158 (Apple Green), Red: #FF453A (Apple Red)
        const accentColor = isPos ? '#30D158' : '#FF453A';
        // Background Gradients
        const bgGradient = isPos
            ? 'radial-gradient(circle at top left, #052e16 0%, #000000 100%)'
            : 'radial-gradient(circle at top left, #3f0e0e 0%, #000000 100%)';

        // Extract Number for reformatting (e.g. "+%0.33" -> "+0,33%")
        let numericPart = rawChange.replace(/[^0-9,.]/g, '');
        const sign = isPos ? "+" : "-";
        const formattedChange = `${sign}${numericPart}%`;

        const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

        // Fund Name Mapping
        const fundNames = {
            'TLY': 'Tera Portföy',
            'IOG': 'İş Portföy',
            'ZJI': 'Ziraat Portföy',
            'IIE': 'İstanbul Portföy',
            'DFI': 'Atlas Portföy'
        };
        const fullName = fundNames[this.fundCode] || "Serbest Fon";

        // Create Container
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '800px',
            height: '600px',
            background: bgGradient,
            color: '#FFFFFF',
            fontFamily: '"Inter Tight", sans-serif',
            borderRadius: '0',
            padding: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            zIndex: '9999'
        });

        // Icon path
        const fundLogo = `assets/${this.fundCode.toLowerCase()}.webp`;

        container.innerHTML = `
            <!-- Top Row -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; width:100%;">
                
                <!-- Logo & Title -->
                <div style="display:flex; align-items:center; gap:20px;">
                    <div style="
                        width:80px; height:80px; 
                        background:#fff; 
                        border-radius:20px; 
                        display:flex; align-items:center; justify-content:center; 
                        padding:5px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    ">
                        <img src="${fundLogo}" style="width:100%; height:100%; object-fit:contain; border-radius:14px;" crossorigin="anonymous">
                    </div>
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-size:48px; font-weight:800; line-height:1; letter-spacing:-1px;">${this.fundCode}</span>
                        <span style="font-size:24px; font-weight:600; color:#e0e0e0; margin-top:4px; white-space:nowrap;">${fullName.length > 35 ? fullName.substring(0, 32) + '...' : fullName}</span>
                    </div>
                </div>

                <!-- Date -->
                <div style="font-size:24px; font-weight:600; color:#e0e0e0; margin-bottom: 4px;">${date}</div>
            </div>

            <!-- Middle Row: Values -->
            <div style="flex:1; display:flex; align-items:center; justify-content:center; gap:40px;">
                <span style="font-size:80px; font-weight:800; color:${accentColor}; letter-spacing:-2px;">${formattedChange}</span>
                <span style="font-size:80px; font-weight:800; color:#ffffff; letter-spacing:-2px;">${price}</span>
            </div>

            <!-- Bottom Row: Footer -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; width:100%;">
                <span style="font-size:20px; font-weight:600; color:#CCCCCC;">Tahminidir. Kesinlik içermez.</span>
                <span style="font-size:24px; font-weight:700; color:#ffffff;">x.com / KolinBorsa</span>
            </div>
        `;

        document.body.appendChild(container);

        try {
            const canvas = await html2canvas(container, {
                backgroundColor: null,
                scale: 2, // 1600x1200 result
                useCORS: true,
                allowTaint: true
            });

            const link = document.createElement('a');
            link.download = `OWF_${this.fundCode}_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error("Snapshot error:", err);
            alert("Görsel oluşturulurken hata oluştu.");
        } finally {
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
            this.toggleLoader(false);
            this.setStatus("Görsel indirildi");
        }
    }

    injectLoader() {
        if (document.querySelector('.loading-overlay')) return;

        const loaderHTML = `
        <div class="loading-overlay hidden" id="loadingOverlay">
            <div class="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="loading-text">Hesaplanıyor...</div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loaderHTML);
        this.loaderEl = document.getElementById('loadingOverlay');
    }

    toggleLoader(show) {
        if (!this.loaderEl) return;
        if (show) {
            this.loaderEl.classList.remove('hidden');
        } else {
            this.loaderEl.classList.add('hidden');
        }
    }

    fmtMoney(n) { return n?.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) ?? "-"; }
    fmtPct(n) { return n?.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "-"; }
    setStatus(msg) { if (this.ui.status) this.ui.status.textContent = msg; }

    getTefasDateStr(dateObj) {
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        return `${d}.${m}.${dateObj.getFullYear()}`;
    }

    async getTefasPrice() {
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = this.getTefasDateStr(d);

            try {
                const res = await fetch("/api/tefas", {
                    method: "POST",
                    body: `fontip=YAT&fonkod=${this.fundCode}&bastarih=${dateStr}&bittarih=${dateStr}`
                });
                if (!res.ok) continue;
                const json = await res.json();
                const row = json?.data?.[0];

                if (row) {
                    let p = row.FIYAT;
                    if (typeof p === "string") p = parseFloat(p.replace(/\./g, "").replace(",", "."));
                    return { price: p, date: dateStr };
                }
            } catch (e) { console.error("Tefas Error:", e); }
        }
        return null;
    }

    async getYahooData(symbol, isUsd = false) {
        try {
            const res = await fetch(`/api/yahoo?symbol=${encodeURIComponent(symbol)}&interval=1d&range=5d`);
            const json = await res.json();
            const result = json?.chart?.result?.[0];

            let assetPct = 0;
            if (result) {
                const prevClose = result.meta.chartPreviousClose;
                const quotes = result.indicators.quote[0].close;
                const currentPrice = quotes.filter(q => q != null).pop();

                if (prevClose && currentPrice) {
                    assetPct = ((currentPrice - prevClose) / prevClose) * 100;
                }
            }

            if (isUsd) {
                const usdRes = await fetch(`/api/yahoo?symbol=USDTRY=X&interval=1d&range=5d`);
                const usdJson = await usdRes.json();
                const usdResult = usdJson?.chart?.result?.[0];

                let usdPct = 0;
                if (usdResult) {
                    const uPrev = usdResult.meta.chartPreviousClose;
                    const uQuotes = usdResult.indicators.quote[0].close;
                    const uCurr = uQuotes.filter(q => q != null).pop();
                    if (uPrev && uCurr) {
                        usdPct = ((uCurr - uPrev) / uPrev) * 100;
                    }
                }

                return { pct: ((1 + assetPct / 100) * (1 + usdPct / 100) - 1) * 100 };
            }

            return { pct: assetPct };
        } catch (err) {
            console.error(`Yahoo Data Error (${symbol}):`, err);
            return { pct: 0 };
        }
    }

    async update() {
        // Show loader
        this.toggleLoader(true);

        if (this.ui.refresh) this.ui.refresh.disabled = true;
        this.setStatus("Veriler çekiliyor...");
        if (this.ui.list) this.ui.list.innerHTML = "";

        // 1. Base Price
        let base = await this.getTefasPrice();

        const manualP = localStorage.getItem(this.storagePriceKey);
        if (!base && manualP) {
            base = { price: parseFloat(manualP), date: localStorage.getItem(this.storageDateKey) || "Manuel" };
        }

        if (base) {
            this.ui.offPrice.textContent = this.fmtMoney(base.price) + " ₺";
            this.ui.offDate.textContent = base.date;
        } else {
            this.ui.offPrice.textContent = "Veri Yok";
            this.ui.offDate.textContent = "-";
        }

        // 2. Holdings
        const promises = this.holdings.map(async h => {
            const { pct } = await this.getYahooData(h.s, h.isUsd);
            const impact = pct * (h.w / this.totalWeight);
            return { ...h, pct, impact };
        });

        const results = await Promise.all(promises);

        // 3. Fixed Components
        this.fixedComponents.forEach(fc => {
            const dailyPct = fc.annualRate / 365;
            const impact = dailyPct * (fc.w / this.totalWeight);
            results.push({
                s: fc.name,
                w: fc.w,
                pct: dailyPct,
                impact: impact,
                isFixed: true,
                name: fc.name
            });
        });

        // 4. Render
        let totalWeightedPct = 0;
        results.sort((a, b) => b.w - a.w);

        results.forEach(r => {
            totalWeightedPct += r.impact;

            const item = document.createElement("div");
            item.className = "stock-item";

            const isPos = r.pct >= 0;
            const colorClass = isPos ? "color-pos" : "color-neg";
            const sign = isPos ? "+" : "";

            const cleanSym = r.name ? r.name : r.s.replace(".IS", "");
            const impactStr = `${sign}%${r.impact.toFixed(2)}`;

            item.innerHTML = `
                <div class="stock-main">
                <span class="stock-sym">${cleanSym}</span>
                <span class="stock-w">%${r.w.toFixed(2)}</span>
                </div>
                <div class="stock-vals">
                <div class="val-row">
                    <span class="lbl">Değ:</span>
                    <span class="stock-pct ${colorClass}">${sign}%${this.fmtPct(r.pct)}</span>
                </div>
                <div class="val-row">
                    <span class="lbl">Etki:</span>
                    <span class="stock-imp ${colorClass}">${impactStr}</span>
                </div>
                </div>
            `;
            this.ui.list.appendChild(item);
        });

        const finalSign = totalWeightedPct >= 0 ? "+" : "";
        const finalClass = totalWeightedPct >= 0 ? "pos" : "neg";
        const arrowIcon = totalWeightedPct >= 0 ? "trending-up" : "trending-down";
        // Define color for snapshot usage
        const colorHex = totalWeightedPct >= 0 ? '#30D158' : '#FF453A';

        this.ui.estChange.className = `change-badge ${finalClass}`;
        // Store color in data attribute for snapshot
        this.ui.estChange.dataset.color = colorHex;

        this.ui.estChange.innerHTML = `<i data-lucide="${arrowIcon}" style="width:24px; height:24px; vertical-align: text-bottom; margin-right:4px;"></i>${finalSign}%${this.fmtPct(totalWeightedPct)}`;

        // Re-run lucide for new icons
        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (base && base.price) {
            const estimated = base.price * (1 + totalWeightedPct / 100);
            this.ui.estPrice.textContent = this.fmtMoney(estimated) + " ₺";

            const time = new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });
            this.setStatus(`Güncellendi: ${time}`);
        } else {
            this.ui.estPrice.textContent = "--";
            this.setStatus("TEFAS fiyatı bekleniyor");
        }

        // Hide loader
        this.toggleLoader(false);

        if (this.ui.refresh) this.ui.refresh.disabled = false;
    }

    saveManualPrice() {
        const val = parseFloat(this.ui.input.value);
        if (val > 0) {
            localStorage.setItem(this.storagePriceKey, val);
            localStorage.setItem(this.storageDateKey, this.getTefasDateStr(new Date()) + " (Manuel)");
            this.ui.input.value = "";
            this.update();
        }
    }
}
