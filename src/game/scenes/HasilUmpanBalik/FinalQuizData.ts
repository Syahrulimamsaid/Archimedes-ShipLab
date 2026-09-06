import { QuizConfig } from "../AnatomiStruktur/QuizScene";

/**
 * The cumulative final-evaluation quiz launched from Hasil & Umpan Balik —
 * one question set spanning both Anatomi Struktur (hull components, SOP
 * darurat kebocoran) and Simulator Stabilitas (moment/heel, distribusi
 * muatan) so it reads as a recap of the whole module, not just one part of
 * it. All 10 must be correct to claim the badge and see the completion
 * popup (see QuizScene.renderResult()'s perfectScoreMessage handling).
 */
export const FINAL_EVALUATION_QUIZ: QuizConfig = {
    title: "KUIS EVALUASI AKHIR",
    passScore: 10,
    badgeId: "master-of-maritime-safety",
    badgeName: "Master of Maritime Safety",
    perfectScoreMessage: "Selamat, Anda berhasil menyelesaikan materi dan kuis!",
    questions: [
        {
            question: "Apa fungsi utama Centre Girder (Penyangga Tengah) pada struktur dasar berganda kapal?",
            options: [
                "Menjadi tulang punggung utama yang menopang beban utama dan menjaga kekakuan memanjang dasar kapal",
                "Mengatur sirkulasi udara di ruang muat",
                "Menahan tekanan air laut dari luar kulit kapal",
                "Menyambungkan dek atas dengan dek bawah",
            ],
            correctIndex: 0,
        },
        {
            question: "Apa perbedaan utama antara Wrang Penuh (Solid Floor) dan Wrang Terbuka (Open Floor)?",
            options: [
                "Wrang penuh tanpa lubang besar untuk kekuatan melintang maksimal, wrang terbuka punya lubang peringan & manhole untuk mengurangi berat",
                "Wrang penuh terbuat dari kayu, wrang terbuka dari baja",
                "Wrang terbuka hanya dipasang di haluan kapal",
                "Tidak ada perbedaan, hanya penamaan yang berbeda",
            ],
            correctIndex: 0,
        },
        {
            question: "Apa tindakan pertama yang harus dilakukan awak kapal saat alarm kebocoran (flooding alarm) berbunyi?",
            options: [
                "Menutup seluruh pintu kedap air pada kompartemen yang terdampak",
                "Membuka seluruh pintu kedap air untuk evakuasi",
                "Melanjutkan aktivitas seperti biasa",
                "Menunggu instruksi dari darat melalui radio",
            ],
            correctIndex: 0,
        },
        {
            question: "Material apa yang umum digunakan untuk pintu kedap air agar tahan tekanan air dan korosi?",
            options: [
                "Baja marin (marine steel) dengan lapisan epoxy / zinc rich primer",
                "Kayu lapis dengan lapisan cat biasa",
                "Plastik ABS",
                "Aluminium tanpa pelapisan",
            ],
            correctIndex: 0,
        },
        {
            question: "Apa yang dimaksud dengan \"momen\" dalam simulasi distribusi muatan kapal?",
            options: [
                "Hasil kali berat muatan dengan jarak (lengan) muatan tersebut dari garis tengah kapal",
                "Total berat seluruh muatan di kapal",
                "Kecepatan kapal saat berlayar",
                "Waktu yang dibutuhkan untuk memuat barang",
            ],
            correctIndex: 0,
        },
        {
            question: "Apa akibat jika muatan yang berat ditempatkan hanya pada satu sisi kapal (kiri atau kanan)?",
            options: [
                "Kapal akan miring (heel) ke sisi yang lebih berat",
                "Kapal akan melaju lebih cepat",
                "Kapal menjadi lebih hemat bahan bakar",
                "Tidak ada efek terhadap kestabilan kapal",
            ],
            correctIndex: 0,
        },
        {
            question: "Bagaimana cara menyeimbangkan kembali kapal yang miring pada Simulator Stabilitas?",
            options: [
                "Memindahkan/menambah muatan ke sisi yang lebih ringan hingga momen kiri dan kanan seimbang",
                "Membuang seluruh muatan ke laut",
                "Menambah kecepatan mesin kapal",
                "Mengurangi jumlah awak kapal",
            ],
            correctIndex: 0,
        },
        {
            question: "Mengapa menumpuk muatan berat terlalu tinggi tetap berbahaya walau momen kiri-kanan sudah seimbang?",
            options: [
                "Karena menaikkan titik berat (G) kapal, mendekati titik metasentrik (M), sehingga mengurangi stabilitas",
                "Karena membuat kapal menjadi lebih ringan",
                "Karena mempercepat proses bongkar muat",
                "Tidak berpengaruh apapun terhadap kapal",
            ],
            correctIndex: 0,
        },
        {
            question: "Apa fungsi utama pelat Tank Top (Tank Top Plating)?",
            options: [
                "Menjadi dasar ruang muat sekaligus pemisah kedap air dari tangki ballast/bahan bakar di bawahnya",
                "Menjadi lapisan cat luar kapal",
                "Menopang tiang layar kapal",
                "Menjadi tempat pemasangan mesin utama",
            ],
            correctIndex: 0,
        },
        {
            question: "Mengapa mekanisme pengunci dan karet kedap pintu kedap air harus rutin diperiksa?",
            options: [
                "Agar pintu dapat menutup rapat dan efektif mencegah rembesan air saat darurat",
                "Agar tampilan pintu tetap mengkilap",
                "Karena hanya diwajibkan saat kapal baru selesai dibangun",
                "Agar bobot kapal berkurang",
            ],
            correctIndex: 0,
        },
    ],
};
