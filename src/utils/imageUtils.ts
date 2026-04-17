/**
 * Transforma enlaces de visualización de Google Drive y otros servicios 
 * en enlaces directos que pueden ser usados en etiquetas <img>.
 */
export const getDirectImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/\/d\/(.+?)\/?(?:\/|$|\?)/) || url.match(/id=(.+?)(?:&|$)/);
    if (idMatch && idMatch[1]) {
      // Usar endpoint oficial de thumbnail de Google Drive que previene errores 403
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1920`;
    }
  }
  
  return url;
};
