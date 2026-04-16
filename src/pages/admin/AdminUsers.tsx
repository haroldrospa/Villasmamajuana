import { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Shield, ShieldAlert, Clock, User, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { admins, currentAdmin, activityLogs, isLoading, toggleAdminRole } = useAdminAuth();
  const [showLogs, setShowLogs] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin'>('admin');

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'client') => {
    if (userId === currentAdmin?.id) {
      toast.error('No puedes cambiar tu propio rol');
      return;
    }

    setProcessingId(userId);
    const error = await toggleAdminRole(userId, currentRole);
    if (error) {
      toast.error('Error al cambiar rol: ' + error);
    } else {
      toast.success('Rol actualizado correctamente');
    }
    setProcessingId(null);
  };

  const filteredUsers = roleFilter === 'admin' 
    ? admins.filter(u => u.role === 'admin') 
    : admins;

  return (
    <AdminLayout>
      <PageTransition className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Administra quién tiene acceso al panel de control
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowLogs(!showLogs)} 
              className="bg-card border border-border text-foreground px-3 py-2 rounded-lg text-xs font-display font-semibold flex items-center gap-1.5 transition-colors hover:bg-muted"
            >
              <Clock size={14} /> {showLogs ? 'Cerrar Registro' : 'Ver Actividad'}
            </button>
          </div>
        </div>

        <div className="flex bg-muted/30 p-1 rounded-xl w-fit mb-6 border border-border/50">
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-6 py-2 rounded-lg text-xs font-display font-bold transition-all ${
              roleFilter === 'admin' 
                ? 'bg-white shadow-sm text-[#111827]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Administradores
          </button>
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-6 py-2 rounded-lg text-xs font-display font-bold transition-all ${
              roleFilter === 'all' 
                ? 'bg-white shadow-sm text-[#111827]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos los Usuarios
          </button>
        </div>

        {roleFilter === 'all' && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex gap-3 items-start animate-in fade-in slide-in-from-top-1 duration-300">
            <Info className="text-primary shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-xs text-foreground font-semibold">Nota Importante</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Para añadir un nuevo administrador, busca al usuario en esta lista y promotedlo con el botón "Hacer Admin".
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-border border-dashed">
            <Loader2 className="animate-spin text-primary mb-3" size={32} />
            <p className="text-sm text-muted-foreground font-display">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-card rounded-lg shadow-card p-4 gold-line transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${user.role === 'admin' ? 'bg-primary/10' : 'bg-muted'}`}>
                      <User size={16} className={user.role === 'admin' ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
                        {user.full_name || 'Sin nombre'}
                        {user.id === currentAdmin?.id && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Tú</span>
                        )}
                        {user.role === 'admin' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent flex items-center gap-1">
                            <Shield size={10} /> Admin
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">ID: {user.id}</p>
                      <p className="text-muted-foreground text-[10px] mt-0.5">
                        Registrado: {new Date(user.created_at).toLocaleDateString('es-DO')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {processingId === user.id ? (
                      <Loader2 size={16} className="animate-spin text-primary" />
                    ) : (
                      <button 
                        onClick={() => handleToggleRole(user.id, user.role as any)}
                        disabled={user.id === currentAdmin?.id}
                        className={`text-xs font-display font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          user.role === 'admin' 
                            ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white disabled:opacity-30' 
                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <><ShieldAlert size={14} /> Quitar Admin</>
                        ) : (
                          <><Shield size={14} /> Hacer Admin</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {admins.length === 0 && (
              <div className="text-center py-10 bg-card rounded-lg border border-border border-dashed">
                <p className="text-muted-foreground text-sm">No se encontraron usuarios registrados.</p>
              </div>
            )}
          </div>
        )}

        {/* Activity log */}
        {showLogs && (
          <div className="mt-8 border-t border-border pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="font-display font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              <Clock size={18} className="text-primary" /> Registro de Actividad
            </h2>
            <div className="bg-card rounded-lg shadow-card overflow-hidden">
              {activityLogs.slice(0, 30).map((log) => (
                <div key={log.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                  <div>
                    <p className="text-sm text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground">por <span className="font-semibold">{log.adminName}</span></p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
              {activityLogs.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-6">Sin actividad registrada</p>
              )}
            </div>
          </div>
        )}
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminUsers;
