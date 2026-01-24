// src/pages/Apply.jsx
import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Apply() {
    const [formData, setFormData] = useState({
        nama: "",
        prodi: "",
        whatsapp: "",
        divisi: "acara", // Default pilihan
        motivasi: "",
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simpan ke Firestore collection 'applicants'
            await addDoc(collection(db, "applicants"), {
                ...formData,
                status: "pending", // Status awal
                nilai: { // Nilai default 0 sebelum dinilai admin
                    speaking: 0,
                    teknis: 0,
                    teamwork: 0,
                    attitude: 0,
                    kreativitas: 0,
                    solving: 0
                },
                createdAt: serverTimestamp()
            });

            alert("Pendaftaran Berhasil! Data kamu sudah masuk.");
            // Reset form atau arahkan ke halaman thanks (di sini kita reload aja)
            window.location.reload();

        } catch (error) {
            console.error("Error:", error);
            alert("Gagal mengirim data. Coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-center text-white">
                    <h1 className="text-3xl font-bold">Open Recruitment</h1>
                    <p className="opacity-90 mt-1">Silahkan isi data diri dengan jujur.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                            <input required name="nama" onChange={handleChange} type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Ahmad Fauzi" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
                            <input required name="prodi" onChange={handleChange} type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Informatika" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                            <input required name="whatsapp" onChange={handleChange} type="number" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0812xxxx" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pilihan Divisi</label>
                            <select name="divisi" onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                <option value="acara">Divisi Acara</option>
                                <option value="humas">Divisi Humas</option>
                                <option value="pdd">Divisi PDD</option>
                                <option value="perkab">Divisi Perkab</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivasi Bergabung (Singkat)</label>
                        <textarea required name="motivasi" onChange={handleChange} rows="4" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Jelaskan kenapa kami harus memilih kamu..."></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition transform hover:-translate-y-1 ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? "Sedang Mengirim..." : "Kirim Lamaran"}
                    </button>
                </form>
            </div>
        </div>
    );
}