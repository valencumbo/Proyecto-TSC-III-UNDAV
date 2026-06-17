import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  MapPin, 
  AlertCircle, 
  Heart, 
  Send, 
  CheckCircle2,
  User,
  Handshake,
  Eye
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { 
  YES_NO, 
  YES_NO_UNSURE, 
  type SurveyResponse 
} from './types';
import { cn } from './lib/utils';
import redLogo from './red-Logo.png';
import undavLogo from './undav-Logo.png';

export default function App() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SurveyResponse>({
    intervieweeName: '',
    bornInArgentina: '',
    bornInArgentinaExtra: '',
    countryOfOrigin: '',
    familyMigrated: '',
    familyMigratedExtra: '',
    difficultiesLivingAbroad: '',
    difficultiesLivingAbroadExtra: '',
    stateMeasures: '',
    stateMeasuresExtra: '',
    needVisibility: '',
    needVisibilityExtra: '',
    interviewerName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bornInArgentina) {
      setError('Por favor complete los campos obligatorios (*)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'responses'), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error saving response:', err);
      setError('Hubo un error al enviar la encuesta. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      intervieweeName: '',
      bornInArgentina: '',
      bornInArgentinaExtra: '',
      countryOfOrigin: '',
      familyMigrated: '',
      familyMigratedExtra: '',
      difficultiesLivingAbroad: '',
      difficultiesLivingAbroadExtra: '',
      stateMeasures: '',
      stateMeasuresExtra: '',
      needVisibility: '',
      needVisibilityExtra: '',
      interviewerName: ''
    });
    setIsSubmitted(false);
    setError(null);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-[#5A5A40]/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#5A5A40]" />
            </div>
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#5A5A40]">¡Muchas gracias!</h2>
          <p className="font-sans text-gray-600">
            La información ha sido guardada correctamente. Tu aporte es fundamental para el trabajo social.
          </p>
          <button 
            onClick={resetForm}
            className="btn-primary w-full"
          >
            Nueva Encuesta
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-slate-50">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-400/20 blur-[120px] mix-blend-multiply pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply pointer-events-none" />
      
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-white/80 py-5 px-4 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 flex justify-start">
            <div className="w-16 h-16 items-center justify-center flex overflow-hidden">
              <img src={redLogo} alt="Logo Red" className="max-w-full max-h-full object-contain drop-shadow-sm" referrerPolicy="no-referrer" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            </div>
          </div>
          <div className="flex-[3] text-center">
            <h1 className="text-lg sm:text-xl font-extrabold font-sans tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Red de Migrantes y Refugiados UNDAV</h1>
          </div>
          <div className="flex-1 flex justify-end">
            <div className="w-16 h-16 items-center justify-center flex overflow-hidden">
              <img src={undavLogo} alt="Logo UNDAV" className="max-w-full max-h-full object-contain drop-shadow-sm" referrerPolicy="no-referrer" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-xl mx-auto px-4 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-blue-50 text-blue-900 border border-blue-100 rounded-2xl p-4 mb-8">
              <p className="text-sm font-sans font-medium text-center">
                Relevamiento territorial. Por favor completar todos los campos del cuestionario.
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm font-sans"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Q0: Interviewee Name */}
            <div className="space-y-3">
              <label className="form-label flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-blue-500" /> Nombre del entrevistado (Opcional)
              </label>
              <input
                type="text"
                className="form-input focus:border-blue-500"
                placeholder="Ej: Juan, Maria..."
                value={formData.intervieweeName}
                onChange={(e) => setFormData({ ...formData, intervieweeName: e.target.value })}
              />
            </div>

            {/* Q1: Born in Argentina */}
            <div className="space-y-3">
              <label className="form-label flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" /> 1. ¿Naciste en Argentina? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {YES_NO.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, bornInArgentina: val, countryOfOrigin: val === 'Sí' ? '' : formData.countryOfOrigin })}
                    className={cn(
                      "px-3 py-3 rounded-xl text-sm font-sans font-medium transition-all border",
                      formData.bornInArgentina === val 
                        ? "bg-[#E24A4A] text-white border-[#E24A4A] shadow-md shadow-red-500/20" 
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {formData.bornInArgentina === 'No' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pl-6 border-l-2 border-red-200"
              >
                <label className="form-label flex items-center gap-2 text-sm text-gray-600">
                  ¿De dónde sos? *
                </label>
                <input
                  type="text"
                  className="form-input focus:border-red-500"
                  placeholder="Ej: Venezuela, Senegal, Bolivia..."
                  value={formData.countryOfOrigin}
                  onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                  required={formData.bornInArgentina === 'No'}
                />
              </motion.div>
            )}

            <textarea
              className="form-input text-sm mt-2 resize-none h-20 placeholder:text-gray-400"
              placeholder="Información adicional (opcional)"
              value={formData.bornInArgentinaExtra}
              onChange={(e) => setFormData({ ...formData, bornInArgentinaExtra: e.target.value })}
            />

            {/* Q2: Family migrated */}
            <div className="space-y-3">
              <label className="form-label flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" /> 2. ¿Tenés familiares o conocidos cercanos que hayan inmigrado de otro país a argentina? ¿De dónde?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {YES_NO.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, familyMigrated: val })}
                    className={cn(
                      "px-3 py-3 rounded-xl text-sm font-sans font-medium transition-all border",
                      formData.familyMigrated === val 
                        ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20" 
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <textarea
                className="form-input text-sm mt-2 resize-none h-20 placeholder:text-gray-400"
                placeholder="Información adicional (opcional)"
                value={formData.familyMigratedExtra}
                onChange={(e) => setFormData({ ...formData, familyMigratedExtra: e.target.value })}
              />
            </div>

            {/* Q3: Difficulties */}
            <div className="space-y-3">
              <label className="form-label flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-500" /> 3. ¿Crees que son muchas las dificultades de vivir en argentina como extranjero?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {YES_NO_UNSURE.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficultiesLivingAbroad: val })}
                    className={cn(
                      "px-3 py-3 rounded-xl text-sm font-sans font-medium transition-all border",
                      formData.difficultiesLivingAbroad === val 
                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20" 
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <textarea
                className="form-input text-sm mt-2 resize-none h-20 placeholder:text-gray-400"
                placeholder="Información adicional (opcional)"
                value={formData.difficultiesLivingAbroadExtra}
                onChange={(e) => setFormData({ ...formData, difficultiesLivingAbroadExtra: e.target.value })}
              />
            </div>

            {/* Q4: State measures */}
            <div className="space-y-3">
              <label className="form-label flex items-center gap-2">
                <Handshake className="w-4 h-4 text-blue-600" /> 4. ¿Crees que el estado realiza suficientes medidas para facilitar la integración a los migrantes?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {YES_NO_UNSURE.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, stateMeasures: val })}
                    className={cn(
                      "px-3 py-3 rounded-xl text-sm font-sans font-medium transition-all border",
                      formData.stateMeasures === val 
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20" 
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <textarea
                className="form-input text-sm mt-2 resize-none h-20 placeholder:text-gray-400"
                placeholder="Información adicional (opcional)"
                value={formData.stateMeasuresExtra}
                onChange={(e) => setFormData({ ...formData, stateMeasuresExtra: e.target.value })}
              />
            </div>

            {/* Q5: Visibility experiences */}
            <div className="space-y-3">
              <label className="form-label flex items-center gap-2">
                <Eye className="w-4 h-4 text-pink-500" /> 5. ¿Pensás que son necesarias más experiencias como esta para darle mayor visibilidad a la migración y los migrantes?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {YES_NO.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, needVisibility: val })}
                    className={cn(
                      "px-3 py-3 rounded-xl text-sm font-sans font-medium transition-all border",
                      formData.needVisibility === val 
                        ? "bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20" 
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <textarea
                className="form-input text-sm mt-2 resize-none h-20 placeholder:text-gray-400"
                placeholder="Información adicional (opcional)"
                value={formData.needVisibilityExtra}
                onChange={(e) => setFormData({ ...formData, needVisibilityExtra: e.target.value })}
              />
            </div>

            <div className="h-px bg-[#e0e0d5] w-full my-6" />

            {/* Surveyor metadata */}
            <div className="space-y-3">
              <label className="form-label flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-blue-500" /> Realizado por (Encuestador - Opcional)
              </label>
              <input
                type="text"
                className="form-input focus:border-blue-500"
                placeholder="Nombre del estudiante"
                value={formData.interviewerName}
                onChange={(e) => setFormData({ ...formData, interviewerName: e.target.value })}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={cn(
                "btn-primary w-full py-4 text-lg flex items-center justify-center gap-3",
                isSubmitting && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enviar Relevamiento
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>
      
      {/* Decorative footer */}
      <footer className="mt-12 text-center pb-8 px-4 opacity-40">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-2">
          <Heart className="w-5 h-5 text-[#5A5A40]" />
          <p className="text-xs font-sans uppercase tracking-[0.2em]">En solidaridad construimos derechos</p>
        </div>
      </footer>
    </div>
  );
}
