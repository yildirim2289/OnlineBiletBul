// --- GEREKLİ PAKETLERİ İÇE AKTAR ---
const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- VERİTABANI BAĞLANTI AYARLARI ---
const config = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server={DESKTOP-NKG3KD0\\SQLEXPRESS};Database={Otobus-Bilet};Trusted_Connection=yes;',
};

// --- BAĞLANTI HAVUZU YÖNETİMİ ---
// Bu yapı her istekte yeniden bağlanmak yerine mevcut bağlantıyı kullanır.
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Veritabanına başarıyla bağlanıldı (Pool Hazır)!');
        return pool;
    })
    .catch(err => {
        console.error('❌ Bağlantı hatası:', err);
        process.exit(1);
    });

// --- SEFERLERİ FİLTRELEME VE GETİRME ---
app.get('/seferler', async (req, res) => {
    try {
        const { nereden, nereye, tarih } = req.query;
        const pool = await poolPromise;
        const request = pool.request();

        let queryText = `
            SELECT DISTINCT 
                   S.sefer_id,
                   CONVERT(VARCHAR(10), S.sefer_tarihi, 104) AS sefer_tarihi, 
                   CONVERT(VARCHAR(5), S.kalkis_saati, 108) AS kalkis_saati, 
                   CONVERT(VARCHAR(5), S.varis_saati, 108) AS varis_saati, 
                   S.kalkis_sehri, S.varis_sehri, S.peron, 
                   F.firma_adi,
                   B.fiyat -- Fiyat bilgisini buradan alıyoruz
            FROM dbo.Sefer S
            LEFT JOIN dbo.Otobus O ON S.sefer_otobus_id = O.otobus_id
            LEFT JOIN dbo.Firma F ON O.ot_firma_id = F.firma_id
            LEFT JOIN dbo.Bilet B ON S.sefer_id = B.sefer_id -- Bilet tablosu eklendi
            WHERE 1=1 `;
        if (nereden) {
            queryText += ` AND S.kalkis_sehri = @nereden`;
            request.input('nereden', sql.NVarChar, nereden);
        }
        if (nereye) {
            queryText += ` AND S.varis_sehri = @nereye`;
            request.input('nereye', sql.NVarChar, nereye);
        }
        if (tarih) {
            queryText += ` AND CAST(S.sefer_tarihi AS DATE) = @tarih`;
            request.input('tarih', sql.Date, tarih);
        }

        const result = await request.query(queryText);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ hata: "Sorgu hatası", detay: err.message });
    }
});

// --- SEFER DETAY VE KOLTUK VERİSİ ---
app.get('/sefer-detay/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const seferId = req.params.id;

        const seferSorgu = await pool.request()
            .input('sid', sql.Int, seferId)
            .query(`
                SELECT TOP 1 S.sefer_id, S.kalkis_sehri, S.varis_sehri,
                   CONVERT(VARCHAR(10), S.sefer_tarihi, 104) AS sefer_tarihi,
                   CONVERT(VARCHAR(5), S.kalkis_saati, 108) AS kalkis_saati, 
                   CONVERT(VARCHAR(5), S.varis_saati, 108) AS varis_saati,
                   O.total_koltuk_sayisi, B.fiyat
                FROM dbo.Sefer S
                JOIN dbo.Otobus O ON S.sefer_otobus_id = O.otobus_id 
                JOIN dbo.Bilet B ON S.sefer_id = B.sefer_id 
                WHERE S.sefer_id = @sid`);

        const koltukSorgu = await pool.request()
            .input('sid', sql.Int, seferId)
            .query(`
                SELECT K.koltuk_no, Y.cinsiyet 
                FROM dbo.Koltuk K
                JOIN dbo.Bilet B ON K.bilet_id = B.bilet_id 
                JOIN dbo.Satin_Alir SA ON B.bilet_id = SA.bilet_id 
                JOIN dbo.Yolcu Y ON SA.tc_no = Y.tc_no 
                WHERE B.sefer_id = @sid`);

        res.json({ detay: seferSorgu.recordset[0], doluKoltuklar: koltukSorgu.recordset });
    } catch (err) {
        res.status(500).json({ hata: "Veri çekilemedi", detay: err.message });
    }
});

// --- KAYIT OLMA ---
app.post('/api/register', async (req, res) => {
    const { tc_no, ad, soy_ad, cinsiyet, telefon, e_mail, sifre } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('tc', sql.VarChar, tc_no).input('ad', sql.NVarChar, ad)
            .input('soyad', sql.NVarChar, soy_ad).input('cinsiyet', sql.Char, cinsiyet)
            .input('tel', sql.VarChar, telefon).input('email', sql.VarChar, e_mail).input('sifre', sql.VarChar, sifre)
            .query(`INSERT INTO Yolcu (tc_no, ad, soy_ad, cinsiyet, telefon, e_mail, sifre) 
                    VALUES (@tc, @ad, @soyad, @cinsiyet, @tel, @email, @sifre)`);
        res.status(200).json({ message: "Kayıt başarılı." });
    } catch (err) {
        res.status(500).json({ message: "Veritabanı hatası." });
    }
});

// --- GİRİŞ YAPMA ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await poolPromise;
        let result = await pool.request()
            .input('email', sql.VarChar, email).input('sifre', sql.VarChar, password)
            .query('SELECT tc_no, ad, soy_ad, cinsiyet, e_mail FROM Yolcu WHERE e_mail = @email AND sifre = @sifre');

        if (result.recordset.length > 0) {
            res.status(200).json({ success: true, user: result.recordset[0] });
        } else {
            res.status(401).json({ success: false, message: "Hatalı giriş!" });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- ÖDEME VE BİLET OLUŞTURMA ---
app.post('/api/odeme-yap', async (req, res) => {
    const { kart, yolcular, odemeDetay, seferId } = req.body;
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const kartRes = await transaction.request()
            .input('no', sql.VarChar, kart.kart_no)
            .input('sk', sql.VarChar, kart.son_kullanim)
            .input('cvc', sql.VarChar, kart.cvc)
            .query(`INSERT INTO dbo.Kart_Bilgileri (kart_no, son_kullanim, cvc) 
                    OUTPUT INSERTED.kart_id VALUES (@no, @sk, @cvc)`);
        const kartId = kartRes.recordset[0].kart_id;

        const odemeRes = await transaction.request()
            .input('durum', sql.NVarChar, 'Onaylandı')
            .input('tutar', sql.Decimal(10,2), odemeDetay.tutar)
            .input('kid', sql.Int, kartId)
            .query(`INSERT INTO dbo.Odeme (odeme_durumu, tutar, kart_id) 
                    OUTPUT INSERTED.odeme_id VALUES (@durum, @tutar, @kid)`);
        const odemeId = odemeRes.recordset[0].odeme_id;

        for (let yolcu of yolcular) {
            await transaction.request()
                .input('tc', sql.VarChar, yolcu.tc_no)
                .input('ad', sql.NVarChar, yolcu.ad)
                .input('soy', sql.NVarChar, yolcu.soy_ad)
                .input('cin', sql.Char, yolcu.cinsiyet)
                .query(`IF NOT EXISTS (SELECT 1 FROM dbo.Yolcu WHERE tc_no = @tc)
                        INSERT INTO dbo.Yolcu (tc_no, ad, soy_ad, cinsiyet) VALUES (@tc, @ad, @soy, @cin)`);

            const biletRes = await transaction.request()
                .input('fiyat', sql.Decimal(10,2), odemeDetay.birimFiyat)
                .input('sid', sql.Int, seferId)
                .query(`INSERT INTO dbo.Bilet (fiyat, sefer_id) 
                        OUTPUT INSERTED.bilet_id VALUES (@fiyat, @sid)`);
            const yeniBiletId = biletRes.recordset[0].bilet_id;

            await transaction.request()
                .input('kno', sql.Int, yolcu.koltuk_no)
                .input('bid', sql.Int, yeniBiletId)
                .input('sid', sql.Int, seferId)
                .query(`INSERT INTO dbo.Koltuk (koltuk_no, bilet_id, sefer_id) VALUES (@kno, @bid, @sid)`);

            await transaction.request()
                .input('ytc', sql.VarChar, yolcu.tc_no)
                .input('bid', sql.Int, yeniBiletId)
                .input('oid', sql.Int, odemeId)
                .query(`INSERT INTO dbo.Satin_Alir (tc_no, bilet_id, odeme_id) VALUES (@ytc, @bid, @oid)`);
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: "İşlem başarıyla tamamlandı!" });

    } catch (err) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- KULLANICININ ALDIĞI TÜM BİLETLERİ LİSTELEME ---
app.get('/api/kullanici-biletleri', async (req, res) => {
    const userTc = req.query.tc;
    if (!userTc) return res.status(400).json({ error: "TC numarası gerekli." });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userTc', sql.VarChar, userTc)
            .query(`
                SELECT B.bilet_id, Y.ad AS yolcu_ad, Y.soy_ad AS yolcu_soyad, K.koltuk_no, B.fiyat,
                       O.odeme_durumu, S.kalkis_sehri, S.varis_sehri, S.sefer_tarihi, F.firma_adi,
                       CONVERT(VARCHAR(5), S.kalkis_saati, 108) AS kalkis_saati
                FROM dbo.Satin_Alir SA
                JOIN dbo.Bilet B ON SA.bilet_id = B.bilet_id
                JOIN dbo.Yolcu Y ON SA.tc_no = Y.tc_no
                JOIN dbo.Odeme O ON SA.odeme_id = O.odeme_id
                JOIN dbo.Koltuk K ON B.bilet_id = K.bilet_id
                JOIN dbo.Sefer S ON B.sefer_id = S.sefer_id
                JOIN dbo.Otobus Ot ON S.sefer_otobus_id = Ot.otobus_id
                JOIN dbo.Firma F ON Ot.ot_firma_id = F.firma_id
                WHERE SA.odeme_id IN (SELECT odeme_id FROM dbo.Satin_Alir WHERE tc_no = @userTc)
                ORDER BY S.sefer_tarihi DESC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Biletler getirilemedi." });
    }
});







// --- BİLET DETAYI GETİRME (İade Sayfası İçin) ---
app.get('/api/bilet-detay/:id', async (req, res) => {
    try {
        const pool = await poolPromise; 
        const biletId = req.params.id;

        const result = await pool.request()
            .input('bid', sql.Int, biletId)
            .query(`
                SELECT 
                    B.bilet_id, B.fiyat, Y.ad, Y.soy_ad, 
                    S.kalkis_sehri, S.varis_sehri, S.sefer_tarihi, 
                    CONVERT(VARCHAR(5), S.kalkis_saati, 108) AS kalkis_saati, 
                    K.koltuk_no
                FROM dbo.Bilet B
                LEFT JOIN dbo.Satin_Alir SA ON B.bilet_id = SA.bilet_id
                LEFT JOIN dbo.Yolcu Y ON SA.tc_no = Y.tc_no
                LEFT JOIN dbo.Sefer S ON B.sefer_id = S.sefer_id
                LEFT JOIN dbo.Koltuk K ON B.bilet_id = K.bilet_id
                WHERE B.bilet_id = @bid
            `);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ success: false, message: "Bilet bulunamadı." });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// --- BİLET İADE VE SİLME İŞLEMİ (GRUP ALIMI UYUMLU) ---
app.post('/api/bilet-iade', async (req, res) => {
    const { biletId } = req.body;
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Bilet ve ödeme bilgilerini al
        const infoRes = await transaction.request()
            .input('bid', sql.Int, biletId)
            .query(`SELECT SA.odeme_id, B.fiyat 
                    FROM dbo.Satin_Alir SA 
                    JOIN dbo.Bilet B ON SA.bilet_id = B.bilet_id 
                    WHERE SA.bilet_id = @bid`);
        
        if (infoRes.recordset.length === 0) {
            throw new Error("Bilet bulunamadı veya daha önce iade edilmiş.");
        }
        
        const { odeme_id, fiyat } = infoRes.recordset[0];

        // 2. Iade Tablosuna Kayıt At
        await transaction.request()
            .input('tutar', sql.Decimal(10,2), fiyat)
            .input('oid', sql.Int, odeme_id)
            .query(`INSERT INTO dbo.Iade (iade_tutari, iade_tarihi, odeme_id) 
                    VALUES (@tutar, GETDATE(), @oid)`);

        // 3. Koltuk Tablosundan Kaydı Sil (Koltuk boşa çıkar)
        await transaction.request()
            .input('bid', sql.Int, biletId)
            .query(`DELETE FROM dbo.Koltuk WHERE bilet_id = @bid`);

        // 4. Satin_Alir Tablosundan Sil (İlişkiyi kopar)
        await transaction.request()
            .input('bid', sql.Int, biletId)
            .query(`DELETE FROM dbo.Satin_Alir WHERE bilet_id = @bid`);

        // 5. Bilet Tablosundan Sil
        await transaction.request()
            .input('bid', sql.Int, biletId)
            .query(`DELETE FROM dbo.Bilet WHERE bilet_id = @bid`);


        await transaction.commit();
        res.status(200).json({ success: true, message: "İade işlemi başarıyla tamamlandı." });

    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("İade işlemi hatası:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});


// Sunucuyu Başlat
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} adresinde aktif.`));