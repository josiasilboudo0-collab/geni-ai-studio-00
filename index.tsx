
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Presentation as PptIcon, 
  Plus, 
  BrainCircuit, 
  Loader2, 
  BarChart3, 
  Moon, 
  Sun,
  CheckCircle2,
  Lock,
  Zap,
  MessageCircle,
  Settings2,
  ChevronDown
} from 'lucide-react';
import { User } from './types';
import { 
  generateExpertStructure, 
  writeExpertChapter, 
  generateProfessionalImage 
} from './geminiService';
import { jsPDF } from 'jspdf';
import pptxgen from 'pptxgenjs';

// --- Composants UI Réutilisables ---
const Button = ({ children, onClick, variant = 'primary', className = '', loading = false, disabled = false }: any) => {
  const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 text-sm md:text-base";
  const variants: any = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 shadow-lg shadow-blue-200 dark:shadow-blue-950/30",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
    pro: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-xl shadow-purple-200 dark:shadow-none",
    whatsapp: "bg-[#25D366] text-white hover:bg-[#128C7E] shadow-lg shadow-green-200 dark:shadow-none",
  };
  return (
    <button disabled={disabled || loading} onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}>{children}</div>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  
  // États de génération
  const [genSubject, setGenSubject] = useState('');
  const [genType, setGenType] = useState<'ebook' | 'ppt'>('ebook');
  const [chapterCount, setChapterCount] = useState(5);
  const [contentDepth, setContentDepth] = useState<'standard' | 'detailed' | 'expert'>('standard');
  const [pptStyle, setPptStyle] = useState('professionnel');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialisation Session
  useEffect(() => {
    const session = localStorage.getItem('genia_session');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.quota === undefined) parsed.quota = parsed.plan === 'pro' ? 3 : 1;
      if (parsed.purchaseIndex === undefined) parsed.purchaseIndex = 1;
      setCurrentUser(parsed);
    }
  }, []);

  useEffect(() => {
    if (currentUser) localStorage.setItem('genia_session', JSON.stringify(currentUser));
  }, [currentUser]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('genia_theme', newTheme ? 'dark' : 'light');
  };

  const handleLogin = (email: string) => {
    if (!email.includes('@')) return;
    const uid = Math.floor(100000 + Math.random() * 899999).toString();
    const user: User = { 
      uid, 
      email, 
      plan: 'free', 
      created: new Date().toISOString(), 
      ebookCount: 0, 
      pptCount: 0, 
      quota: 1, 
      purchaseIndex: 1 
    };
    setCurrentUser(user);
  };

  // --- LOGIQUE DE SÉCURITÉ (FORMULE ADMIN) ---
  const getSecurityParams = () => {
    const d = new Date();
    return {
      day: d.getDate(),
      hour: d.getHours(),
      uidTail: parseInt(currentUser?.uid.slice(-3) || "0"),
      pIdx: currentUser?.purchaseIndex || 1
    };
  };

  const getDailyId = () => {
    if (!currentUser) return "";
    const { day, hour, pIdx } = getSecurityParams();
    return `${currentUser.uid}-${day}-${hour}-${pIdx}`;
  };

  const getExpectedCode = () => {
    const { day, hour, uidTail, pIdx } = getSecurityParams();
    // FORMULE : (Heure * 7) + (3 derniers chiffres UID) + Jour + (Index * 5)
    let code = (hour * 7) + uidTail + day + (pIdx * 5);
    return code % 10000; // Code à 4 chiffres
  };

  const checkLimit = () => {
    if (!currentUser || currentUser.quota <= 0) {
      alert("Quota épuisé ! Activez un Pack Premium pour continuer.");
      setActiveTab('pro');
      return false;
    }
    return true;
  };

  // --- GÉNÉRATEURS ---
  const generateEbook = async () => {
    if (!genSubject || !checkLimit()) return;
    setIsGenerating(true);
    try {
      setStatusMessage("Architecture du livre...");
      const finalChapters = currentUser?.plan === 'pro' ? chapterCount : 5;
      const finalDepth = currentUser?.plan === 'pro' ? contentDepth : 'standard';
      const structure = await generateExpertStructure(genSubject, 'ebook', 'français', finalChapters);
      
      const doc = new jsPDF();
      const coverImg = await generateProfessionalImage(`Book Cover: ${genSubject}`);
      
      // Page de Couverture
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 297, 'F');
      if (coverImg) doc.addImage(coverImg, 'PNG', 15, 80, 180, 100);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.text(genSubject.toUpperCase(), 105, 50, { align: 'center', maxWidth: 180 });

      // Chapitres
      for (let i = 0; i < structure.length; i++) {
        const s = structure[i];
        setStatusMessage(`Rédaction Chapitre ${i + 1}/${structure.length}...`);
        doc.addPage();
        const content = await writeExpertChapter(s.title, s.brief, 'français', finalDepth);
        const img = await generateProfessionalImage(s.image_prompt);
        
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(22);
        doc.text(s.title, 20, 30);
        if (img) doc.addImage(img, 'PNG', 20, 45, 170, 90);
        
        doc.setFontSize(10.5);
        const splitText = doc.splitTextToSize(content, 170);
        let y = img ? 145 : 45;
        splitText.forEach((line: string) => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(line, 20, y);
          y += 5.5;
        });
      }
      doc.save(`${genSubject}.pdf`);
      setCurrentUser(u => u ? {...u, ebookCount: u.ebookCount + 1, quota: u.quota - 1} : null);
    } catch (e) { alert("Erreur de génération."); } finally { setIsGenerating(false); setStatusMessage(""); }
  };

  const generatePPT = async () => {
    if (!genSubject || !checkLimit()) return;
    setIsGenerating(true);
    try {
      const finalSlides = currentUser?.plan === 'pro' ? chapterCount : 5;
      const finalStyle = currentUser?.plan === 'pro' ? pptStyle : 'professionnel';
      const structure = await generateExpertStructure(genSubject, 'ppt', 'français', finalSlides, finalStyle);
      
      const pptx = new pptxgen();
      let titleSlide = pptx.addSlide();
      titleSlide.background = { color: '0F172A' };
      titleSlide.addText(genSubject.toUpperCase(), { x: 1, y: 2, w: 8, h: 2, fontSize: 36, color: 'FFFFFF', bold: true, align: "center" });

      for (let s of structure) {
        setStatusMessage(`Slide: ${s.title}...`);
        let slide = pptx.addSlide();
        const content = await writeExpertChapter(s.title, s.brief, 'français', 'standard');
        const img = await generateProfessionalImage(s.image_prompt);
        
        slide.addText(s.title, { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 24, bold: true });
        if (img) {
          slide.addImage({ data: img, x: 0.5, y: 1.5, w: 4.5, h: 3 });
          slide.addText(content.substring(0, 450) + "...", { x: 5.2, y: 1.5, w: 4.3, h: 3.2, fontSize: 12 });
        } else {
          slide.addText(content.substring(0, 800) + "...", { x: 0.5, y: 1.5, w: 9, h: 3.2, fontSize: 14 });
        }
      }
      await pptx.writeFile({ fileName: `PPT_${genSubject}.pptx` });
      setCurrentUser(u => u ? {...u, pptCount: u.pptCount + 1, quota: u.quota - 1} : null);
    } catch (e) { alert("Erreur."); } finally { setIsGenerating(false); setStatusMessage(""); }
  };

  const handleActivatePro = () => {
    if (!currentUser) return;
    const expected = getExpectedCode();
    if (parseInt(activationCode.trim()) === expected) {
      setCurrentUser({ 
        ...currentUser, 
        plan: 'pro', 
        quota: currentUser.quota + 3,
        purchaseIndex: (currentUser.purchaseIndex || 1) + 1 
      });
      alert("Félicitations ! 3 Crédits Premium ajoutés.");
      setActiveTab('generate');
      setActivationCode("");
    } else {
      alert("Code incorrect pour cette transaction précise. Vérifiez l'ID envoyé sur WhatsApp.");
    }
  };

  const openWhatsApp = () => {
    const msg = encodeURIComponent(`Bonjour, je souhaite un code d'activation Geni AI. ID: ${getDailyId()}`);
    window.open(`https://wa.me/22166566140?text=${msg}`, '_blank');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md w-full p-10 text-center shadow-2xl border-none">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
            <BrainCircuit className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black mb-2 dark:text-white tracking-tight">Geni AI Studio</h1>
          <p className="text-slate-500 mb-8 font-medium">L'IA qui rédige vos Ebooks et Slides.</p>
          <input 
            type="email" placeholder="votre@email.com" 
            className="w-full p-4 bg-slate-100 dark:bg-slate-800 border-none rounded-xl mb-4 text-center font-bold dark:text-white outline-none focus:ring-2 ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin((e.target as any).value)}
          />
          <Button className="w-full py-4 shadow-lg" onClick={() => handleLogin((document.querySelector('input') as any).value)}>
            Essayer Gratuitement
          </Button>
        </Card>
      </div>
    );
  }

  const isPro = currentUser.plan === 'pro';

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <BrainCircuit className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black dark:text-white uppercase tracking-tighter italic">Geni AI</span>
        </div>
        
        <nav className="space-y-3 flex-grow">
          <button onClick={() => setActiveTab('generate')} className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Plus className="w-5 h-5"/> Créer
          </button>
          <button onClick={() => setActiveTab('pro')} className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${activeTab === 'pro' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Zap className="w-5 h-5"/> Premium
          </button>
          <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${activeTab === 'stats' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <BarChart3 className="w-5 h-5"/> Compte
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t dark:border-slate-800">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl mb-6 text-center">
             <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Crédits</p>
             <p className="text-2xl font-black text-blue-900 dark:text-white">{currentUser.quota}</p>
          </div>
          <div className="flex items-center justify-between">
             <button onClick={toggleTheme} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {isDarkMode ? <Sun className="w-5 h-5 text-white"/> : <Moon className="w-5 h-5 text-slate-600"/>}
             </button>
             <button onClick={() => setCurrentUser(null)} className="text-red-500 text-xs font-black uppercase hover:underline">Quitter</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-grow p-6 md:p-12 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'generate' && (
            <div className="space-y-8">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-black mb-1 dark:text-white">Nouveau Projet</h1>
                  <p className="text-slate-500">Choisissez votre format et laissez l'IA travailler.</p>
                </div>
                <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-bold ${currentUser.quota > 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {currentUser.quota > 0 ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {currentUser.quota} Crédit(s) restant(s)
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setGenType('ebook')} className={`p-6 rounded-3xl border-2 text-left transition-all ${genType === 'ebook' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 shadow-md' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                  <BookOpen className={`w-8 h-8 mb-3 ${genType === 'ebook' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <h3 className="font-black dark:text-white text-lg">Ebook Premium</h3>
                  <p className="text-xs text-slate-400 mt-1">Livre complet avec images & PDF.</p>
                </button>
                <button onClick={() => setGenType('ppt')} className={`p-6 rounded-3xl border-2 text-left transition-all ${genType === 'ppt' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 shadow-md' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                  <PptIcon className={`w-8 h-8 mb-3 ${genType === 'ppt' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <h3 className="font-black dark:text-white text-lg">Présentation Slides</h3>
                  <p className="text-xs text-slate-400 mt-1">Export vers PowerPoint éditable.</p>
                </button>
              </div>

              <Card className="p-8 space-y-6 relative">
                {currentUser.quota <= 0 && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/90 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="w-14 h-14 text-slate-400 mb-4" />
                    <h3 className="text-2xl font-black dark:text-white mb-2">Crédits épuisés</h3>
                    <Button variant="pro" onClick={() => setActiveTab('pro')}>Recharger 3 Crédits</Button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Sujet de votre document</label>
                  <input 
                    type="text" value={genSubject} onChange={(e) => setGenSubject(e.target.value)}
                    placeholder="Ex: Guide complet de la finance pour débutants..."
                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-lg font-bold dark:text-white focus:ring-2 ring-blue-600 outline-none shadow-inner"
                  />
                </div>

                <div className="pt-2">
                  <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline">
                    <Settings2 className="w-4 h-4" /> Personnalisation
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={!isPro ? 'opacity-30 cursor-not-allowed' : ''}>
                          <label className="text-xs font-black text-slate-500 uppercase block mb-2">Quantité ({genType === 'ebook' ? 'Chapitres' : 'Slides'})</label>
                          <input 
                            type="range" min="3" max="12" value={isPro ? chapterCount : 5}
                            disabled={!isPro}
                            onChange={(e) => setChapterCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                        <div className={!isPro ? 'opacity-30 cursor-not-allowed' : ''}>
                          <label className="text-xs font-black text-slate-500 uppercase block mb-2">Profondeur de rédaction</label>
                          <select 
                            disabled={!isPro}
                            value={isPro ? contentDepth : 'standard'}
                            onChange={(e) => setContentDepth(e.target.value as any)}
                            className="w-full p-3 bg-white dark:bg-slate-900 border-none rounded-xl font-bold dark:text-white shadow-sm"
                          >
                            <option value="standard">Standard</option>
                            <option value="detailed">Détaillé</option>
                            <option value="expert">Expert (IA Avancée)</option>
                          </select>
                        </div>
                      </div>
                      {!isPro && (
                        <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest text-center">Passez au Premium pour modifier ces réglages</p>
                      )}
                    </div>
                  )}
                </div>

                <Button className="w-full py-5 text-xl shadow-xl" loading={isGenerating} disabled={!genSubject} onClick={genType === 'ebook' ? generateEbook : generatePPT}>
                  Générer mon document
                </Button>

                {isGenerating && (
                  <div className="text-center space-y-4 pt-2">
                    <p className="text-blue-600 font-black animate-pulse text-xs tracking-widest">{statusMessage}</p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full animate-progress"></div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'pro' && (
            <div className="max-w-xl mx-auto space-y-8 text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Zap className="text-white w-8 h-8" />
              </div>
              <h1 className="text-4xl font-black dark:text-white italic">Pack <span className="text-purple-600">Premium</span></h1>
              <div className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-8 py-3 rounded-full font-black text-2xl shadow-sm">
                2000 F CFA (3 Crédits)
              </div>
              
              <Card className="p-8 border-2 border-purple-100 dark:border-purple-900/30 shadow-2xl relative">
                <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">VOTRE ID DE TRANSACTION</p>
                <div className="text-3xl font-mono font-black text-blue-600 mb-8 bg-slate-50 dark:bg-slate-800 py-6 rounded-xl shadow-inner border border-slate-100 dark:border-slate-800 tracking-tighter">
                   {getDailyId()}
                </div>
                
                <Button variant="whatsapp" className="w-full py-5 text-lg mb-8" onClick={openWhatsApp}>
                  <MessageCircle className="w-6 h-6" /> Acheter mon Code
                </Button>

                <div className="pt-8 border-t dark:border-slate-800">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-3">Saisir le Code à 4 chiffres</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" value={activationCode} onChange={(e) => setActivationCode(e.target.value)}
                      placeholder="XXXX"
                      maxLength={4}
                      className="flex-grow p-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-center text-2xl font-mono font-bold dark:bg-slate-800 dark:text-white outline-none focus:border-purple-600 shadow-sm"
                    />
                    <Button variant="pro" className="px-8" onClick={handleActivatePro}>Activer</Button>
                  </div>
                </div>
                
                <div className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed opacity-60">
                  Code unique et sécurisé basé sur l'heure de demande.<br/>
                  Validité immédiate après réception.
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-8">
              <h1 className="text-4xl font-black dark:text-white">Votre Compte</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-8 text-center bg-blue-600 text-white border-none shadow-xl">
                   <p className="opacity-80 font-bold mb-1 uppercase text-[10px] tracking-widest">Crédits</p>
                   <p className="text-5xl font-black">{currentUser.quota}</p>
                </Card>
                <Card className="p-8 text-center shadow-md">
                   <p className="text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-widest">Ebooks</p>
                   <p className="text-5xl font-black text-slate-800 dark:text-white">{currentUser.ebookCount}</p>
                </Card>
                <Card className="p-8 text-center shadow-md">
                   <p className="text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-widest">Slides</p>
                   <p className="text-5xl font-black text-slate-800 dark:text-white">{currentUser.pptCount}</p>
                </Card>
              </div>
              <Card className="p-6">
                 <p className="text-xs font-black text-slate-400 uppercase mb-2">Utilisateur : {currentUser.email}</p>
                 <p className="text-xs font-black text-slate-400 uppercase">ID Permanent : {currentUser.uid}</p>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
