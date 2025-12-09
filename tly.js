
const config = {
    fundCode: "TLY",
    holdings: [
        { s: "TERA.IS", w: 32.05 },
        { s: "TEHOL.IS", w: 17.87 },
        { s: "RALYH.IS", w: 11.73 },
        { s: "TRHOL.IS", w: 8.97 },
        { s: "PEKGY.IS", w: 8.78 },
        { s: "SMRVA.IS", w: 6.81 },
        { s: "DSTKF.IS", w: 5.88 },
        { s: "XU30.IS", w: 3.76, name: "HMV (Hisse Fon)" },
        { s: "TURSG.IS", w: 1.69 },
        { s: "HEDEF.IS", w: 1.61 },
        { s: "ENSRI.IS", w: 0.40 },
        { s: "GRTHO.IS", w: 0.26 },
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

