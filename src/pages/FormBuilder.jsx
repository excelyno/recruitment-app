import { useState, useEffect } from "react";
import { useApplicants } from "../context/ApplicantContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Trash2, Save, Layers, Loader2,
    CheckCircle, AlertCircle, X, Lock
} from "lucide-react";
// 1. IMPORT PENJAGA
import FeatureGuard from "../components/FeatureGuard";

// ==========================================
// 🚨 SAKLAR UTAMA (HARDCODE) 🚨
// Ganti ke 'true' jika Anda ingin mengedit form.
// Kembalikan ke 'false' setelah selesai agar aman.
// ==========================================
const ENABLE_FORM_BUILDER = false;


// 2. KOMPONEN UTAMA (HANYA SEBAGAI PINTU GERBANG)
export default function FormBuilder() {
    return (
        <FeatureGuard isActive={ENABLE_FORM_BUILDER}>
            <FormBuilderContent />
        </FeatureGuard>
    );
}

// 3. LOGIKA ASLI FORM BUILDER (DIPINDAHKAN KE SINI)
function FormBuilderContent() {
    // --- AMBIL PROFIL ADMIN & FUNGSI DARI CONTEXT ---
    const {
        getDivisionQuestions,
        saveFormConfig,
        adminProfile,
        adminLoading
    } = useApplicants();

    const [selectedDivision, setSelectedDivision] = useState("acara");
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // State Toast
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Helper Toast
    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // --- SET DIVISI OTOMATIS BERDASARKAN ROLE ---
    useEffect(() => {
        if (!adminLoading && adminProfile?.role) {
            if (adminProfile.role !== 'superadmin') {
                setSelectedDivision(adminProfile.division);
            }
        }
    }, [adminProfile, adminLoading]);

    // --- FETCH PERTANYAAN ---
    useEffect(() => {
        if (adminLoading) return;

        let isMounted = true;
        const fetchConfig = async () => {
            setLoading(true);
            setQuestions([]);
            try {
                const data = await getDivisionQuestions(selectedDivision);
                if (isMounted) setQuestions(data || []);
            } catch (e) {
                console.error("Error fetching config:", e);
                showToast("Gagal memuat pertanyaan.", "error");
            } finally {
                if (isMounted) setTimeout(() => setLoading(false), 300);
            }
        };

        if (selectedDivision) {
            fetchConfig();
        }

        return () => { isMounted = false; };
    }, [selectedDivision, getDivisionQuestions, adminLoading]);

    // --- SIMPAN CONFIG ---
    const handleSave = async () => {
        setSaving(true);
        try {
            await saveFormConfig(selectedDivision, questions);
            showToast("Berhasil menyimpan perubahan!", "success");
        } catch (e) {
            console.error(e);
            showToast("Gagal menyimpan. Cek koneksi.", "error");
        } finally {
            setSaving(false);
        }
    };

    // --- HELPER FUNCTIONS ---
    const addQuestion = () => {
        const newId = crypto.randomUUID();
        setQuestions([...questions, { id: newId, text: "", type: "text" }]);
    };

    const deleteQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id, field, value) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    // --- RENDER LOADING AWAL ---
    if (adminLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 relative">

            {/* --- TOAST NOTIFICATION --- */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: 20 }}
                        className={`fixed top-24 right-8 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${toast.type === 'success'
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50/90 border-rose-200 text-rose-800'
                            }`}
                    >
                        {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">
                                {toast.type === 'success' ? 'Sukses' : 'Error'}
                            </span>
                            <span className="text-xs font-medium opacity-80">{toast.message}</span>
                        </div>
                        <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:bg-black/5 p-1 rounded-full">
                            <X size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- HEADER & SELECTOR --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Form Builder</h1>
                    <p className="text-slate-500">Sesuaikan pertanyaan khusus untuk setiap divisi.</p>
                </div>

                <div className={`p-2 rounded-xl border shadow-sm flex items-center gap-3 transition-colors ${adminProfile.role !== 'superadmin' ? 'bg-slate-100 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200'
                    }`}>
                    <div className={`p-2 rounded-lg ${adminProfile.role !== 'superadmin' ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                        {adminProfile.role !== 'superadmin' ? <Lock size={20} /> : <Layers size={20} />}
                    </div>

                    {adminProfile.role === 'superadmin' ? (
                        <select
                            value={selectedDivision}
                            onChange={(e) => setSelectedDivision(e.target.value)}
                            className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer pr-4"
                        >
                            <option value="acara">Divisi Acara</option>
                            <option value="humas">Divisi Humas</option>
                            <option value="pdd">Divisi PDD</option>
                            <option value="perkab">Divisi Perkab</option>
                        </select>
                    ) : (
                        <div className="font-bold text-slate-500 pr-4 uppercase tracking-wider text-sm">
                            Divisi {selectedDivision}
                        </div>
                    )}
                </div>
            </div>

            {/* --- STATIC FIELDS INFO --- */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 border-dashed">
                <div className="flex items-center gap-2 mb-4">
                    <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">Default Fields</span>
                    <span className="text-xs text-slate-400">(Wajib ada)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-60">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 cursor-not-allowed">Nama Lengkap</div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 cursor-not-allowed">Program Studi</div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 cursor-not-allowed">Angkatan</div>
                </div>
            </div>

            <div className="border-t border-slate-200 my-6"></div>

            {/* --- DYNAMIC QUESTIONS AREA --- */}
            <div className="space-y-4 min-h-[300px]">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-700">
                        Pertanyaan: <span className="text-emerald-600 capitalize">{selectedDivision}</span>
                    </h3>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                        <span className="text-slate-400 text-sm font-medium">Memuat data...</span>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {questions.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm"
                            >
                                <p className="text-slate-400 mb-4 font-medium">Belum ada pertanyaan.</p>
                                <button onClick={addQuestion} className="text-emerald-600 font-bold text-sm hover:underline">
                                    + Buat Pertanyaan Pertama
                                </button>
                            </motion.div>
                        )}

                        {questions.map((q, index) => (
                            <motion.div
                                layout
                                key={q.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-emerald-200"
                            >
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pertanyaan #{index + 1}</span>
                                            <select
                                                value={q.type}
                                                onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
                                                className="text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-slate-100 transition"
                                            >
                                                <option value="text">Jawaban Singkat</option>
                                                <option value="longtext">Esai Panjang</option>
                                                <option value="scale">Skala 1-10</option>
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                                            className="w-full text-lg font-bold text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 p-0 bg-transparent transition"
                                            placeholder="Tulis pertanyaan di sini..."
                                        />
                                    </div>
                                    <button
                                        onClick={() => deleteQuestion(q.id)}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                        title="Hapus"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {!loading && (
                    <motion.button
                        layout
                        onClick={addQuestion}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 transition flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Tambah Pertanyaan
                    </motion.button>
                )}
            </div>

            {/* --- FLOATING SAVE BUTTON --- */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: questions.length > 0 ? 0 : 100 }}
                className="fixed bottom-8 right-8 z-40"
            >
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-900 text-white pl-6 pr-8 py-4 rounded-full font-bold shadow-2xl hover:bg-emerald-600 transition-colors flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
            </motion.div>
        </div>
    );
}