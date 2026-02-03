import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import SuccessModal from "../components/SuccessModal";
import AnimatedBackground from "../components/AnimatedBackground";
import { Loader2, AlertCircle } from "lucide-react";

export default function Apply() {
    // --- GANTI URL INI DENGAN URL DARI LANGKAH 2 TADI ---
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



    // --- LOGIC FETCH SOAL (TETAP SAMA SEPERTI SEBELUMNYA) ---
    useEffect(() => {
        if (!formData.divisi) {
            setDynamicQuestions([]);
            return;
        }

        const fetchQuestionsWithCache = async () => {
            setLoadingConfig(true);
            const CACHE_KEY = `form_cache_${formData.divisi}`;
            const CACHE_DURATION = 60 * 60 * 1000;
            // const CACHE_DURATION = 0; HANYA UNTUK DEV MODE. JANGAN DIOTAK ATIK
            try {
                const cachedData = localStorage.getItem(CACHE_KEY);
                if (cachedData) {
                    const { data, timestamp } = JSON.parse(cachedData);
                    const now = Date.now();
                    if (now - timestamp < CACHE_DURATION) {
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
                setTimeout(() => setLoadingConfig(false), 300);
            }
        };

        fetchQuestionsWithCache();
        setDynamicAnswers({});
    }, [formData.divisi]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDynamicAnswer = (id, value) => {
        setDynamicAnswers(prev => ({ ...prev, [id]: value }));
    };

    // --- FUNGSI BARU: KIRIM KE GOOGLE SHEETS ---
    const submitToGoogleSheets = async (finalData) => {
        try {
            // Kita pakai mode 'no-cors' karena Google Script tidak mengizinkan akses CORS standar dari browser.
            // Konsekuensinya: Kita tidak bisa membaca respons JSON 'success', tapi data tetap terkirim.
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(finalData),
            });
            console.log("✅ Data sent to Google Sheets");
        } catch (error) {
            console.error("❌ Failed sending to Sheets:", error);
            // Kita biarkan error ini silent, karena yang penting data masuk Firestore dulu.
        }
    };

    /// JIKALAU ORANGNYA GA BENER NGISI WHATSAPP
    // Helper function untuk memunculkan toast lalu hilang otomatis
    const showToast = (message, type = "error") => {
        setToast({ show: true, message, type });
        // Hilang otomatis setelah 3 detik
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (!formData.nim || !formData.nama) {
            // GANTI ALERT LAMA
            showToast("Mohon lengkapi Nama dan NIM dulu ya!", "error");
            setSubmitting(false);
            return;
        }

        // VALIDASI WHATSAPP
        if (formData.whatsapp.length < 10) {
            // GANTI ALERT LAMA
            showToast("Nomor WhatsApp kurang lengkap (min. 10 angka)", "error");
            setSubmitting(false);
            return;
        }

        try {
            const docId = formData.nim.trim();
            const docRef = doc(db, "applicants", docId);

            // Persiapan Data
            const answersDetails = dynamicQuestions.map(q => ({
                id: q.id,
                question: q.text,
                answer: dynamicAnswers[q.id] || "-"
            }));

            const finalPayload = {
                ...formData,
                nim: docId,
                answersDetails: answersDetails,
                dynamicAnswers: dynamicAnswers,
                status: "pending",
                createdAt: serverTimestamp(), // Ini untuk Firestore
                nilai: {
                    speaking: 0, teknis: 0, teamwork: 0, attitude: 0, kreativitas: 0, solving: 0
                }
            };

            // 1. KIRIM KE FIREBASE (UTAMA)
            await setDoc(docRef, finalPayload);

            // 2. KIRIM KE GOOGLE SHEETS (BACKUP)
            // Kita kirim versi payload yang aman untuk JSON (tanpa serverTimestamp object)
            // 2. KIRIM KE GOOGLE SHEETS (BACKUP)
            // Hapus 'await' agar user tidak perlu menunggu proses ini selesai
            submitToGoogleSheets({
                ...finalPayload,
                createdAt: new Date().toISOString()
            });

            setShowSuccess(true);
        } catch (error) {
            console.error("Submit Error:", error);
            if (error.code === 'permission-denied') {
                // GANTI ALERT LAMA
                showToast(`Ups! NIM ${formData.nim} sudah terdaftar.`, "error");
            } else {
                showToast("Gagal terhubung ke server. Coba lagi.", "error");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 font-sans text-slate-800 relative overflow-hidden">
            <AnimatedBackground />

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => window.location.reload()}
                title="Pendaftaran Berhasil!"
                message="Data kamu sudah masuk. Good luck!"
            />

            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -50, x: "-50%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="fixed top-6 left-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-white/90 backdrop-blur-md border border-red-100 shadow-2xl rounded-2xl"
                    >
                        <div className="bg-red-100 p-2 rounded-full text-red-500">
                            {/* Pastikan AlertCircle sudah diimport di atas */}
                            <AlertCircle size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">Periksa Lagi</span>
                            <span className="text-xs font-medium text-slate-500">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 relative z-10"
            >
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Join The Team.</h1>
                    <p className="text-slate-500">Isi formulir di bawah ini dengan jujur.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... (BAGIAN FORM INPUT SAMA PERSIS SEPERTI SEBELUMNYA) ... */}
                    {/* Copy paste saja bagian input form dari kode sebelumnya karena tidak ada perubahan di UI */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Lengkap</label>
                            <input type="text" name="nama" required value={formData.nama} onChange={handleChange} className="w-full bg-slate-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold" placeholder="Nama Lengkap" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">NIM</label>
                            <input type="text" name="nim" required value={formData.nim} onChange={handleChange} className="w-full bg-slate-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="NIM" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prodi</label>
                            <div className="relative">
                                <select name="prodi" required value={formData.prodi} onChange={handleChange} className="w-full bg-slate-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer">
                                    <option value="" disabled>-- Pilih Prodi --</option>
                                    <option value="Informatika">Informatika</option>
                                    <option value="Sistem Informasi">Sistem Informasi</option>
                                    <option value="Teknologi Informasi">Teknologi Informasi</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Angkatan</label>
                            <div className="relative">
                                <select name="angkatan" required value={formData.angkatan} onChange={handleChange} className="w-full bg-slate-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer">
                                    <option value="" disabled>-- Pilih Angkatan --</option>
                                    <option value="2023">2023</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">WhatsApp</label>
                            <input
                                type="tel"               // Ubah jadi tel
                                inputMode="numeric"      // Paksa keyboard angka
                                pattern="[0-9]*"         // Pola validasi HTML
                                name="whatsapp"
                                required
                                value={formData.whatsapp}
                                onChange={handleChange}
                                className="w-full bg-slate-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="08..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilih Divisi</label>
                            <div className="relative">
                                <select name="divisi" required value={formData.divisi} onChange={handleChange} className="w-full bg-slate-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-bold text-slate-700 cursor-pointer">
                                    <option value="" disabled>-- Pilih Divisi --</option>
                                    <option value="acara">Divisi Acara</option>
                                    <option value="humas">Divisi Humas</option>
                                    <option value="pdd">Divisi PDD</option>
                                    <option value="perkab">Divisi Perkab</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4"></div>

                    <AnimatePresence mode="wait">
                        {loadingConfig ? (
                            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-emerald-500" />
                            </motion.div>
                        ) : (
                            formData.divisi && (
                                <motion.div key="questions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    {dynamicQuestions.length === 0 ? (
                                        <p className="text-slate-400 italic text-sm text-center">Tidak ada pertanyaan khusus.</p>
                                    ) : (
                                        dynamicQuestions.map((q) => (
                                            <div key={q.id}>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">{q.text}</label>
                                                {q.type === 'longtext' ? (
                                                    <textarea required rows={3} value={dynamicAnswers[q.id] || ""} onChange={(e) => handleDynamicAnswer(q.id, e.target.value)} className="w-full bg-slate-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none" placeholder="Jawaban Anda..." />
                                                ) : q.type === 'scale' ? (
                                                    <div className="bg-slate-50 p-4 rounded-xl">
                                                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>1</span><span>10</span></div>
                                                        <input type="range" min="1" max="10" value={dynamicAnswers[q.id] || 5} onChange={(e) => handleDynamicAnswer(q.id, e.target.value)} className="w-full accent-emerald-500" />
                                                        <div className="text-center font-bold text-emerald-600 mt-1">{dynamicAnswers[q.id] || 5}</div>
                                                    </div>
                                                ) : (
                                                    <input type="text" required value={dynamicAnswers[q.id] || ""} onChange={(e) => handleDynamicAnswer(q.id, e.target.value)} className="w-full bg-slate-50 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Jawaban..." />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>

                    <button type="submit" disabled={submitting || !formData.divisi} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-xl disabled:opacity-50 mt-6">
                        {submitting ? "Mengirim..." : "Kirim Pendaftaran"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}