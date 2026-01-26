// src/components/RecruitCard.jsx
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useState } from 'react';
import ScoringModal from './ScoringModal';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function RecruitCard({ dataPelamar, onUpdateSuccess }) {
  const [showModal, setShowModal] = useState(false);

  // Hitung Rata-rata Real-time
  const nilai = dataPelamar.nilai;
  const totalScore = Object.values(nilai).reduce((a, b) => a + b, 0);
  const average = Math.round(totalScore / 6);

  // --- CONFIG CHART YANG LEBIH CANTIK & INTERAKTIF ---
  const data = {
    labels: ['Speaking', 'Teknis', 'Teamwork', 'Attitude', 'Kreatif', 'Solving'],
    datasets: [
      {
        label: 'Skor Kompetensi',
        data: [
          nilai.speaking,
          nilai.teknis,
          nilai.teamwork,
          nilai.attitude,
          nilai.kreativitas,
          nilai.solving,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // Biru transparan
        borderColor: '#2563eb', // Biru solid
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#2563eb',
        pointHoverBackgroundColor: '#2563eb',
        pointHoverBorderColor: '#fff',
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(0,0,0,0.1)' },
        grid: { color: 'rgba(0,0,0,0.05)' },
        pointLabels: {
          font: { size: 10, weight: 'bold', family: 'sans-serif' },
          color: '#64748b', // Slate 500
        },
        ticks: { display: false, stepSize: 20 }, // Hilangkan angka ruwet di background
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)', // Tooltip gelap
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      }
    },
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">

        {/* Header Nama */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-gray-900 font-bold text-lg leading-tight truncate w-40">
              {dataPelamar.nama}
            </h3>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">
              {dataPelamar.prodi}
            </p>
          </div>
          {/* Badge Status */}
          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${dataPelamar.status === 'reviewed'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
            }`}>
            {dataPelamar.status === 'reviewed' ? 'Dinilai' : 'Pending'}
          </span>
        </div>

        {/* --- AREA CHART DENGAN ANGKA DI TENGAH (FIXED) --- */}
        <div className="relative h-56 w-full my-2">
          {/* Chart */}
          <Radar data={data} options={options} />

          {/* Angka Tengah Absolut - Pasti Center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm w-12 h-12 rounded-full shadow-sm border border-slate-100">
              <span className="text-sm font-black text-slate-800">{average}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
          <a
            href={`https://wa.me/${dataPelamar.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center"
          >
            WhatsApp
          </a>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 bg-slate-900 hover:bg-blue-600 text-white py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-slate-200"
          >
            Beri Nilai
          </button>
        </div>
      </div>

      {/* Panggil Modal */}
      {showModal && (
        <ScoringModal
          pelamar={dataPelamar}
          onClose={() => setShowModal(false)}
          onSuccess={onUpdateSuccess} // Fungsi update tanpa refresh
        />
      )}
    </>
  );
}