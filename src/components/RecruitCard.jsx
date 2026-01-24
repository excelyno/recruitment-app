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
import { useState } from 'react'; // Import useState
import ScoringModal from './ScoringModal'; // Import Modal

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function RecruitCard({ dataPelamar }) {
  const [showModal, setShowModal] = useState(false); // State untuk buka/tutup modal

  // --- CONFIG CHART (Sama seperti sebelumnya) ---
  const data = {
    labels: ['Public Speaking', 'Teknis', 'Teamwork', 'Attitude', 'Kreativitas', 'Prob. Solving'],
    datasets: [
      {
        label: 'Skor',
        data: [
          dataPelamar.nilai.speaking,
          dataPelamar.nilai.teknis,
          dataPelamar.nilai.teamwork,
          dataPelamar.nilai.attitude,
          dataPelamar.nilai.kreativitas,
          dataPelamar.nilai.solving,
        ],
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: { color: '#e5e7eb' },
        grid: { color: '#e5e7eb' },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { display: false, stepSize: 20 },
        pointLabels: { font: { size: 10, weight: 'bold' }, color: '#4b5563' }
      },
    },
    plugins: { legend: { display: false } }
  };

  // Hitung OVR
  const nilaiValues = Object.values(dataPelamar.nilai);
  const average = Math.round(nilaiValues.reduce((a, b) => a + b, 0) / nilaiValues.length);

  // Logic Warna Kartu
  let cardColor = "bg-white border-gray-100";
  let badgeColor = "bg-gray-100 text-gray-600";

  if (average >= 85) {
    cardColor = "bg-yellow-50 border-yellow-200 ring-1 ring-yellow-300";
    badgeColor = "bg-yellow-500 text-white shadow-yellow-500/50";
  } else if (average >= 70) {
    cardColor = "bg-slate-50 border-slate-300";
    badgeColor = "bg-slate-600 text-white";
  }

  return (
    <>
      <div className={`relative rounded-2xl shadow-sm hover:shadow-xl border p-6 ${cardColor} transition-all duration-300`}>
        {/* Badge OVR */}
        <div className={`absolute top-4 right-4 ${badgeColor} w-10 h-10 flex items-center justify-center rounded-full font-black text-lg shadow-md z-10`}>
          {average}
        </div>

        {/* Header */}
        <div className="mb-2 pr-10">
          <h3 className="text-lg font-bold text-gray-800 truncate">{dataPelamar.nama}</h3>
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{dataPelamar.prodi}</p>
        </div>

        {/* Chart Area */}
        <div className="h-56 w-full flex items-center justify-center mb-4 relative">
          <Radar data={data} options={options} />
        </div>

        {/* Detail & Action */}
        <div className="border-t pt-4 border-gray-200/50">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
            <span>WhatsApp:</span>
            <span className="font-medium text-gray-800">{dataPelamar.whatsapp}</span>
          </div>

          <button
            onClick={() => setShowModal(true)} // Buka Modal
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-blue-500/30 shadow-lg transition transform active:scale-95"
          >
            {average === 0 ? "Beri Penilaian" : "Edit Nilai"}
          </button>
        </div>
      </div>

      {/* RENDER MODAL JIKA STATE TRUE */}
      {showModal && (
        <ScoringModal
          pelamar={dataPelamar}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}