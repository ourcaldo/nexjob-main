export const ensureTrailingSlash = (url: string): string => {
  // Don't add trailing slash to URLs with file extensions or query parameters
  if (url.includes('.') || url.includes('?') || url.includes('#')) {
    return url;
  }
  
  // Don't add trailing slash if it already exists
  if (url.endsWith('/')) {
    return url;
  }
  
  return `${url}/`;
};

export const removeTrailingSlash = (url: string): string => {
  if (url === '/') return url; // Keep root slash
  return url.replace(/\/$/, '');
};

export const normalizeUrl = (url: string): string => {
  return ensureTrailingSlash(url);
};

export const wpCategoryMappings: Record<string, string> = {
  // Add your category mappings here
  // Example: 'teknologi-informasi': 'IT & Technology'
};

export const wpLocationMappings: Record<string, string> = {
  // Add your location mappings here
  // Example: 'jakarta': 'Jakarta', 'jawa-barat': 'Jawa Barat'
};