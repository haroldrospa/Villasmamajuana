/**
 * Extrae el File ID de cualquier formato de URL de Google Drive.
 */
export const extractDriveFileId = (url: string): string | null => {
  if (!url) return null;
  // Formato: /file/d/FILE_ID/view
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  // Formato: ?id=FILE_ID o &id=FILE_ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  // Formato: /d/FILE_ID
  const match3 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match3) return match3[1];
  return null;
};

/**
 * Retorna el mejor URL posible para mostrar la imagen en un <img> tag.
 * Usa el thumbnail oficial de Google Drive que no requiere login.
 */
export const getDirectImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  if (url.includes('drive.google.com') || url.includes('drive.usercontent.google.com')) {
    const fileId = extractDriveFileId(url);
    if (fileId) {
      // El thumbnail de Google sin sesión - formato estable y oficial
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }
  }

  return url;
};

/**
 * Genera una lista de URLs alternativas para un archivo de Google Drive.
 * Se pueden usar en cascada con el onError del <img> para máxima resiliencia.
 */
export const getDriveFallbackUrls = (url: string | null | undefined): string[] => {
  if (!url) return [];
  const fileId = extractDriveFileId(url);
  if (!fileId) return [url];
  return [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
  ];
};
