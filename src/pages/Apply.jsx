import { useState, useEffect, useCallback, memo } from "react"; // Tambah useCallback & memo
import { db } from "../firebase";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import SuccessModal from "../components/SuccessModal";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";

// --- IMPORT COMPONENT BACKGROUND ---
import AnimatedBackground from "../components/AnimatedBackground";
import headerImage from "../assets/header-fix-ikan.png";

// --- 1. SUB-COMPONENT: HEADER (Di-Memoize agar tidak re-render saat ngetik) ---
const HeaderSection = memo(() => (
    <>
        <div className="w-full h-auto relative">
            <img
                src={headerImage}
                alt="Join The Team"
                className="w-full h-full object-cover"
                loading="lazy" // Lazy load gambar
            />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0f0a18] to-transparent"></div>
        </div>

        <div className="p-8 md:p-12 pt-4 pb-0">
            <div className="mb-8 text-center md:text-left relative">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-fuchsia-200 to-purple-200 mb-2 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] flex items-center gap-2 justify-center md:justify-start">
                    Join The Team.
                </h1>
                <p className="text-purple-300/60 font-medium">Isi formulir di bawah ini dengan jujur.</p>
                <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full mt-4 mx-auto md:mx-0 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
            </div>
        </div>
    </>
));

// --- 2. SUB-COMPONENT: ITEM PERTANYAAN DINAMIS (Di-Memoize) ---
const QuestionItem = memo(({ q, value, onChange }) => {
    return (
        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
            <label className="block text-sm font-semibold text-purple-100 mb-3">{q.text}</label>
            {q.type === 'longtext' ? (
                <textarea
                    required
                    rows={3}
                    value={value || ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    className="w-full bg-[#0a0514] border border-white/10 text-purple-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all placeholder-white/20"
                    placeholder="Jawab di sini..."
                />
            ) : q.type === 'scale' ? (
                <div className="bg-[#0a0514] p-4 rounded-xl border border-white/10">
                    <div className="flex justify-between text-xs font-bold text-purple-300/60 mb-3"><span>1 (Kurang)</span><span>10 (Sangat Bisa)</span></div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={value || 5}
                        onChange={(e) => onChange(q.id, e.target.value)}
                        className="w-full accent-purple-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-center font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 mt-2 text-xl">{value || 5}</div>
                </div>
            ) : (
                <input
                    type="text"
                    required
                    value={value || ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    className="w-full bg-[#0a0514] border border-white/10 text-purple-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-white/20"
                    placeholder="Jawaban..."
                />
            )}
        </div>
    );
});


// --- 3. COMPONENT UTAMA ---
export default function Apply() {
    const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

    const [formData, setFormData] = useState({
        nama: "",
        nim: "",
        prodi: "",
        angkatan: "",
        whatsapp: "",
        divisi: "",
    });

    const [dynamicQuestions, setDynamicQuestions] = useState([]);
    const [dynamicAnswers, setDynamicAnswers] = useState({});
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "error" });

    // --- LOGIC FETCH SOAL ---
    useEffect(() => {
        if (!formData.divisi) {
            setDynamicQuestions([]);
            return;
        }

        const fetchQuestionsWithCache = async () => {
            setLoadingConfig(true);
            const CACHE_KEY = `form_cache_${formData.divisi}`;
            const CACHE_DURATION = 60 * 60 * 1000;

            try {
                const cachedData = localStorage.getItem(CACHE_KEY);
                if (cachedData) {
                    const { data, timestamp } = JSON.parse(cachedData);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        setDynamicQuestions(data);
                        setLoadingConfig(false);
                        return;
                    }
                }

                const docRef = doc(db, "formConfigs", formData.divisi);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const fetchedQuestions = docSnap.data().questions || [];
                    setDynamicQuestions(fetchedQuestions);
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        data: fetchedQuestions,
                        timestamp: Date.now()
                    }));
                } else {
                    setDynamicQuestions([]);
                }
            } catch (e) {
                console.error("Gagal load pertanyaan", e);
                const cachedData = localStorage.getItem(CACHE_KEY);
                if (cachedData) setDynamicQuestions(JSON.parse(cachedData).data);
            } finally {
                setLoadingConfig(false); // Hapus setTimeout agar UI lebih responsif
            }
        };

        fetchQuestionsWithCache();
        setDynamicAnswers({});
    }, [formData.divisi]);

    // --- OPTIMASI HANDLER (Pakai useCallback) ---
    const handleChange = useCallback((e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleDynamicAnswer = useCallback((id, value) => {
        setDynamicAnswers(prev => ({ ...prev, [id]: value }));
    }, []);

    const submitToGoogleSheets = async (finalData) => {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalData),
            });
        } catch (error) {
            console.error("❌ Failed sending to Sheets:", error);
        }
    };

    const showToast = (message, type = "error") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (!formData.nim || !formData.nama) {
            showToast("Mohon lengkapi Nama dan NIM dulu ya!", "error");
            setSubmitting(false);
            return;
        }

        if (formData.whatsapp.length < 10) {
            showToast("Nomor WhatsApp kurang lengkap (min. 10 angka)", "error");
            setSubmitting(false);
            return;
        }

        try {
            const docId = formData.nim.trim();
            const docRef = doc(db, "applicants", docId);

            const answersDetails = dynamicQuestions.map(q => ({
                id: q.id,
                question: q.text,
                answer: dynamicAnswers[q.id] || "-"
            }));

            const firestorePayload = {
                ...formData,
                nim: docId,
                answersDetails: answersDetails,
                dynamicAnswers: dynamicAnswers,
                createdAt: serverTimestamp(),
            };

            const sheetsPayload = {
                ...firestorePayload,
                status: "pending",
                nilai: JSON.stringify({ speaking: 0, teknis: 0, teamwork: 0, attitude: 0, kreativitas: 0, solving: 0 }),
                createdAt: new Date().toISOString()
            };

            await setDoc(docRef, firestorePayload);
            submitToGoogleSheets(sheetsPayload);

            setShowSuccess(true);
        } catch (error) {
            console.error("Submit Error:", error);
            if (error.code === 'permission-denied') {
                showToast(`Ups! NIM ${formData.nim} sudah terdaftar atau akses ditolak.`, "error");
            } else {
                showToast("Gagal terhubung ke server. Coba lagi.", "error");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        // UBAHAN 1: 'py-12' memberi jarak atas-bawah yang cukup lega di HP agar background terlihat.
        // 'px-6' memberi jarak kiri-kanan agar form tidak mepet layar.
        <div className="relative min-h-screen flex items-center justify-center py-12 px-6 md:px-8 font-sans text-slate-100 overflow-hidden">

            {/* Background tetap render sekali saja */}
            <AnimatedBackground />

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => window.location.reload()}
                title="Pendaftaran Berhasil!"
                message="Data kamu sudah masuk ke database panitia. Good luck!"
            />

            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -50, x: "-50%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        // Toast tetap fixed di atas
                        className="fixed top-6 left-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-[#1a1025]/95 backdrop-blur-sm border border-red-500/50 shadow-lg rounded-2xl w-[90%] max-w-md"
                    >
                        <div className="bg-red-500/20 p-2 rounded-full text-red-400 shrink-0">
                            <AlertCircle size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-red-100">Periksa Lagi</span>
                            <span className="text-xs font-medium text-red-300">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FORM CONTAINER */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                // UBAHAN 2: w-full memastikan responsif, max-w-2xl membatasi lebar di layar besar.
                // mx-auto membantu centering tambahan jika flexbox gagal (jarang terjadi).
                className="w-full max-w-2xl mx-auto bg-[#0f0a18]/80 backdrop-blur-md rounded-3xl shadow-[0_0_30px_rgba(139,92,246,0.1)] border border-purple-500/20 relative z-10 overflow-hidden"
            >
                {/* Bagian Header yang di-Memoize */}
                <HeaderSection />

                {/* Form Content - Padding disesuaikan agar rapi di mobile */}
                <div className="p-6 md:p-12 pt-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-purple-300 uppercase mb-2 tracking-wider">Nama Lengkap</label>
                                <input type="text" name="nama" required value={formData.nama} onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 text-purple-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-semibold transition-all hover:bg-white/10"
                                    placeholder="Nama Lengkap" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-purple-300 uppercase mb-2 tracking-wider">NIM</label>
                                <input type="text" name="nim" required value={formData.nim} onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 text-purple-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all hover:bg-white/10"
                                    placeholder="NIM" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-purple-300 uppercase mb-2 tracking-wider">Prodi</label>
                                <div className="relative">
                                    <select name="prodi" required value={formData.prodi} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 text-purple-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none cursor-pointer transition-all hover:bg-white/10">
                                        <option value="" disabled className="bg-[#1a1025] text-gray-400">-- Pilih Prodi --</option>
                                        <option value="Informatika" className="bg-[#1a1025]">Informatika</option>
                                        <option value="Sistem Informasi" className="bg-[#1a1025]">Sistem Informasi</option>
                                        <option value="Teknologi Informasi" className="bg-[#1a1025]">Teknologi Informasi</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-purple-300 uppercase mb-2 tracking-wider">Angkatan</label>
                                <div className="relative">
                                    <select name="angkatan" required value={formData.angkatan} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 text-purple-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none cursor-pointer transition-all hover:bg-white/10">
                                        <option value="" disabled className="bg-[#1a1025] text-gray-400">-- Pilih Angkatan --</option>
                                        <option value="2023" className="bg-[#1a1025]">2023</option>
                                        <option value="2024" className="bg-[#1a1025]">2024</option>
                                        <option value="2025" className="bg-[#1a1025]">2025</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-purple-300 uppercase mb-2 tracking-wider">WhatsApp</label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    name="whatsapp"
                                    required
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 text-purple-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all hover:bg-white/10"
                                    placeholder="08..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-purple-300 uppercase mb-2 tracking-wider">Pilih Divisi</label>
                                <div className="relative group">
                                    <select name="divisi" required value={formData.divisi} onChange={handleChange}
                                        className="w-full bg-white/5 border border-purple-500/30 text-purple-100 font-bold px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none cursor-pointer transition-all hover:bg-purple-900/20 hover:border-purple-500/60">
                                        <option value="" disabled className="bg-[#1a1025] text-gray-400">-- Pilih Divisi --</option>
                                        <option value="acara" className="bg-[#1a1025]">Divisi Acara</option>
                                        <option value="humas" className="bg-[#1a1025]">Divisi Humas</option>
                                        <option value="pdd" className="bg-[#1a1025]">Divisi PDD</option>
                                        <option value="perkab" className="bg-[#1a1025]">Divisi Perkap</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400">
                                        <Sparkles size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/10 my-4"></div>

                        {/* Dynamic Questions */}
                        <AnimatePresence mode="wait">
                            {loadingConfig ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-purple-500" size={32} />
                                </motion.div>
                            ) : (
                                formData.divisi && (
                                    <motion.div key="questions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        {dynamicQuestions.length === 0 ? (
                                            <p className="text-purple-300/50 italic text-sm text-center border border-white/5 p-4 rounded-xl bg-white/5">Tidak ada pertanyaan khusus untuk divisi ini.</p>
                                        ) : (
                                            dynamicQuestions.map((q) => (
                                                <QuestionItem
                                                    key={q.id}
                                                    q={q}
                                                    value={dynamicAnswers[q.id]}
                                                    onChange={handleDynamicAnswer}
                                                />
                                            ))
                                        )}
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>

                        <button type="submit" disabled={submitting || !formData.divisi}
                            className="w-full py-4 bg-gradient-to-r from-purple-700 via-fuchsia-700 to-purple-700 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(192,38,211,0.5)] transition-all shadow-lg disabled:opacity-50 disabled:shadow-none mt-6 transform active:scale-95 border border-white/10 relative overflow-hidden group">
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                {submitting ? "Mengirim Data..." : "Kirim Pendaftaran"}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}