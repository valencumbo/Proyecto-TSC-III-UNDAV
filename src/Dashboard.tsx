import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { type SurveyResponse } from './types';
import { format } from 'date-fns';
import { ArrowLeft, Download, ChevronDown, ChevronUp, MessageSquare, Lock, BarChart3, Info } from 'lucide-react';
import Report from './Report';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard({ onBack }: { onBack: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showReport, setShowReport] = useState(false);

  const [responses, setResponses] = useState<(SurveyResponse & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'tsc3' && password === 'refugiados') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Usuario o contraseña incorrectos');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'responses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (SurveyResponse & { id: string })[];
        setResponses(data);
        setLoading(false);
      },
      error: (error) => {
        console.error("Error fetching responses:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const downloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Resultados de Encuestas a Migrantes', 15, 18);
    
    // Subtitle & Meta Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    const today = format(new Date(), 'dd/MM/yyyy HH:mm');
    doc.text(`Total de encuestas registradas: ${responses.length}  |  Fecha de generación: ${today}`, 15, 24);
    
    // Separator line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(15, 28, 195, 28);

    // Build detailed layout for each survey
    const data = responses.map((r, index) => {
      const fecha = r.createdAt && typeof r.createdAt.toDate === 'function' 
        ? format(r.createdAt.toDate(), 'dd/MM/yyyy HH:mm') 
        : '-';
      
      const infoBasica = `Encuesta #${index + 1}\n\n` +
                         `• Entrevistado:\n  ${r.intervieweeName || 'Anónimo'}\n\n` +
                         `• Fecha/Hora:\n  ${fecha}\n\n` +
                         `• Encuestador:\n  ${r.interviewerName || '-'}`;

      let cuestionarioDetalle = '';
      
      // 1. Origen
      cuestionarioDetalle += `1. ¿Naciste en Argentina?: ${r.bornInArgentina}`;
      if (r.bornInArgentina === 'No' && r.countryOfOrigin) {
        cuestionarioDetalle += ` (De: ${r.countryOfOrigin})`;
      }
      if (r.bornInArgentinaExtra) {
        cuestionarioDetalle += `\n   ↳ Comentario: "${r.bornInArgentinaExtra.trim()}"`;
      }
      cuestionarioDetalle += `\n\n`;

      // 2. Familiares Migrantes
      cuestionarioDetalle += `2. ¿Tenés familiares o conocidos migrantes?: ${r.familyMigrated}`;
      if (r.familyMigratedExtra) {
        cuestionarioDetalle += `\n   ↳ Comentario: "${r.familyMigratedExtra.trim()}"`;
      }
      cuestionarioDetalle += `\n\n`;

      // 3. Dificultades
      cuestionarioDetalle += `3. ¿Hay dificultades para los migrantes en Argentina?: ${r.difficultiesLivingAbroad}`;
      if (r.difficultiesLivingAbroadExtra) {
        cuestionarioDetalle += `\n   ↳ Comentario: "${r.difficultiesLivingAbroadExtra.trim()}"`;
      }
      cuestionarioDetalle += `\n\n`;

      // 4. Medidas del Estado
      cuestionarioDetalle += `4. ¿El estado realiza suficientes medidas?: ${r.stateMeasures}`;
      if (r.stateMeasuresExtra) {
        cuestionarioDetalle += `\n   ↳ Comentario: "${r.stateMeasuresExtra.trim()}"`;
      }
      cuestionarioDetalle += `\n\n`;

      // 5. Visibilidad
      cuestionarioDetalle += `5. ¿Es necesario dar visibilidad a estas experiencias?: ${r.needVisibility}`;
      if (r.needVisibilityExtra) {
        cuestionarioDetalle += `\n   ↳ Comentario: "${r.needVisibilityExtra.trim()}"`;
      }

      return [infoBasica, cuestionarioDetalle];
    });

    autoTable(doc, {
      head: [['Datos de la Encuesta', 'Respuestas y Comentarios Detallados']],
      body: data,
      startY: 34,
      styles: { 
        fontSize: 8.5, 
        cellPadding: 5, 
        valign: 'top', 
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [79, 70, 229], // indigo-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9.5
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 135 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      },
      margin: { top: 25, bottom: 20, left: 15, right: 15 },
      didDrawPage: (data) => {
        // Add footer with page numbering
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `Página ${data.pageNumber}`,
          195,
          285,
          { align: 'right' }
        );
      }
    });

    doc.save('encuestas_migrantes.pdf');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-sans text-slate-800 text-center">Acceso a Resultados</h2>
            <p className="text-sm text-slate-500 mt-2 text-center">Ingrese sus credenciales para ver el panel de encuestas.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm text-center font-medium">
                {loginError}
              </div>
            )}
            <div>
              <label className="form-label text-sm text-slate-700">Usuario</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario"
              />
            </div>
            <div>
              <label className="form-label text-sm text-slate-700">Contraseña</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
              />
            </div>
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-2xl font-semibold text-[15px] hover:bg-slate-200 transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-2xl font-semibold text-[15px] hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]"
              >
                Ingresar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showReport) {
    return <Report responses={responses} onBack={() => setShowReport(false)} />;
  }

  return (
    <div className="min-h-screen pb-20 relative bg-slate-50">
      <header className="bg-white/60 backdrop-blur-xl border-b border-white/80 py-4 px-4 sticky top-0 z-50 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold font-sans text-slate-800">Panel de Resultados</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowReport(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Generar Informe</span>
          </button>
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4">
          {responses.map((response) => (
            <div key={response.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleRow(response.id)}
              >
                <div>
                  <div className="font-semibold text-slate-800 text-sm mb-1">{response.intervieweeName || 'Anónimo'}</div>
                  <div className="text-xs text-slate-500">
                    {response.createdAt && typeof response.createdAt.toDate === 'function' ? format(response.createdAt.toDate(), 'dd/MM/yy HH:mm') : '-'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${response.bornInArgentina === 'Sí' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {response.bornInArgentina === 'Sí' ? 'Arg' : (response.countryOfOrigin || 'Extranjero')}
                  </span>
                  {expandedRows.has(response.id) ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
              
              {expandedRows.has(response.id) && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <h5 className="font-semibold text-slate-800 mb-2 text-sm">1. Origen y Nacionalidad</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 w-1/3">¿Naciste en Argentina?</span>
                        <span className="font-medium text-slate-800 w-2/3">{response.bornInArgentina}</span>
                      </div>
                      {response.bornInArgentina === 'No' && (
                        <div className="flex justify-between items-start">
                          <span className="text-slate-500 w-1/3">¿De dónde sos?</span>
                          <span className="font-medium text-slate-800 w-2/3 break-words">{response.countryOfOrigin || '-'}</span>
                        </div>
                      )}
                      {response.bornInArgentinaExtra && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap break-words mt-2">
                          <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Extra</span>
                          {response.bornInArgentinaExtra}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <h5 className="font-semibold text-slate-800 mb-2 text-sm">2. Familiares Migrantes</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 w-1/3">¿Tenés familiares migrantes?</span>
                        <span className="font-medium text-slate-800 w-2/3">{response.familyMigrated}</span>
                      </div>
                      {response.familyMigratedExtra && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap break-words mt-2">
                          <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Extra</span>
                          {response.familyMigratedExtra}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <h5 className="font-semibold text-slate-800 mb-2 text-sm">3. Dificultades</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 w-1/3">¿Dificultades en Arg?</span>
                        <span className="font-medium text-slate-800 w-2/3">{response.difficultiesLivingAbroad}</span>
                      </div>
                      {response.difficultiesLivingAbroadExtra && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap break-words mt-2">
                          <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Extra</span>
                          {response.difficultiesLivingAbroadExtra}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <h5 className="font-semibold text-slate-800 mb-2 text-sm">4. Medidas del Estado</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 w-1/3">¿Medidas suficientes?</span>
                        <span className="font-medium text-slate-800 w-2/3">{response.stateMeasures}</span>
                      </div>
                      {response.stateMeasuresExtra && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap break-words mt-2">
                          <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Extra</span>
                          {response.stateMeasuresExtra}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <h5 className="font-semibold text-slate-800 mb-2 text-sm">5. Visibilidad</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 w-1/3">¿Son necesarias?</span>
                        <span className="font-medium text-slate-800 w-2/3">{response.needVisibility}</span>
                      </div>
                      {response.needVisibilityExtra && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap break-words mt-2">
                          <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Extra</span>
                          {response.needVisibilityExtra}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {responses.length === 0 && (
            <div className="text-center p-8 text-slate-500 bg-white rounded-2xl border border-slate-200">
              Aún no hay encuestas registradas.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 w-10"></th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Entrevistado</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Nacido en Arg</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Origen</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Flia. Migrante</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Dificultades</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Apoyo Estado</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Visibilidad</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Encuestador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((response) => (
                  <React.Fragment key={response.id}>
                    <tr 
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${expandedRows.has(response.id) ? 'bg-slate-50' : ''}`}
                      onClick={() => toggleRow(response.id)}
                    >
                      <td className="p-4">
                        {expandedRows.has(response.id) ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                        {response.createdAt && typeof response.createdAt.toDate === 'function' ? format(response.createdAt.toDate(), 'dd/MM/yy HH:mm') : '-'}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-800">
                        {response.intervieweeName || '-'}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${response.bornInArgentina === 'Sí' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {response.bornInArgentina}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {response.countryOfOrigin || '-'}
                      </td>
                      <td className="p-4 text-sm text-slate-600">{response.familyMigrated}</td>
                      <td className="p-4 text-sm text-slate-600">{response.difficultiesLivingAbroad}</td>
                      <td className="p-4 text-sm text-slate-600">{response.stateMeasures}</td>
                      <td className="p-4 text-sm text-slate-600">{response.needVisibility}</td>
                      <td className="p-4 text-sm text-slate-600">{response.interviewerName || '-'}</td>
                    </tr>
                    {expandedRows.has(response.id) && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={10} className="p-0 border-t-0">
                          <div className="px-14 py-6 text-sm text-slate-700 space-y-6">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-2 text-base">
                              <Info className="w-5 h-5 text-indigo-500" />
                              Detalles de la Encuesta
                            </h4>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <h5 className="font-semibold text-slate-800 mb-2">1. Origen y Nacionalidad</h5>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <span className="text-slate-500 w-1/3">¿Naciste en Argentina?</span>
                                    <span className="font-medium text-slate-800 w-2/3">{response.bornInArgentina}</span>
                                  </div>
                                  {response.bornInArgentina === 'No' && (
                                    <div className="flex justify-between items-start">
                                      <span className="text-slate-500 w-1/3">¿De dónde sos?</span>
                                      <span className="font-medium text-slate-800 w-2/3 break-words">{response.countryOfOrigin || '-'}</span>
                                    </div>
                                  )}
                                  {response.bornInArgentinaExtra && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap break-words mt-2">
                                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Comentario Adicional</span>
                                      {response.bornInArgentinaExtra}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <h5 className="font-semibold text-slate-800 mb-2">2. Familiares Migrantes</h5>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <span className="text-slate-500 w-1/3">¿Tenés familiares migrantes?</span>
                                    <span className="font-medium text-slate-800 w-2/3">{response.familyMigrated}</span>
                                  </div>
                                  {response.familyMigratedExtra && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap break-words mt-2">
                                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Comentario Adicional</span>
                                      {response.familyMigratedExtra}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <h5 className="font-semibold text-slate-800 mb-2">3. Dificultades</h5>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <span className="text-slate-500 w-1/3">¿Hay dificultades de vivir en Argentina?</span>
                                    <span className="font-medium text-slate-800 w-2/3">{response.difficultiesLivingAbroad}</span>
                                  </div>
                                  {response.difficultiesLivingAbroadExtra && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap break-words mt-2">
                                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Comentario Adicional</span>
                                      {response.difficultiesLivingAbroadExtra}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <h5 className="font-semibold text-slate-800 mb-2">4. Medidas del Estado</h5>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <span className="text-slate-500 w-1/3">¿El estado realiza suficientes medidas?</span>
                                    <span className="font-medium text-slate-800 w-2/3">{response.stateMeasures}</span>
                                  </div>
                                  {response.stateMeasuresExtra && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap break-words mt-2">
                                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Comentario Adicional</span>
                                      {response.stateMeasuresExtra}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <h5 className="font-semibold text-slate-800 mb-2">5. Visibilidad</h5>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <span className="text-slate-500 w-1/3">¿Son necesarias estas experiencias?</span>
                                    <span className="font-medium text-slate-800 w-2/3">{response.needVisibility}</span>
                                  </div>
                                  {response.needVisibilityExtra && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap break-words mt-2">
                                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Comentario Adicional</span>
                                      {response.needVisibilityExtra}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {responses.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      Aún no hay encuestas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

