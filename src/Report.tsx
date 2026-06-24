import React from 'react';
import { type SurveyResponse } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowLeft } from 'lucide-react';

interface ReportProps {
  responses: SurveyResponse[];
  onBack: () => void;
}

const COLORS = ['#6366f1', '#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];

export default function Report({ responses, onBack }: ReportProps) {
  const total = responses.length;

  if (total === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-slate-500 mb-4">No hay datos suficientes para generar un informe.</p>
        <button onClick={onBack} className="btn-primary">Volver</button>
      </div>
    );
  }

  // Helpers for stats
  const countAnswers = (field: keyof SurveyResponse) => {
    const counts: Record<string, number> = {};
    responses.forEach(r => {
      const val = r[field] as string;
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const bornStats = countAnswers('bornInArgentina');
  const familyStats = countAnswers('familyMigrated');
  const difficultyStats = countAnswers('difficultiesLivingAbroad');
  const stateStats = countAnswers('stateMeasures');
  const visibilityStats = countAnswers('needVisibility');

  const StatCard = ({ title, data }: { title: string, data: { name: string, value: number }[] }) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
        <h3 className="text-base font-semibold text-slate-800 mb-4 text-center">{title}</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={true}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} encuestas (${((value/total)*100).toFixed(1)}%)`, 'Cantidad']}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 relative bg-slate-50">
      <header className="bg-white/60 backdrop-blur-xl border-b border-white/80 py-4 px-4 sticky top-0 z-50 shadow-sm flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold font-sans text-slate-800">Informe Estadístico</h1>
        <div className="ml-auto bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold">
          Total encuestas: {total}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="¿Naciste en Argentina?" data={bornStats} />
          <StatCard title="Familiares/Conocidos migrados" data={familyStats} />
          <StatCard title="Dificultades en Argentina" data={difficultyStats} />
          <StatCard title="Medidas del estado" data={stateStats} />
          <StatCard title="Visibilidad de migración" data={visibilityStats} />
        </div>
      </main>
    </div>
  );
}
