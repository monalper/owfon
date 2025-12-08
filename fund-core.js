
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

        // Set Title if provided
        // document.title = `${this.fundCode} - OWFHP`;

        this.update();
    }

    async generateSnapshot() {
        if (typeof html2canvas === 'undefined') {
            alert("Snapshot kütüphanesi yüklenemedi.");
            return;
        }

        this.toggleLoader(true);
        this.setStatus("Görsel hazırlanıyor...");

        // Create temporary container for HORIZONTAL layout
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '640px',
            height: '360px',
            backgroundColor: '#1C1C1E', // var(--surface)
            background: 'radial-gradient(circle at top right, #2C2C2E, #000000)',
            color: '#FFFFFF',
            fontFamily: '"Inter Tight", sans-serif',
            borderRadius: '0',
            padding: '32px 48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            zIndex: '9999'
        });

        // Content
        const price = this.ui.estPrice.textContent;
        const changeHTML = this.ui.estChange.innerHTML;
        const color = this.ui.estChange.dataset.color || '#fff';

        const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        const fundLogo = `assets/${this.fundCode.toLowerCase()}.webp`;

        // Horizontal Layout HTML Structure
        container.innerHTML = `
            <div style="width: 100%; display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: auto;">
                <div style="display:flex; align-items:center; gap:16px;">
                    <img src="${fundLogo}" style="width:64px; height:64px; border-radius:16px; object-fit:cover; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" crossorigin="anonymous">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-size:32px; font-weight:700; letter-spacing:-0.5px; line-height:1;">${this.fundCode}</span>
                        <span style="font-size:14px; color:#8E8E93; margin-top:4px;">Serbest Fon</span>
                    </div>
                </div>
                <div style="text-align:right;">
                     <div style="font-size:16px; font-weight:600; color:#8E8E93; margin-bottom:4px;">${date}</div>
                </div>
            </div>
            
            <div style="width: 100%; display:flex; align-items: flex-end; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display:flex; flex-direction:column;">
                     <div style="font-size:14px; color:#8E8E93; font-weight:600; margin-bottom:8px;">Tahmini Fiyat</div>
                     <div style="font-size:56px; font-weight:800; line-height:1;">${price}</div>
                </div>
                
                <div style="display:flex; flex-direction:column; align-items: flex-end;">
                     <div style="display:inline-flex; align-items:center; justify-content:center; padding:8px 20px; border-radius:18px; background:rgba(255,255,255,0.1); font-size:28px; font-weight:700; color:${color};">
                        ${changeHTML}
                    </div>
                </div>
            </div>

            <div style="width: 100%; display:flex; justify-content: space-between; align-items: center; margin-top: 24px;">
                 <div style="font-size:13px; color:#8E8E93;">*Veriler tahminidir, kesinlik içermez.</div>
                 <div style="font-size:16px; font-weight:600; color:#ffffff; opacity:0.8;">@KolinBorsa</div>
            </div>
        `;

        document.body.appendChild(container);

        try {
            const canvas = await html2canvas(container, {
                backgroundColor: null,
                scale: 2,
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
            this.setStatus("Güncellendi: " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }));
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
