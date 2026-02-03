import { Lock, Wrench } from "lucide-react";
import { motion } from "framer-motion";

export default function FeatureGuard({ isActive, children }) {
    // Jika saklar ON, tampilkan isinya (Form Builder)
    if (isActive) {
        return children;
    }

    // Jika saklar OFF, tampilkan Gembok
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-100 p-8 rounded-3xl border border-slate-200 max-w-md w-full shadow-lg"
            >
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                    <Lock size={32} />
                </div>

                <h2 className="text-2xl font-black text-slate-800 mb-2">Fitur Terkunci</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Demi keamanan data, fitur Form Builder saat ini dinonaktifkan dari sistem pusat.
                </p>

                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 text-left">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Solusi</p>
                        <p className="text-sm font-bold text-slate-700">Hubungi Developer untuk membuka akses hardcode.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}