/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  ChevronRight, 
  Info,
  TrendingUp,
  Sparkles
} from 'lucide-react';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Prediction {
  word: string;
  probability: number;
}

export default function App() {
  const [sentence, setSentence] = useState<string>("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getPredictions = useCallback(async (currentSentence: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const prompt = currentSentence.trim() === "" 
        ? "Voorspel de 5 meest waarschijnlijke woorden om een Nederlandse zin mee te beginnen."
        : `Gezien de huidige zin: "${currentSentence}", wat zijn de 5 meest logische vervolgwoorden in het Nederlands?`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "Je bent een taalmodel gespecialiseerd in Nederlandse taallogica. Geef altijd een JSON array terug van precies 5 objecten. Elk object heeft 'word' (string) en 'probability' (getal tussen 0 en 1). De som van de probabilities moet logisch zijn (bijv. rond de 0.8 voor de top 5). Sorteer van hoog naar laag.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                probability: { type: Type.NUMBER }
              },
              required: ["word", "probability"]
            }
          }
        }
      });

      const result = JSON.parse(response.text || "[]");
      setPredictions(result);
    } catch (err) {
      console.error("Fout bij ophalen voorspellingen:", err);
      setError("Kon voorspellingen niet laden. Controleer je internetverbinding.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Initial load
  useEffect(() => {
    getPredictions("");
  }, []);

  // Handle manual input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sentence !== "") {
        getPredictions(sentence);
      }
    }, 800); // 800ms delay after typing stops

    return () => clearTimeout(timer);
  }, [sentence, getPredictions]);

  const addWord = (word: string) => {
    const newSentence = sentence.trim() === "" ? word : `${sentence.trim()} ${word}`;
    setSentence(newSentence + " ");
  };

  const clearSentence = () => {
    setSentence("");
    getPredictions("");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-600">
              <Sparkles size={20} className="fill-blue-600" />
              <span className="text-xs font-bold tracking-widest uppercase">Predictive UI</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Woorden Voorspeller</h1>
            <p className="text-[#86868B] text-sm">Typ je eigen zin of kies uit de suggesties.</p>
          </div>
          
          <button 
            onClick={clearSentence}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group text-[#86868B] hover:text-red-500"
            title="Schoonmaken"
          >
            <RotateCcw size={20} className="group-hover:rotate-[-90deg] transition-transform duration-300" />
          </button>
        </header>

        {/* Main Display / Input Area */}
        <motion.div 
          layout
          className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50 border border-gray-100 min-h-[180px] flex flex-col relative overflow-hidden"
        >
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="Begin hier met typen of kies een woord hieronder..."
            className="w-full h-full bg-transparent text-2xl md:text-3xl font-medium resize-none focus:outline-none placeholder:text-gray-200 placeholder:italic leading-relaxed"
            spellCheck={false}
          />

          <div className="absolute right-4 bottom-4 flex items-center gap-2">
            {isLoading && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] uppercase font-bold tracking-widest text-blue-400 mr-2"
              >
                AI denkt na...
              </motion.span>
            )}
            {sentence !== "" && (
              <button 
                onClick={clearSentence}
                className="p-2 text-gray-300 hover:text-gray-600 transition-colors"
                title="Schoonmaken"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Predictions Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[#86868B]">
              <TrendingUp size={16} />
              <h2 className="text-xs font-bold tracking-widest uppercase">Voorspellingen</h2>
            </div>
            {isLoading && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
              />
            )}
          </div>

          <div className="grid gap-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {predictions.map((prediction, index) => (
                <motion.button
                  key={prediction.word}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => addWord(prediction.word)}
                  disabled={isLoading}
                  className="w-full group bg-white hover:bg-gray-50 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 transition-all active:scale-[0.98] disabled:opacity-50"
                  id={`prediction-${index}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {index + 1}
                    </div>
                    <span className="text-lg font-semibold tracking-tight">{prediction.word}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end gap-1 w-24">
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${prediction.probability * 100}%` }}
                          className="h-full bg-blue-500"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">{(prediction.probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="md:hidden text-sm font-mono text-blue-600 font-bold">
                      {Math.round(prediction.probability * 100)}%
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center gap-2"
            >
              <Info size={16} />
              {error}
            </motion.div>
          )}
        </section>

        {/* Footer Info */}
        <footer className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between gap-4 text-[#86868B] text-[11px] leading-relaxed">
            <div className="max-w-xs">
              <p className="font-bold text-gray-500 mb-1 uppercase tracking-wider">Hoe het werkt</p>
              <p>Deze AI analyseert de zinsstructuur en berekent via statistische waarschijnlijkheid welke woorden het vaakst volgen in de Nederlandse taal.</p>
            </div>
            <div className="max-w-xs md:text-right">
              <p className="font-bold text-gray-500 mb-1 uppercase tracking-wider">Status</p>
              <p>Model: Gemini 3 Flash<br/>Taal: Nederlands (BE/NL)</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
