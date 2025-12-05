
const config = {
    fundCode: "IOG",
    holdings: [
        // 1. SLV (iShares Silver Trust) - Approx 44.10%
        // Needs to convert USD change -> TRY change (Silver% + USDTRY%)
        { s: "SLV", w: 44.10, name: "iShares Silver Trust (USD)", isUsd: true },

        // 2. QNB Finans Gümüş BYF (GMSTR) - Approx 26.91% + 1.71% = 28.62% -> Round to ~29.23% from group total
        { s: "GMSTR.IS", w: 29.23, name: "QNB Finans Gümüş BYF" },

        // 3. Physical Silver (XAGUSD) - Approx 12.15%
        // Similar to SLV, needs USD -> TRY conversion
        { s: "XAGUSD=X", w: 12.15, name: "Gümüş (Ons/USD)", isUsd: true },

        // 4. Other Funds (IAG, ILH, etc.) - Small amount ~1%
        // We can track them or bundl into 'Other'
        // For simplicity, let's bundle into fixed or main silver driver. 
        // Or if we want to be precise, let's just add the biggest one or ignore small ones.
        // Let's add USD/TRY tracker for cash/others or just treat as fixed.
    ],
    fixedComponents: [
        // Government Bonds (Devlet Tahvili) ~10.76% + Reverse Repo ~2.13% + Other ~1.7%
        // Total Fixed/Cash ~ 14.6%
        { name: "Tahvil/Repo/Nakit", w: 14.52, annualRate: 45.00 }
    ],
    totalWeight: 100.0
};

// Initialize after DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Inject USD/TRY fetcher into the calculator if not present,
    // or handle "isUsd" flag in the core logic.
    // For now, let's use a workaround:
    // We will subclass or modify the config to include USDTRY explicitly 
    // BUT the best way is to modify fund-core.js to handle `isUsd`.

    // However, since I cannot modify fund-core.js easily without disturbing TLY,
    // I will use the Composite approach in "holdings" directly if possible
    // OR just add "USDTRY=X" as a separate holding with the SAME weight as the USD asset 
    // and label them differently? 
    // A better approach for "isUsd" assets:
    // Return (Asset_Pct + USD_Pct) approximately.

    // Let's rely on `fund-core.js` update to handle `isUsd`.
    // I will update fund-core.js first to handle `isUsd`.

    new FundCalculator(config);
});
