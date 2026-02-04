import { motion } from "framer-motion";

export default function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600">
            {/* BACKGROUND: Gradasi Biru Langit Pekat -> Biru Laut (Supaya elemen putih menonjol) */}

            {/* --- 1. CRISP WHITE GRID (Grid Putih Tegas) --- */}
            {/* Grid ini bikin nuansa 'Blueprint' atau Arsitektur Tech */}
            <div
                className="absolute inset-0 opacity-[0.2]"
                style={{
                    backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            ></div>

            {/* --- 2. LIGHT SOURCE (Efek Matahari Digital) --- */}
            <motion.div
                className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-white/30 rounded-full blur-[100px]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
            />

            {/* --- 3. HIGH CONTRAST TECH SHAPES (Benda Melayang) --- */}

            {/* Hexagon Besar (Kiri Bawah) - Glass Effect */}
            <motion.div
                className="absolute bottom-[10%] left-[5%] w-40 h-40 backdrop-blur-md bg-white/10 border-2 border-white/50 shadow-lg z-0"
                style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                animate={{
                    y: [0, -30, 0],
                    rotate: [0, 5, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Lingkaran Outline Tebal (Kanan Atas) */}
            <motion.div
                className="absolute top-[15%] right-[10%] w-32 h-32 rounded-full border-[3px] border-white/40"
                animate={{
                    y: [0, 20, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
                {/* Titik tengah */}
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_white]"></div>
            </motion.div>

            {/* Kartu Kaca Persegi (Kiri Atas - Dekat Header) */}
            <motion.div
                className="absolute top-[20%] left-[10%] w-24 h-24 bg-white/10 backdrop-blur-sm border border-white/60 rounded-xl shadow-lg"
                animate={{
                    rotate: [0, 90, 180, 270, 360],
                    scale: [1, 0.8, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />

            {/* Cross / Plus Signs (Simbol Tech Minimalis) */}
            <PlusSign top="40%" left="85%" size={30} delay={0} />
            <PlusSign top="60%" left="15%" size={20} delay={2} />
            <PlusSign top="80%" left="70%" size={40} delay={4} />

            {/* --- 4. DATA LINES (Garis Koneksi) --- */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <motion.line
                    x1="10%" y1="10%" x2="90%" y2="90%"
                    stroke="white" strokeWidth="1" strokeDasharray="10 10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 5, ease: "easeInOut" }}
                />
                <motion.circle
                    cx="90%" cy="90%"
                    r={5} // Ganti "5" (string) jadi {5} (number) biar aman
                    fill="white"
                    initial={{ r: 5, opacity: 0.5 }} // Set initial state eksplisit
                    animate={{
                        r: [3, 6, 3],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </svg>

        </div>
    );
}

// Komponen Kecil: Tanda Tambah (+) Putih
function PlusSign({ top, left, size, delay }) {
    return (
        <motion.div
            className="absolute flex items-center justify-center"
            style={{ top, left, width: size, height: size }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, delay: delay }}
        >
            <div className="absolute w-full h-[3px] bg-white rounded-full shadow-sm"></div>
            <div className="absolute h-full w-[3px] bg-white rounded-full shadow-sm"></div>
        </motion.div>
    )
}