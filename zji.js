
const config = {
    fundCode: "ZJI",
    holdings: [
        { s: "ZRGYO.IS", w: 51.13, name: "ZİRAAT GAYRİMENKUL Y" },
        { s: "THYAO.IS", w: 6.90, name: "TÜRK HAVA YOLLARI" },
        { s: "TURSG.IS", w: 2.33, name: "TÜRKİYE SİGORTA" },
        { s: "SUNTK.IS", w: 2.23, name: "SUN TEKSTİL" },
        { s: "BIOEN.IS", w: 1.88, name: "BIOTREND CEVRE" },
        { s: "TCELL.IS", w: 1.27, name: "TURKCELL" },
        { s: "AKBNK.IS", w: 1.22, name: "AKBANK" },
        { s: "LIDER.IS", w: 1.10, name: "LDR TURIZM" },
        { s: "SAHOL.IS", w: 0.21, name: "SABANCI HOLDING" },
        { s: "BORLS.IS", w: 0.21, name: "BORLEASE OTOMOTIV" },
        { s: "BIMAS.IS", w: 0.20, name: "BİM MAĞAZALAR" },
        { s: "KCHOL.IS", w: 0.09, name: "KOÇ HOLDİNG" },
        { s: "EREGL.IS", w: 0.08, name: "EREĞLİ DEMİR ÇELİK" },
        { s: "GARAN.IS", w: 0.07, name: "GARANTİ BANKASI" },
        { s: "KOZAL.IS", w: 0.07, name: "KOZA ALTIN" },
        { s: "TTKOM.IS", w: 0.06, name: "TÜRK TELEKOM" },
        { s: "FROTO.IS", w: 0.06, name: "FORD OTOSAN" },
        { s: "ENKAI.IS", w: 0.05, name: "ENKA İNŞAAT" },
        { s: "TAVHL.IS", w: 0.04, name: "TAV HAVALİMANLARI" },
        { s: "VAKBN.IS", w: 0.04, name: "VAKIFLAR BANKASI" },
        { s: "PGSUS.IS", w: 0.04, name: "PEGASUS" },
        { s: "MGROS.IS", w: 0.04, name: "MİGROS TİCARET" },
        { s: "EKGYO.IS", w: 0.04, name: "EMLAK KONUT GMYO" },
        { s: "TOASO.IS", w: 0.03, name: "TOFAŞ OTO. FAB." },
        { s: "KOZAA.IS", w: 0.03, name: "KOZA MADENCİLİK" },
        { s: "ASTOR.IS", w: 0.02, name: "ASTOR ENERJİ" },
        { s: "KRDMA.IS", w: 0.02, name: "KARDEMİR (A)" },
        { s: "GUBRF.IS", w: 0.02, name: "GÜBRE FABRİK." },
        { s: "PETKM.IS", w: 0.02, name: "PETKİM" },
        { s: "CIMSA.IS", w: 0.02, name: "ÇİMSA" },
        { s: "KRDMD.IS", w: 0.02, name: "KARDEMİR (D)" },
        { s: "ULKER.IS", w: 0.01, name: "ÜLKER BİSKÜVİ" },
        { s: "KAYSE.IS", w: 0.01, name: "KAYSERİ ŞEKER" },
        { s: "HALKB.IS", w: 0.01, name: "HALK BANKASI" },
        { s: "ZPX30.IS", w: 0.00, name: "ZİRAAT BIST30 BYF" },
        { s: "ISCTR.IS", w: 0.00, name: "İŞ BANKASI (C)" },
        { s: "IPEKE.IS", w: 0.00, name: "İPEK DOĞAL ENERJİ" },
        { s: "SASA.IS", w: 0.00, name: "SASA POLYESTER" }
    ],
    fixedComponents: [
        { name: "Tahvil (Halkbank)", w: 11.06, annualRate: 48.00 },
        { name: "ZPLIB & Diğer", w: 8.65, annualRate: 50.00 }, // ZPLIB (6.01) + DMLKT (2.63)
        { name: "VOB Nakit", w: 1.97, annualRate: 45.00 }
    ],
    totalWeight: 100.0
};

// Initialize after DOM load
document.addEventListener('DOMContentLoaded', () => {
    new FundCalculator(config);
});
