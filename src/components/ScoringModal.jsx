// src/components/ScoringModal.jsx
import { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function ScoringModal({ pelamar, onClose, onSuccess }) {
    const initialScores = pelamar.nilai || {
        speaking: 0, teknis: 0, teamwork: 0, attitude: 0, kreativitas: 0, solving: 0
    };

    const [scores, setScores] = useState(initialScores);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setScores(prev => ({
            ...prev,
            [name]: parseInt(value) || 0
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const pelamarRef = doc(db, "applicants", pelamar.id);
            const updatedData = {
                nilai: scores,
                status: "reviewed"
            };
            await updateDoc(pelamarRef, updatedData);
            if (onSuccess) onSuccess(pelamar.id, updatedData);
            onClose();
        } catch (error) {
            console.error("Error saving score:", error);
            alert("Failed to save: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const criteria = [
        { key: "speaking", label: "Public Speaking" },
        { key: "teknis", label: "Technical Skills" },
        { key: "teamwork", label: "Teamwork" },
        { key: "attitude", label: "Attitude" },
        { key: "kreativitas", label: "Creativity" },
        { key: "solving", label: "Problem Solving" }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl relative z-10 border border-white/50 overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100/50 flex justify-between items-center bg-white/40">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Score Candidate</h2>
                        <p className="text-xs text-slate-500">{pelamar.nama}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition border border-slate-200/50 text-slate-400">×</button>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {criteria.map((item) => (
                        <div key={item.key} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.label}</label>
                                <span className="text-xs font-bold text-sage-600 bg-sage-50 px-2 py-0.5 rounded-md border border-sage-100">
                                    {scores[item.key]}
                                </span>
                            </div>
                            <input
                                type="range"
                                name={item.key}
                                min="0" max="100"
                                value={scores[item.key]}
                                onChange={handleChange}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sage-600"
                            />
                        </div>
                    ))}
                </div>

                <div className="p-5 border-t border-slate-100/50 bg-white/40 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100/50 rounded-xl transition text-xs">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="flex-1 py-3 bg-sage-600 text-white font-bold rounded-xl hover:bg-sage-700 transition shadow-lg shadow-sage-200 disabled:opacity-50 text-xs">
                        {loading ? "Saving..." : "Save Scores"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}