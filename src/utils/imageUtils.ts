/**
 * Transforma enlaces de visualización de Google Drive y otros servicios 
 * en enlaces directos que pueden ser usados en etiquetas <img>.
 */
export const getDirectImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // Soporte para Google Drive
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/\/d\/(.+?)\/?(?:\/|$|\?)/) || url.match(/id=(.+?)(?:&|$)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
  }
  
  return url;
};
