import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SuccessModal from "../components/SuccessModal";
import AnimatedBackground from "../components/AnimatedBackground";
import { Loader2 } from "lucide-react";

export default function Apply() {
    // 1. Data Statis (Wajib)
    const [formData, setFormData] = useState({
        nama: "",
        prodi: "",
        angkatan: "", // Field baru sesuai request
        whatsapp: "",
        divisi: "", // Default kosong biar user pilih dulu
    });

    // 2. Data Dinamis (Sesuai Form Builder)
    const [dynamicQuestions, setDynamicQuestions] = useState([]);
    const [dynamicAnswers, setDynamicAnswers] = useState({}); // Menyimpan jawaban custom

    const [loadingConfig, setLoadingConfig] = useState(false); // Loading saat ganti divisi
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();

    // EFFECT: Fetch Pertanyaan saat Divisi Berubah
    useEffect(() => {
        if (!formData.divisi) {
            setDynamicQuestions([]);
            return;
        }

        const fetchQuestions = async () => {
            setLoadingConfig(true);
            try {
                // Ambil config dari collection 'formConfigs' doc ID sesuai divisi
                const docRef = doc(db, "formConfigs", formData.divisi);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setDynamicQuestions(docSnap.data().questions || []);
                } else {
                    setDynamicQuestions([]); // Divisi ini belum di-setting admin
                }
            } catch (e) {
                console.error("Gagal load pertanyaan", e);
            } finally {
                // Delay aesthetic biar transisinya kerasa
                setTimeout(() => setLoadingConfig(false), 600);
            }
        };

        fetchQuestions();

        // Reset jawaban dinamis saat ganti divisi
        setDynamicAnswers({});
    }, [formData.divisi]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDynamicAnswer = (id, value) => {
        setDynamicAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await addDoc(collection(db, "applicants"), {
                ...formData,

                // --- PERBAIKAN DISINI ---
                // Simpan dengan nama key 'dynamicAnswers' agar dashboard bisa baca
                dynamicAnswers: dynamicAnswers,
                // ------------------------

                status: "pending",
                createdAt: serverTimestamp(), // Ganti timestamp jadi createdAt biar konsisten sama sorting dashboard
                nilai: {
                    speaking: 0, teknis: 0, teamwork: 0, attitude: 0, kreativitas: 0, solving: 0
                }
            });
            setShowSuccess(true);
        } catch (error) {
            console.error("Error submitting document: ", error);
            alert("Terjadi kesalahan. Coba lagi.");
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 font-sans text-slate-800 relative overflow-hidden">
            <AnimatedBackground />

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => window.location.reload()} // Ganti navigate("/") jadi reload biar bersih total
                title="Pendaftaran Berhasil!"
                message="Data kamu sudah masuk ke sistem kami. Good luck!"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 relative z-10"
            >
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Join The Team.</h1>
                    <p className="text-slate-500">Isi formulir di bawah ini dengan jujur dan teliti.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* BAGIAN 1: IDENTITAS UMUM (FIXED) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                            <input
                                type="text" name="nama" required
                                value={formData.nama} onChange={handleChange}
                                className="w-full bg-slate-50 border-0 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300 font-semibold"
                                placeholder="Cth. Budi Santoso"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Program Studi</label>
                            <input
                                type="text" name="prodi" required
                                value={formData.prodi} onChange={handleChange}
                                className="w-full bg-slate-50 border-0 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                placeholder="Informatika"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Angkatan</label>
                            <input
                                type="number" name="angkatan" required
                                value={formData.angkatan} onChange={handleChange}
                                className="w-full bg-slate-50 border-0 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                placeholder="2023"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp</label>
                            <input
                                type="text" name="whatsapp" required
                                value={formData.whatsapp} onChange={handleChange}
                                className="w-full bg-slate-50 border-0 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                placeholder="0812..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Divisi</label>
                            <div className="relative">
                                <select
                                    name="divisi" required
                                    value={formData.divisi} onChange={handleChange}
                                    className="w-full bg-slate-50 border-0 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none font-bold text-slate-700 cursor-pointer"
                                >
                                    <option value="" disabled>-- Pilih Divisi --</option>
                                    <option value="acara">Divisi Acara</option>
                                    <option value="humas">Divisi Humas</option>
                                    <option value="pdd">Divisi PDD</option>
                                    <option value="perkab">Divisi Perkab</option>
                                </select>
                                <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4"></div>

                    {/* BAGIAN 2: PERTANYAAN KHUSUS (DYNAMIC) */}
                    <AnimatePresence mode="wait">
                        {loadingConfig ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col items-center justify-center py-10"
                            >
                                <Loader2 className="animate-spin text-emerald-500 mb-2" size={24} />
                                <span className="text-xs font-medium text-slate-400">Memuat formulir divisi...</span>
                            </motion.div>
                        ) : (
                            formData.divisi && (
                                <motion.div
                                    key="questions"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                                        <h3 className="font-bold text-slate-700">Pertanyaan Khusus {formData.divisi.toUpperCase()}</h3>
                                    </div>

                                    {dynamicQuestions.length === 0 ? (
                                        <p className="text-slate-400 italic text-sm">Tidak ada pertanyaan khusus untuk divisi ini.</p>
                                    ) : (
                                        dynamicQuestions.map((q) => (
                                            <div key={q.id} className="group">
                                                <label className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-emerald-700 transition-colors">
                                                    {q.text}
                                                </label>

                                                {q.type === 'scale' ? (
                                                    <div className="bg-slate-50 p-4 rounded-xl">
                                                        <div className="flex justify-between text-xs text-slate-400 font-bold mb-2 uppercase">
                                                            <span>Tidak Yakin</span>
                                                            <span>Sangat Yakin</span>
                                                        </div>
                                                        <input
                                                            type="range" min="1" max="10" step="1"
                                                            value={dynamicAnswers[q.id] || 5}
                                                            onChange={(e) => handleDynamicAnswer(q.id, e.target.value)}
                                                            className="w-full h-2 bg-slate-200 rounded-lg accent-emerald-600 cursor-pointer"
                                                        />
                                                        <div className="text-center font-black text-emerald-600 mt-2 text-lg">
                                                            {dynamicAnswers[q.id] || 5}/10
                                                        </div>
                                                    </div>
                                                ) : q.type === 'longtext' ? (
                                                    <textarea
                                                        required
                                                        rows={4}
                                                        value={dynamicAnswers[q.id] || ""}
                                                        onChange={(e) => handleDynamicAnswer(q.id, e.target.value)}
                                                        className="w-full bg-slate-50 border-0 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300 resize-none"
                                                        placeholder="Jelaskan jawabanmu..."
                                                    />
                                                ) : (
                                                    <input
                                                        type="text" required
                                                        value={dynamicAnswers[q.id] || ""}
                                                        onChange={(e) => handleDynamicAnswer(q.id, e.target.value)}
                                                        className="w-full bg-slate-50 border-0 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                                        placeholder="Jawaban singkat..."
                                                    />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>

                    {/* SUBMIT BUTTON */}
                    <motion.button
                        type="submit"
                        disabled={submitting || !formData.divisi}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed mt-8 transition-colors"
                    >
                        {submitting ? "Mengirim Data..." : "Kirim Pendaftaran"}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}