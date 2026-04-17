import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

const LanguageToggle = () => {
  const [lang, setLang] = useState('es');

  useEffect(() => {
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'es', includedLanguages: 'en,es', autoDisplay: false },
          'google_translate_element'
        );
      };

      // Add a CSS trick to hide the main google translate top bar
      const style = document.createElement('style');
      style.innerHTML = `
        .goog-te-banner-frame { display: none !important; }
        body { top: 0px !important; }
        #google_translate_element select { display: none !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const toggleLanguage = () => {
    // Find the injected select dropdown
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      const nextLang = lang === 'es' ? 'en' : 'es';
      select.value = nextLang;
      select.dispatchEvent(new Event('change'));
      setLang(nextLang);
    } else {
      console.warn("Traductor aún cargando...");
    }
  };

  return (
    <div className="relative flex items-center z-50">
      <div id="google_translate_element" className="absolute opacity-0 w-0 h-0 pointer-events-none overflow-hidden" />
      
      <button 
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-200 shadow-sm hover:scale-105 transition-all text-neutral-800"
        title="Cambiar Idioma / Translate"
      >
         <Globe size={14} className="text-primary hidden sm:block" />
         <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase flex items-center gap-1">
           <span className={lang === 'es' ? 'text-primary scale-110 transition-all' : 'opacity-40 transition-all'}>ES</span> 
           <span className="opacity-30">/</span> 
           <span className={lang === 'en' ? 'text-primary scale-110 transition-all' : 'opacity-40 transition-all'}>EN</span>
         </span>
      </button>
    </div>
  );
};

export default LanguageToggle;
