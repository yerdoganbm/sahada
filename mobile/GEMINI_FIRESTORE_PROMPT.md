# Gemini'ye vereceğin prompt (Firebase Console – Ask Gemini)

Aşağıdaki metni kopyalayıp Firebase Console’daki **Ask Gemini** kutusuna yapıştır.

---

**Prompt (kopyala-yapıştır):**

```
Sahada adlı bir halı saha / takım yönetimi mobil uygulaması için Cloud Firestore veritabanı ve koleksiyonlarını oluşturmak istiyorum. Proje: sahada-16b2d.

1) Önce "Create database" ile Firestore veritabanını oluştur (production veya test mode; test mode ile başlayabilirim).

2) Aşağıdaki 4 koleksiyonu ve alan yapılarını kullanarak örnek dokümanlarla birlikte oluştur:

**users** (koleksiyon)
- name (string)
- phone (string) – giriş için kullanılacak, benzersiz değerler koy
- email (string, opsiyonel)
- teamId (string, opsiyonel – teams’teki bir doc id’ye referans)
- role (string: "admin" | "member" | "guest")
- position (string: "GK" | "DEF" | "MID" | "FWD")
- rating (number, 0–10)
- reliability (number, 0–100)
- avatar (string, opsiyonel – URL)
- isCaptain (boolean, opsiyonel)

Örnek 1 doküman: name "Demo Kullanıcı", phone "05321234567", role "admin", position "MID", rating 7, reliability 100, teamId boş bırakılabilir veya sonra teams’ten biriyle doldurulur.

**teams** (koleksiyon)
- name (string)
- shortName (string, opsiyonel)
- inviteCode (string) – örn. "SAHADA2025"
- primaryColor (string, opsiyonel, örn. "#10B981")
- secondaryColor (string, opsiyonel)

Örnek 1 doküman: name "Sahada Demo Takım", shortName "SDT", inviteCode "DEMO2025".

**venues** (koleksiyon)
- name (string)
- location (string)
- address (string, opsiyonel)
- pricePerHour (number)
- rating (number, 0–5)
- primaryImageUrl (string, opsiyonel)
- features (array, opsiyonel, örn. ["Soyunma", "Duş"])

Örnek 1 doküman: name "Demo Halı Saha", location "Kadıköy", pricePerHour 800, rating 4.5.

**matches** (koleksiyon)
- teamId (string, opsiyonel – teams doc id)
- venueId (string, opsiyonel – venues doc id)
- matchDate (string, YYYY-MM-DD)
- matchTime (string, örn. "20:00")
- location (string, opsiyonel)
- venue (string, opsiyonel – saha adı)
- status (string: "upcoming" | "completed" | "cancelled")
- pricePerPerson (number, opsiyonel)
- capacity (number, opsiyonel, örn. 14)
- attendees (array: her eleman { playerId: string, status: "YES" | "NO" | "MAYBE" })

Örnek 1 doküman: matchDate yarının tarihi (YYYY-MM-DD), matchTime "20:00", status "upcoming", attendees [].

3) teams ve users için: İlk oluşturduğun teams dokümanının id’sini kopyala; users örnek dokümandaki teamId alanına bu id’yi yaz (böylece bir kullanıcı takıma bağlı olsun).

Adım adım nasıl yapacağımı (Firebase Console’da nereye tıklayacağım, hangi alanları gireceğim) kısaca anlat. Türkçe yanıt ver.
```

---

İstersen sadece “koleksiyonları ve örnek dokümanları oluştur” kısmını kısaltıp sadece yapıyı da isteyebilirsin; Gemini zaten Console’a göre yönlendirme yapacaktır.
