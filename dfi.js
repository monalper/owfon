
const config = {
    fundCode: "DFI",
    holdings: [
        { s: "IEYHO.IS", w: 51.25, name: "IŞIKLAR ENERJİ" },
        { s: "ECILC.IS", w: 1.28, name: "ECZACIBAŞI İLAÇ" }
    ],
    fixedComponents: [
        { name: "TPP (Takasbank Para Piyasası)", w: 48.02, annualRate: 42.00 },
        { name: "Vadeli Mevduat", w: 0.04, annualRate: 42.00 }
    ],
    totalWeight: 100.0
};

// Initialize after DOM load
document.addEventListener('DOMContentLoaded', () => {
    new FundCalculator(config);
});
