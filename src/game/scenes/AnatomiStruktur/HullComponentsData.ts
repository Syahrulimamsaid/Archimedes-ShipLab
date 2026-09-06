import { HullComponentInfo } from "./InfoWindow";
import { QuizConfig } from "./QuizScene";

export interface HullComponentData extends HullComponentInfo {
    key: string;
}

// Shown immediately whenever this scene opens (not gated behind selecting
// any particular component — the watertight door hotspot that used to
// trigger it was removed from the diagram). Answering this correctly
// (>= passScore) unlocks the "Ship Construction Surveyor" badge shown in
// MainMenu's profile card (see BadgeState.ts).
export const SOP_DARURAT_QUIZ: QuizConfig = {
    title: "KUIS SOP DARURAT KEBOCORAN",
    // All 5 must be correct — a single wrong answer keeps Simulator
    // Stabilitas locked (see QuizScene.renderResult()'s unlock gating).
    passScore: 5,
    badgeId: "ship-construction-surveyor",
    badgeName: "Ship Construction Surveyor",
    questions: [
        {
            question: "Apa fungsi utama pintu kedap air (watertight door) di kapal?",
            options: [
                "Mempercepat proses bongkar muat barang",
                "Mencegah penyebaran air antar kompartemen saat terjadi kebocoran",
                "Mengatur sirkulasi udara di dalam kapal",
                "Menahan beban muatan di geladak atas",
            ],
            correctIndex: 1,
        },
        {
            question:
                "Apa yang harus segera dilakukan awak kapal saat alarm kebocoran (flooding alarm) berbunyi?",
            options: [
                "Menutup seluruh pintu kedap air pada kompartemen yang terdampak",
                "Melanjutkan aktivitas seperti biasa",
                "Membuka seluruh pintu kedap air untuk evakuasi",
                "Menunggu instruksi dari darat melalui radio",
            ],
            correctIndex: 0,
        },
        {
            question:
                "Mengapa mekanisme pengunci dan karet kedap pintu kedap air harus rutin diperiksa?",
            options: [
                "Agar tampilan pintu tetap mengkilap",
                "Agar bobot kapal berkurang",
                "Agar pintu dapat menutup rapat dan efektif mencegah rembesan air saat darurat",
                "Karena hanya diwajibkan saat kapal baru selesai dibangun",
            ],
            correctIndex: 2,
        },
        {
            question:
                "Material apa yang umum digunakan untuk pintu kedap air agar tahan tekanan air dan korosi?",
            options: [
                "Kayu lapis dengan lapisan cat biasa",
                "Aluminium tanpa pelapisan",
                "Plastik ABS",
                "Baja marin (marine steel) dengan lapisan epoxy / zinc rich primer",
            ],
            correctIndex: 3,
        },
        {
            question: "Setelah kebocoran teratasi, mengapa pintu kedap air tidak boleh langsung dibuka kembali tanpa prosedur?",
            options: [
                "Karena harus menunggu konfirmasi bahwa kompartemen benar-benar aman dan tekanan air di sekitarnya sudah stabil",
                "Karena pintu kedap air hanya boleh dibuka satu kali dalam sehari",
                "Karena pembukaan pintu membutuhkan izin tertulis dari galangan kapal",
                "Karena pintu kedap air akan otomatis terkunci selama 24 jam setelah ditutup",
            ],
            correctIndex: 0,
        },
    ],
};

// The 9 labelled structural members shown on the double-bottom diagram.
export const HULL_COMPONENTS: HullComponentData[] = [
    {
        key: "gading-gading",
        number: 1,
        name: "Gading-gading",
        englishName: "Frames",
        description:
            "Profil baja siku/kanal yang berfungsi sebagai tulang rusuk melintang di dalam ruang dasar berganda, menopang pelat tank top dan menjaga bentuk struktur.",
        specs: [
            { label: "Material", value: "Baja Profil (Rolled Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A36" },
            { label: "Tebal", value: "8 - 14 mm" },
            { label: "Jarak Gading", value: "600 - 800 mm" },
            { label: "Lapisan Pelindung", value: "Primer Anti Karat" },
            {
                label: "Fungsi Utama",
                value: "Menopang pelat tank top & menjaga bentuk melintang",
            },
            {
                label: "Catatan",
                value: "Dipasang tegak lurus terhadap lunas kapal",
            },
        ],
    },
    {
        key: "tank-side-bracket",
        number: 2,
        name: "Tank Side Bracket",
        englishName: "Tank Side Bracket",
        description:
            "Pelat penguat berbentuk siku yang menghubungkan pelat tank top dengan lempeng samping pada sudut ruang dasar berganda.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "10 - 14 mm" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating" },
            {
                label: "Fungsi Utama",
                value: "Memperkuat sambungan sudut tank top dengan lempeng samping",
            },
            {
                label: "Catatan",
                value: "Dipasang pada setiap jarak gading di sisi kapal",
            },
        ],
    },
    {
        key: "lempeng-samping",
        number: 3,
        name: "Lempeng Samping",
        englishName: "Margin Plate",
        description:
            "Pelat miring yang menghubungkan pelat tank top dengan kulit kapal di bagian sisi, membentuk batas luar ruang dasar berganda.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "10 - 16 mm" },
            { label: "Kekuatan Tarik", value: "≥ 400 MPa" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating" },
            {
                label: "Fungsi Utama",
                value: "Membatasi sisi ruang dasar berganda & menyalurkan beban ke kulit kapal",
            },
            {
                label: "Catatan",
                value: "Kemiringan disesuaikan dengan bentuk lengkung kulit kapal",
            },
        ],
    },
    {
        key: "longitudinals",
        number: 4,
        name: "Longitudinals",
        englishName: "Longitudinals",
        description:
            "Profil baja memanjang yang dipasang di antara wrang untuk menahan gaya memanjang dan menjaga kestabilan pelat tank top serta kulit kapal.",
        specs: [
            { label: "Material", value: "Baja Profil (Rolled Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A36" },
            { label: "Tebal", value: "8 - 12 mm" },
            { label: "Jarak Pemasangan", value: "700 - 900 mm" },
            { label: "Lapisan Pelindung", value: "Primer Anti Karat" },
            {
                label: "Fungsi Utama",
                value: "Menahan gaya memanjang & mencegah tekuk pelat",
            },
            {
                label: "Catatan",
                value: "Dipasang sejajar dengan sumbu memanjang kapal",
            },
        ],
    },
    {
        key: "centre-girder",
        number: 5,
        name: "Penyangga Tengah",
        englishName: "Centre Girder",
        description:
            "Pelat baja tegak yang membentang di sepanjang garis tengah kapal, menjadi tulang punggung utama struktur dasar berganda.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "12 - 18 mm" },
            { label: "Kekuatan Tarik", value: "≥ 400 MPa" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating" },
            {
                label: "Fungsi Utama",
                value: "Menopang beban utama & menjaga kekakuan memanjang dasar kapal",
            },
            {
                label: "Catatan",
                value: "Menjadi acuan pemasangan wrang di kedua sisi",
            },
        ],
    },
    {
        key: "bracket",
        number: 6,
        name: "Bracket",
        englishName: "Bracket",
        description:
            "Pelat penguat berbentuk segitiga yang dipasang pada pertemuan antara penyangga tengah, wrang, dan longitudinals untuk memperkuat sambungan.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "8 - 12 mm" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating" },
            {
                label: "Fungsi Utama",
                value: "Memperkuat sambungan antar elemen struktur",
            },
            {
                label: "Catatan",
                value: "Ukuran disesuaikan dengan gaya yang bekerja pada sambungan",
            },
        ],
    },
    {
        key: "wrang-penuh",
        number: 7,
        name: "Wrang Penuh",
        englishName: "Solid Floor",
        description:
            "Pelat baja tegak melintang tanpa lubang besar, dipasang pada posisi tertentu (mis. di bawah sekat) untuk memberi kekuatan melintang maksimal.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "10 - 14 mm" },
            { label: "Kekuatan Tarik", value: "≥ 400 MPa" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating (tangki)" },
            {
                label: "Fungsi Utama",
                value: "Memberi kekuatan melintang maksimal & menahan tekanan sekat",
            },
            {
                label: "Catatan",
                value: "Dipasang berselang-seling dengan wrang terbuka",
            },
        ],
    },
    {
        key: "wrang-terbuka",
        number: 8,
        name: "Wrang Terbuka",
        englishName: "Open Floor",
        description:
            "Pelat baja tegak melintang dengan lubang peringan dan lubang orang (manhole), dipasang di antara wrang penuh untuk mengurangi berat sekaligus memungkinkan akses perawatan.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "8 - 12 mm" },
            { label: "Lapisan Pelindung", value: "Epoxy Coating (tangki)" },
            {
                label: "Fungsi Utama",
                value: "Mengurangi berat struktur & memberi akses inspeksi tangki",
            },
            {
                label: "Catatan",
                value: "Dilengkapi lubang orang (manhole) untuk pemeriksaan berkala",
            },
        ],
    },
    {
        key: "tank-top",
        number: 9,
        name: "Pelat Tank Top",
        englishName: "Tank Top Plating",
        description:
            "Pelat baja horizontal yang menjadi dasar ruang muat sekaligus atap ruang dasar berganda, memisahkan ruang muat dari tangki ballast/bahan bakar di bawahnya.",
        specs: [
            { label: "Material", value: "Baja Marin (Marine Steel)" },
            { label: "Standar", value: "ISO 9328-2 / ASTM A131" },
            { label: "Tebal", value: "12 - 18 mm" },
            { label: "Kekuatan Tarik", value: "≥ 400 MPa" },
            { label: "Lapisan Pelindung", value: "Anti-abrasion Coating" },
            {
                label: "Fungsi Utama",
                value: "Dasar ruang muat & pemisah kedap air dari tangki dasar berganda",
            },
            {
                label: "Catatan",
                value: "Menahan beban muatan langsung dari ruang kargo di atasnya",
            },
        ],
    },
];
