import { motion } from "framer-motion";

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F8FAFC]">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
            >
                {/* Logo Animasi */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-2xl mb-8"
                >
                    <span className="text-4xl font-black text-white">L</span>
                </motion.div>

                {/* Loading Bar */}
                <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full bg-emerald-500 rounded-full"
                    />
                </div>
                <p className="mt-4 text-xs font-bold text-slate-400 tracking-[0.2em] uppercase">Memuat Sistem...</p>
            </motion.div>
        </div>
    );
}