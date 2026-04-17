import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import WhatsAppButton from './WhatsAppButton';

const ClientLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background pb-20 relative overflow-x-hidden">
    {children}
    <BottomNav />
    <WhatsAppButton />
  </div>
);

export default ClientLayout;
