const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const s3 = new S3Client({ region: 'us-east-1' });
const upload = multer({ storage: multer.memoryStorage() });
const BUCKET_NAME = 'transbandung-laporan-ikrima';

// ==========================================
// KONEKSI & SETUP DATABASE OTOMATIS
// ==========================================
const db = mysql.createConnection({
    host: 'transbandung-db.cwjai4ks2rgu.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'databasetransbdg123',
    port: 3306
});

db.connect((err) => {
    if (err) return console.error('Gagal koneksi RDS:', err.message);
    console.log('Berhasil konek ke RDS TransBandung!');

    db.query('CREATE DATABASE IF NOT EXISTS transbandung_db', (err) => {
        if (err) return console.error('Gagal bikin DB:', err);
        db.query('USE transbandung_db', (err) => {
            const sql = `CREATE TABLE IF NOT EXISTS armada (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_kendaraan VARCHAR(100),
                rute VARCHAR(100),
                url_gambar VARCHAR(255)
            )`;
            db.query(sql, () => console.log('Database & Tabel TransBandung SIAP!'));
        });
    });
});

// ==========================================
// TAMPILAN DASHBOARD PREMIUM (GRADASI & GLASSMORPHISM)
// ==========================================
app.get('/', (req, res) => {
    db.query('SELECT * FROM armada ORDER BY id DESC', (err, results) => {
        let cards = '';
        if (results && results.length > 0) {
            results.forEach(bus => {
                cards += `
                <div class="col">
                    <div class="card h-100 bus-card shadow">
                        <div class="img-wrapper">
                            <img src="${encodeURI(bus.url_gambar)}" class="card-img-top" alt="Foto Bus" style="height: 250px; object-fit: cover;">
                        </div>
                        <div class="card-body bg-white text-center">
                            <h5 class="card-title fw-bold text-dark mb-2"><i class="fas fa-bus-alt text-primary me-2"></i>${bus.nama_kendaraan}</h5>
                            <span class="badge rounded-pill bg-light text-secondary border px-3 py-2"><i class="fas fa-map-marker-alt text-danger me-1"></i> ${bus.rute}</span>
                        </div>
                    </div>
                </div>`;
            });
        } else {
            cards = `
            <div class="col-12">
                <div class="alert glass-card text-center py-5">
                    <i class="fas fa-box-open fa-3x mb-3 text-muted opacity-50"></i>
                    <h5 class="fw-bold text-dark">Belum ada data armada</h5>
                    <p class="text-secondary mb-0">Jadilah yang pertama mengunggah foto armada TransBandung!</p>
                </div>
            </div>`;
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>TransBandung | Premium Dashboard</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
                <style>
                    body { 
                        font-family: 'Poppins', sans-serif; 
                        background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
                        min-height: 100vh;
                    }
                    .navbar-custom {
                        background: rgba(255, 255, 255, 0.9) !important;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
                    }
                    .glass-card {
                        background: rgba(255, 255, 255, 0.85);
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.5);
                        border-radius: 24px;
                        box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
                    }
                    .bus-card {
                        border: none;
                        border-radius: 20px;
                        overflow: hidden;
                        transition: all 0.4s ease;
                    }
                    .bus-card:hover {
                        transform: translateY(-12px);
                        box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
                    }
                    .btn-gradient {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                        transition: all 0.3s ease;
                    }
                    .btn-gradient:hover {
                        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                        transform: scale(1.03);
                        color: white;
                        box-shadow: 0 10px 20px rgba(118, 75, 162, 0.3);
                    }
                    .form-control {
                        border-radius: 12px;
                        padding: 12px 15px;
                        border: 1px solid #e1e5eb;
                        background: rgba(255,255,255,0.9);
                    }
                    .form-control:focus {
                        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
                        border-color: #667eea;
                    }
                </style>
            </head>
            <body>
                <nav class="navbar navbar-expand-lg navbar-light navbar-custom py-3 sticky-top">
                    <div class="container">
                        <a class="navbar-brand fw-bold text-primary" href="/">
                            <i class="fas fa-bus-alt me-2" style="background: -webkit-linear-gradient(#667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i> 
                            TransBandung<span class="text-dark">Cloud</span>
                        </a>
                    </div>
                </nav>

                <div class="container mt-5 mb-5">
                    <div class="row g-5">
                        <div class="col-lg-4">
                            <div class="glass-card p-4 sticky-top" style="top: 100px;">
                                <div class="text-center mb-4">
                                    <div class="d-inline-block p-3 rounded-circle mb-3" style="background: linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1));">
                                        <i class="fas fa-cloud-upload-alt fa-2x text-primary"></i>
                                    </div>
                                    <h4 class="fw-bold text-dark">Lapor Armada</h4>
                                    <p class="text-muted small">Unggah foto terbaru armada bus TransBandung ke AWS S3</p>
                                </div>
                                <form action="/api/armada" method="POST" enctype="multipart/form-data">
                                    <div class="mb-3">
                                        <label class="form-label fw-semibold text-secondary small">Nama Armada</label>
                                        <input type="text" name="nama_kendaraan" placeholder="Cth: TMB Koridor 3" class="form-control" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-semibold text-secondary small">Rute Perjalanan</label>
                                        <input type="text" name="rute" placeholder="Cth: Cicaheum - Sarijadi" class="form-control" required>
                                    </div>
                                    <div class="mb-4">
                                        <label class="form-label fw-semibold text-secondary small">Foto Armada (Upload S3)</label>
                                        <input type="file" name="gambar" class="form-control" accept="image/*" required>
                                    </div>
                                    <button type="submit" class="btn btn-gradient btn-lg w-100 shadow-sm">
                                        Kirim Laporan <i class="fas fa-paper-plane ms-2"></i>
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div class="col-lg-8">
                            <div class="d-flex align-items-center mb-4">
                                <h3 class="fw-bold text-dark mb-0">Galeri Armada Aktif</h3>
                                <span class="badge bg-white text-primary shadow-sm rounded-pill ms-3 px-3 py-2 border">Live Update</span>
                            </div>
                            <div class="row row-cols-1 row-cols-md-2 g-4">
                                ${cards}
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
    });
});

// ==========================================
// UPLOAD S3 & INSERT KE DATABASE
// ==========================================
app.post('/api/armada', upload.single('gambar'), async (req, res) => {
    try {
        const { nama_kendaraan, rute } = req.body;
        const file = req.file;

        const cleanFileName = file.originalname.replace(/\s+/g, '-');
        const fileName = Date.now() + '_' + cleanFileName;

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype
        }));

        const imageUrl = `http://transbandung.sondang.my.id/${fileName}`;

        const sql = 'INSERT INTO armada (nama_kendaraan, rute, url_gambar) VALUES (?, ?, ?)';
        db.query(sql, [nama_kendaraan, rute, imageUrl], (err) => {
            if (err) return res.status(500).send("Gagal simpan DB: " + err.message);
            res.redirect('/');
        });
    } catch (err) {
        res.status(500).send("Gagal upload S3: " + err.message);
    }
});

app.listen(port, () => console.log(`TransBandung jalan di port ${port}`));