# 🚌 BiletBul | Full-Stack Online Otobüs Bileti Satış Platformu.

**BiletBul**, modern web mimarisiyle geliştirilmiştir. Yüksek veri tutarlılığı ve kesintisiz kullanıcı deneyimi odaklı, uçtan uca (Full-Stack) bir online otobüs bileti satış ve rezervasyon platformudur. 

## 🚀 Öne Çıkan Mühendislik ve Mimari Başarılar

### 1. Veritabanı Mühendisliği (MS SQL & Database Engineering)
Sistemin veri katmanı, veri bütünlüğünü sağlamak ve veri tekrarını önlemek adına **MS SQL (Microsoft SQL Server)** üzerinde 5 temel aşamadan geçerek inşa edilmiştir:
* **Gereksinim Analizi (Requirement Analysis):** Projenin ilk adımında hem **Kullanıcı Gereksinimleri** (bilet arama, cinsiyete göre koltuk seçimi, rezervasyon takibi vb.) hem de **Sistem Gereksinimleri** (veri tutarlılığı, eşzamanlı işlem limitleri, rol tabanlı yetkilendirmeler) detaylıca analiz edilmiş ve sistem sınırları belirlenmiştir.
* **Kavramsal Tasarım (Conceptual Design):** Sistem analiz edilerek varlıklar ve iş kuralları belirlenmiş, projenin temelini oluşturan **E/R (Entity-Relationship) Diyagramları** tasarlanmıştır.
* **Mantıksal Tasarım (Logical Design):** E/R modeli, ilişkisel veritabanı standartlarına dönüştürülerek **İlişkisel Şemalar (Relational Schemas)** ve yabancı anahtar (Foreign Key) kısıtlamaları haritalandırılmıştır.
* **Normalizasyon İşlemleri:** Veritabanında anormallikleri (ekleme, silme, güncelleme hataları) önlemek ve performansı arttırmak amacıyla veri modeli **1NF, 2NF, 3NF (Third Normal Form) / BCNF** seviyelerine kadar normalize edilmiştir.
* **Fiziksel Tasarım (Physical Design):** MS SQL üzerinde veri tipleri, indeksleme stratejileri, kısıtlamalar ve veri tutarlılığını koruyan transaction mantığı T-SQL yetkinlikleriyle hayata geçirilmiştir.
    * **Transactions:** Bilet satın alma ve koltuk rezervasyonu gibi kritik işlemlerde, anlık çakışmaları (concurrency) engellemek ve veri kayıplarını önlemek adına operasyonlar **ACID** prensiplerine uygun transaction blokları ile güvenceye alınmıştır.
    * **Stored Procedures:** Tekrarlanan ve yoğun SQL sorguları (bilet kesme, sefer oluşturma vb.) optimize edilerek ağ trafiğini azaltmak ve sorgu performansını maksimuma çıkarmak için saklı yordamlar (Stored Procedures) olarak kurgulanmıştır.
    * **Triggers:** Koltuk durumu değişiklikleri veya bilet iptalleri gibi tablolardaki anlık veri hareketlerinde, sistemin otomatik olarak loglama yapmasını veya ilişkili tabloları güncellemesini sağlayan dinamik tetikleyiciler (Triggers) kullanılmıştır.
    * **Views:** Karmaşık tabloların (Seferler, Otobüsler, Biletler) ilişkisel birleşimlerini (JOIN) frontend/backend katmanlarına daha sade, performanslı ve güvenli bir veri sunumu sağlamak amacıyla sanal tablolar (Views) üzerinden servis edilmiştir.

### 2. Güçlü ve Modüler Backend Mimarisi (Node.js & Express.js)
* **Node.js** mimarisi kullanılarak, biletleme esnasında oluşabilecek anlık ve yoğun istek trafiğini asenkron yapısıyla eritebilen bir altyapı kurulmuştur.
* **Express.js** kütüphanesi entegre edilerek, temiz ve sürdürülebilir bir yönlendirme (routing) mekanizması oluşturulmuş; frontend ile backend arasındaki veri alışverişi güvenli ve performanslı API uç noktaları (Endpoints) üzerinden koordine edilmiştir.
* Koltuk seçimi, rezervasyon iptali ve bilet satın alım gibi kritik süreçlerin iş mantığı backend katmanında güvenli bir şekilde işlenmiştir.

### 3. Dinamik ve Kullanıcı Odaklı (UX) Frontend
* **HTML5, CSS3 ve Modern JavaScript** kullanılarak, kullanıcının karmaşık sefer listeleri arasından kolayca filtreleme yapabileceği responsive bir arayüz tasarlanmıştır.
* **Dinamik Koltuk Matrisi:** Otobüs modellerine göre dinamik olarak şekillenen, doluluk durumunu ve cinsiyet kurallarına göre rezervasyon kısıtlamalarını anlık yöneten akıllı bir koltuk seçim arayüzü geliştirilmiştir.

## E/R DİYAGRAMI
<img width="1400" height="1000" alt="Image" src="https://github.com/user-attachments/assets/0203fcb3-de10-476f-b07b-a0e53285af53" />

## İLİŞKİSEL ŞEMA
<img width="1088" height="870" alt="Image" src="https://github.com/user-attachments/assets/b0cf952d-2402-4d6e-95bf-6c76e4fa8801" />

## ANASAYFA
**Şehir ve tarih bilgilerine göre otobüs seferlerinin listelendiği sayfadır.**

<img width="1822" height="647" alt="Image" src="https://github.com/user-attachments/assets/05a12533-4577-4bca-b967-0730cf70575b" />

## KOLTUK SEÇİM EKRANI
**Kullanıcılar anasayfada gidecekleri seferi seçtikten sonra ilgili sefere ait koltuklarını bu ekran üzerinden seçebilirler.**

<img width="1502" height="865" alt="Image" src="https://github.com/user-attachments/assets/b5527a4a-bd9e-4633-8adc-409c6442fc85" />

## ÖDEME EKRANI
**Sefer ve koltuk seçimleri yapıldıktan sonra kullanıcılar bu ekranda yolcu ve kart bilgilerini girerek ödeme işlemini tamamlayabilirler.**

<img width="1632" height="878" alt="Image" src="https://github.com/user-attachments/assets/e6f11d2b-e387-4dc2-b8f9-a07e9a7e28c3" />

## SEYAHAT SORGULAMA EKRANI
**Kullanıcılar sisteme e-posta ve şifre bilgilerini kullanarak giriş yaptıktan sonra bu ekranda aldıkları tüm biletlere ait bilgileri görebilirler.**

<img width="1805" height="667" alt="Image" src="https://github.com/user-attachments/assets/376969ca-4a0e-4a29-a29b-b9a75e868d27" />

## BİLET İPTAL/İADE EKRANI
**Kullanıcılar iade etmek istedikleri bileti bu ekran üzerinden iptal edebilirler.**

<img width="1772" height="822" alt="Image" src="https://github.com/user-attachments/assets/9223fd8f-cf31-47b5-b799-133d376c9b17" />

## ÜYE GİRİŞİ EKRANI
**Kullanıcı eğer sisteme üye olmuşsa e-posta ve şifre bilgilerini girerek sisteme giriş yapabilir.**

<img width="1808" height="842" alt="Image" src="https://github.com/user-attachments/assets/f568f687-e09a-4531-a451-475373cd438a" />

## ÜYE OLMA EKRANI
**Kullanıcı sisteme henüz üye değilse gerekli bilgilerini girerek bu ekran üzerinden üyeliğini oluşturabilir.**

<img width="1828" height="842" alt="Image" src="https://github.com/user-attachments/assets/b481fcd8-e7a3-4a92-b487-42501e003fb6" />

