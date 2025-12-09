
const config = {
    fundCode: "TLY",
    holdings: [
        { s: "TERA.IS", w: 32.02 },
        { s: "TEHOL.IS", w: 17.68 },
        { s: "RALYH.IS", w: 11.61 },
        { s: "TRHOL.IS", w: 9.12 },
        { s: "PEKGY.IS", w: 8.94 },
        { s: "SMRVA.IS", w: 6.52 },
        { s: "DSTKF.IS", w: 6.10 },
        { s: "XU30.IS", w: 3.84, name: "HMV (Hisse Fon)" },
        { s: "TURSG.IS", w: 1.71 },
        { s: "HEDEF.IS", w: 1.62 },
        { s: "ENSRI.IS", w: 0.39 },
        { s: "GRTHO.IS", w: 0.25 },
        { s: "XU30.IS", w: 0.12, name: "T3B (Hisse Fon)" },
        { s: "IZFAS.IS", w: 0.05 },
        { s: "ADESE.IS", w: 0.03 }
    ],
    fixedComponents: [],
    totalWeight: 100.0
};

// Initialize after DOM load
document.addEventListener('DOMContentLoaded', () => {
    new FundCalculator(config);
});
