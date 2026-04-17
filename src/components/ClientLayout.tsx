import { ReactNode } from 'react';
import BottomNav from './BottomNav';

const ClientLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background pb-20 relative">
    {children}
    <BottomNav />
  </div>
);

export default ClientLayout;
