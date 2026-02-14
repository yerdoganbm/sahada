# LIBERO GENESIS v2.0 – Evrensel Otonom Test

Framework’ten bağımsız, tek soru (“Hangi URL?”) ile çalışan test aracı.

## Bu projede (Sahada) çalıştırma

```bash
npm run genesis
# veya
npm run libero:genesis
```

İlk soru: **Test edilecek URL?** (örn. `http://localhost:5173`)  
İkinci soru: **Kaos Modu? (E/H)**

## Libero Quantum’a taşımak için

Aynı yapıyı Libero Quantum repo’suna eklemek için:

1. **Dosyalar:** `libero-universal.ts`, `scripts/run-genesis.js` → Libero Quantum köküne / scripts’e kopyala.
2. **package.json (Libero Quantum):**
   - `scripts`: `"genesis": "ts-node libero-universal.ts"`, `"libero:genesis": "ts-node libero-universal.ts"`
   - `bin`: `"libero-genesis": "scripts/run-genesis.js"`
   - `dependencies`: `"playwright": "^1.40.0"` (yoksa ekle)

Böylece Libero Quantum’da `npx libero-quantum` veya `npm run genesis` ile Genesis çalışır.

## Özellikler

- **Universal Adapter:** React / Angular / jQuery / vanilla tespit → uygun bekleme (networkidle, load, domcontentloaded).
- **Human-Centric Selectors:** `getByRole`, `getByPlaceholder`, `getByText` (framework’e özel seçici yok).
- **CLI Wizard:** Sadece URL + Kaos (E/H).
- **Rapor:** Terminalde tablo (tarama + test sonuçları).
