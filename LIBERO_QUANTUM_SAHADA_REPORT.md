# LIBERO QUANTUM – Sahada Uygulaması Test Raporu

**Kaynak:** [Libero Quantum](https://github.com/yerdoganbm/libero-quantum) (son main)  
**Hedef:** Sahada App – `http://localhost:3002`  
**Araç:** LIBERO GENESIS v2.0 (framework-agnostic evrensel test)  
**Tarih:** 2026-02-14  

---

## 1. Özet

| Alan | Değer |
|------|--------|
| **Test edilen URL** | http://localhost:3002 |
| **Kaos modu** | Kapalı (H) |
| **Tespit edilen teknoloji** | vanilla |
| **Bekleme stratejisi** | domcontentloaded |
| **Toplam test** | 4 |
| **Başarılı** | 4 |
| **Sonuç** | **4/4 test başarılı** |

---

## 2. Tespitler (Tarama)

Evrensel element taraması (getByRole / placeholder):

| Element | Sayı | Durum |
|---------|------|--------|
| button | 3 | OK |
| link | 0 | OK |
| textbox | 0 | OK |
| heading | 1 | OK |
| img | 1 | OK |
| input (textbox) | 0 | OK |
| placeholder (input/textarea) | 0 | OK |

**Kısa yorum:** Sayfada 3 buton, 1 başlık ve 1 resim tespit edildi; link ve metin kutusu yok (muhtemelen karşılama/giriş ekranı).

---

## 3. Test Sonuçları (İnsan odaklı lokatörler)

| Test | Sonuç | Süre |
|------|--------|------|
| Button (getByRole) visible & clickable | **PASS** | 74 ms |
| Links (getByRole) found | **PASS** | 3 ms |
| Input/textarea with placeholder | **PASS** | 6 ms |
| Buttons have accessible name (aria-label/text) | **PASS** | 7 ms |

Tüm testler geçti; butonlar tıklanabilir ve erişilebilir isimlere sahip.

---

## 4. Basit Değerlendirme

- **Erişilebilirlik:** Butonlarda aria-label veya metin mevcut (a11y kontrolü geçti).
- **Etkileşim:** En az bir buton görünür ve tıklanabilir.
- **Teknoloji:** Tespit “vanilla” (Genesis, ilk yüklemede React’i bazen vanilla görüyor; uygulama React tabanlı).

---

## 5. Nasıl Tekrar Çalıştırılır?

```bash
# Sahada projesinde
npm run libero:quantum:genesis:sahada
```

Veya Libero Quantum klasöründe:

```bash
cd path/to/libero-quantum
GENESIS_URL=http://localhost:3002 GENESIS_CHAOS=H npx ts-node libero-universal.ts
```

**Not:** Test öncesi Sahada uygulamasının çalışıyor olması gerekir (`npm run dev`).
