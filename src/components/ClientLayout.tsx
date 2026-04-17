import { ReactNode } from 'react';
import BottomNav from './BottomNav';

  <div className="min-h-screen bg-background pb-20 relative">
    {children}
    <footer className="w-full text-center py-6 mt-8 border-t border-border/50 bg-card/30">
        <p className="text-xs text-muted-foreground font-body">
            &copy; {new Date().getFullYear()} Villas Mamajuana. Todos los derechos reservados.
        </p>
    </footer>
    <BottomNav />
  </div>
);

export default ClientLayout;
