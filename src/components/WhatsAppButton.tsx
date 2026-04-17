import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const WhatsAppButton = () => {
  const { pathname } = useLocation();
  const isHomePage = pathname === '/';
  
  // Replace with the actual phone number
  const phoneNumber = "18299735049"; 
  const defaultMessage = "Hola Villas Mamajuana, estoy viendo su página web y me gustaría obtener más información para hacer una reservación.";
  
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(defaultMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-24 md:bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:scale-110 hover:shadow-[0_8px_25px_rgba(37,211,102,0.5)] transition-all duration-300 animate-in fade-in zoom-in-75 group"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={28} />
      {/* Tooltip on hover */}
      <span className="absolute right-full mr-4 bg-white text-[#111827] text-xs font-display font-medium py-1.5 px-3 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
        ¿Te ayudamos?
      </span>
    </button>
  );
};

export default WhatsAppButton;
