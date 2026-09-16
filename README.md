# ML Visual Lab

ML Visual Lab adalah aplikasi web interaktif untuk mempelajari konsep dasar machine learning melalui visualisasi 2D. Pengguna dapat mengubah parameter, menjalankan proses fitting atau training, mengamati perubahan plot dan metrik, lalu mencoba prediksi pada data baru.

Aplikasi ini ditujukan untuk pengajaran di kelas, workshop, dan belajar mandiri. Fokusnya adalah membantu memahami proses di balik algoritma—bukan menggantikan library machine learning produksi seperti scikit-learn.

## Fitur

Playground yang tersedia:

- **Linear Regression** — mengubah slope dan intercept, melihat residual serta MSE, dan menghitung ordinary least-squares best fit.
- **Logistic Regression** — memahami score, sigmoid, probability, threshold, decision boundary, dan inference.
- **K-Nearest Neighbors** — memilih nilai `K`, memindahkan query point, dan melihat voting dari tetangga terdekat.
- **Linear SVM** — mengatur penalty `C`, melihat decision boundary, margin, support vector, dan prediksi titik baru.
- **Decision Tree** — memilih maximum depth, membangun split berbasis Gini impurity, menghubungkan data space dengan tree view, dan mengikuti jalur inference.
- **K-Means** — menjalankan fase initialize → assign → update langkah demi langkah, memantau WCSS dan perpindahan centroid, serta mencoba inference setelah konvergen.

Fitur antarmuka bersama:

- visualisasi SVG responsif;
- sidebar dengan pencarian playground;
- navigasi berbasis URL hash, misalnya `#knn`;
- drawer navigasi untuk layar kecil;
- kontrol yang dapat digunakan dengan keyboard;
- penjelasan dinamis berbasis state saat ini;
- dukungan `prefers-reduced-motion` untuk mengurangi animasi non-esensial.

## Teknologi

- HTML5
- CSS3
- JavaScript vanilla dengan ES modules
- SVG untuk plot dan diagram

Tidak ada backend, database, autentikasi, Python, build system, atau dependency pihak ketiga. Dataset yang digunakan adalah dataset pengajaran kecil yang sudah ditentukan di dalam kode.

## Menjalankan secara lokal

Karena aplikasi menggunakan ES modules, jalankan melalui web server lokal agar semua module dapat dimuat dengan benar.

### Opsi 1: Python

Pastikan Python 3 tersedia, lalu jalankan dari root repository:

```bash
python -m http.server 8000
```

Buka [http://localhost:8000](http://localhost:8000) di browser.

### Opsi 2: XAMPP

1. Letakkan repository ini di `htdocs/mlviz`.
2. Jalankan Apache dari XAMPP Control Panel.
3. Buka [http://localhost/mlviz/](http://localhost/mlviz/).

### Opsi 3: PHP built-in server

Jika PHP tersedia:

```bash
php -S localhost:8000
```

Kemudian buka [http://localhost:8000](http://localhost:8000).

## Struktur repository

```text
.
├── index.html                    # Shell aplikasi dan markup semua playground
├── css/
│   └── app.css                   # Token desain, layout, responsive UI, dan styling SVG
├── js/
│   ├── app.js                    # Navigasi, pencarian, drawer, dan bootstrap playground
│   ├── core/
│   │   ├── math.js               # Fungsi matematika bersama
│   │   └── plot.js               # Helper skala, frame, tick, dan teks SVG
│   └── playgrounds/
│       ├── linear-regression.js
│       ├── logistic-regression.js
│       ├── knn.js
│       ├── svm.js
│       ├── decision-tree.js
│       └── k-means.js
├── PRD_ML_Visual_Lab_V1.md       # Product requirements
├── design_ML_Visual_Lab_V1.md    # Design specification
└── task.md                       # Roadmap dan catatan verifikasi
```

Setiap playground memisahkan state, logika algoritma, dan rendering SVG sejauh yang diperlukan. `js/app.js` hanya menangani shell aplikasi dan menghubungkan elemen HTML dengan modul playground.

## Validasi sintaks

Tidak ada test runner atau proses build khusus. Untuk memeriksa sintaks semua file JavaScript menggunakan Node.js:

```powershell
Get-ChildItem .\js -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Setelah perubahan UI atau interaksi, lakukan smoke test di browser untuk memastikan navigasi, kontrol, plot, inference, dan responsive layout tetap berfungsi.

## Batasan V1

- Dataset tidak dapat diunggah atau diganti melalui UI.
- Dataset berukuran kecil dan dirancang untuk demonstrasi konsep.
- Tidak ada penyimpanan progress, akun pengguna, atau export model.
- Implementasi ditujukan untuk pembelajaran konseptual, bukan training model produksi atau evaluasi ilmiah skala besar.
- Gradient Descent tidak termasuk dalam navigasi atau build V1 saat ini.

## Lisensi

Belum ada lisensi open-source yang ditentukan untuk repository ini.
