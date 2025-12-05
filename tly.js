
const config = {
    fundCode: "TLY",
    holdings: [
        { s: "TERA.IS", w: 20.31 },
        { s: "TEHOL.IS", w: 13.67 },
        { s: "SMRVA.IS", w: 9.17 },
        { s: "RALYH.IS", w: 8.23 },
        { s: "TRHOL.IS", w: 6.84 },
        { s: "PEKGY.IS", w: 6.75 },
        { s: "DSTKF.IS", w: 5.94 },
        { s: "XU100.IS", w: 5.75, name: "DİĞER (BIST)" }
    ],
    fixedComponents: [
        { name: "BPP (Nakit/Fon)", w: 23.34, annualRate: 44.00 }
    ],
    totalWeight: 100.0
};

// Initialize after DOM load
document.addEventListener('DOMContentLoaded', () => {
    new FundCalculator(config);
});
