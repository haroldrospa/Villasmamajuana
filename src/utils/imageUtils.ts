/**
 * Transforma enlaces de visualización de Google Drive y otros servicios 
 * en enlaces directos que pueden ser usados en etiquetas <img>.
 */
export const getDirectImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/\/d\/(.+?)\/?(?:\/|$|\?)/) || url.match(/id=(.+?)(?:&|$)/);
    if (idMatch && idMatch[1]) {
      // Pasamos "export=download" a través de un proxy CDN Global optimizador para evadir permanentemente el bloqueo 403/CORS de Google Drive
      const rawDriveUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
      return `https://wsrv.nl/?url=${encodeURIComponent(rawDriveUrl)}&output=webp&w=1000`;
    }
  }
  
  return url;
};
