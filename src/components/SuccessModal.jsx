import { motion, AnimatePresence } from "framer-motion";

export default function SuccessModal({ isOpen, onClose, title, message }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
                    {/* Backdrop Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: 50 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative z-10 text-center border border-slate-100"
                    >
                        {/* Animated Checkmark Circle */}
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                            <svg
                                className="w-10 h-10 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                            >
                                <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
                        <p className="text-slate-500 text-sm mb-6">{message}</p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition"
                        >
                            Mantap!
                        </motion.button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}