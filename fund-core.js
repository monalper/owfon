
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
            title: document.querySelector(".brand-title")
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

        // Set Title if provided
        // document.title = `${this.fundCode} - OWFHP`;

        this.update();
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

        this.ui.estChange.className = `change-badge ${finalClass}`;
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
