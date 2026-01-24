import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // IMPORT INI
import SuccessModal from "../components/SuccessModal"; // IMPORT MODAL

export default function Apply() {
    const [formData, setFormData] = useState({
        nama: "", prodi: "", whatsapp: "", divisi: "acara", motivasi: "",
    });
    const [loading, setLoading] = useState(false);

    // State untuk Modal Sukses
    const [showSuccess, setShowSuccess] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "applicants"), {
                ...formData,
                status: "pending",
                recruiterNotes: "",
                nilai: { speaking: 0, teknis: 0, teamwork: 0, attitude: 0, kreativitas: 0, solving: 0 },
                createdAt: serverTimestamp()
            });

            // Tampilkan Modal Animasi Sukses
            setShowSuccess(true);

        } catch (err) {
            console.error("Error:", err);
            alert("Gagal mengirim data."); // Error gapapa pake alert dulu
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowSuccess(false);
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-10 px-4 font-sans selection:bg-cyan-200">

            {/* Modal Component */}
            <SuccessModal
                isOpen={showSuccess}
                onClose={handleCloseModal}
                title="Lamaran Terkirim!"
                message="Data kamu sudah masuk ke sistem kami. Good luck!"
            />

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative"
            >
                <div className="h-3 w-full bg-gradient-to-r from-cyan-500 to-blue-600"></div>

                <div className="p-8 md:p-10">
                    <div className="mb-8">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                            className="text-3xl font-black text-slate-900 tracking-tight"
                        >
                            Join The Team 🚀
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                            className="text-slate-500 mt-2"
                        >
                            Lengkapi formulir di bawah ini untuk bergabung bersama kami.
                        </motion.p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Input Fields dengan sedikit animasi focus (bawaan tailwind transition sudah cukup smooth, kita main di container) */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                            <input required name="nama" onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-semibold text-slate-700 placeholder:text-slate-300" placeholder="Nama Kamu" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prodi / Angkatan</label>
                                <input required name="prodi" onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm" placeholder="Ex: IF '22" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp</label>
                                <input required name="whatsapp" type="number" onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm" placeholder="08..." />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilihan Divisi</label>
                            <div className="relative">
                                <select name="divisi" onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm appearance-none cursor-pointer text-slate-700 font-medium">
                                    <option value="acara">Divisi Acara</option>
                                    <option value="humas">Divisi Humas</option>
                                    <option value="pdd">Divisi PDD (Dokumentasi)</option>
                                    <option value="perkab">Divisi Perlengkapan</option>
                                </select>
                                <div className="absolute right-4 top-4 pointer-events-none text-slate-400 text-xs">▼</div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motivasi</label>
                            <textarea required name="motivasi" rows="4" onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm resize-none" placeholder="Ceritakan singkat kenapa kamu ingin bergabung..."></textarea>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-50 mt-4"
                        >
                            {loading ? "Mengirim..." : "Kirim Lamaran Sekarang"}
                        </motion.button>
                    </form>
                </div>
            </motion.div>

            <p className="mt-8 text-xs text-slate-400 font-medium">© 2024 Recruitment Portal</p>
        </div>
    );
}