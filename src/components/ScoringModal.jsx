// src/components/ScoringModal.jsx
import { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function ScoringModal({ pelamar, onClose }) {
    const [scores, setScores] = useState(pelamar.nilai); // Ambil nilai awal dari database
    const [loading, setLoading] = useState(false);

    // Handle perubahan slider
    const handleChange = (e) => {
        setScores({
            ...scores,
            [e.target.name]: parseInt(e.target.value)
        });
    };

    // Handle Simpan ke Firebase
    const handleSave = async () => {
        setLoading(true);
        try {
            const pelamarRef = doc(db, "applicants", pelamar.id);

            await updateDoc(pelamarRef, {
                nilai: scores,
                status: "reviewed" // Tandai sudah dinilai
            });

            alert("Nilai berhasil disimpan!");
            onClose(); // Tutup modal
            window.location.reload(); // Refresh biar grafik berubah (cara cepat)

        } catch (error) {
            console.error("Error updating score:", error);
            alert("Gagal menyimpan nilai.");
        } finally {
            setLoading(false);
        }
    };

    // List kriteria penilaian agar kodingan rapi
    const criteria = [
        { key: "speaking", label: "Public Speaking" },
        { key: "teknis", label: "Skill Teknis" },
        { key: "teamwork", label: "Kerjasama Tim" },
        { key: "attitude", label: "Attitude / Sikap" },
        { key: "kreativitas", label: "Kreativitas" },
        { key: "solving", label: "Problem Solving" },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

                {/* Header Modal */}
                <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Penilaian Kandidat</h2>
                        <p className="text-sm text-gray-500">Menilai: <span className="font-bold text-blue-600">{pelamar.nama}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-2xl">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Review Motivasi */}
                    <div className="bg-gray-50 p-4 rounded-xl border">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Motivasi Pelamar</h3>
                        <p className="text-gray-800 italic">"{pelamar.motivasi}"</p>
                    </div>

                    {/* Form Input Nilai (Slider) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {criteria.map((item) => (
                            <div key={item.key}>
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm font-semibold text-gray-700">{item.label}</label>
                                    <span className={`text-sm font-bold ${scores[item.key] > 80 ? 'text-green-600' : 'text-blue-600'}`}>
                                        {scores[item.key]}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    name={item.key}
                                    min="0"
                                    max="100"
                                    value={scores[item.key]}
                                    onChange={handleChange}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg flex items-center"
                    >
                        {loading ? "Menyimpan..." : "Simpan Penilaian"}
                    </button>
                </div>

            </div>
        </div>
    );
}