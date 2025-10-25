
/**
 * Template rendering utility for dynamic SEO content
 */

export interface TemplateVariables {
  site_title?: string;
  lokasi?: string;
  kategori?: string;
  [key: string]: string | undefined;
}

/**
 * Renders a template string by replacing variables with actual values
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object containing variable values
 * @returns Rendered string with variables replaced
 */
export const renderTemplate = (template: string, variables: TemplateVariables): string => {
  if (!template) return '';
  
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
  });
  
  // Clean up any remaining unreplaced variables
  result = result.replace(/{{[^}]+}}/g, '');
  
  return result;
};

/**
 * Renders multiple template fields at once
 * @param templates - Object with template strings
 * @param variables - Object containing variable values
 * @returns Object with rendered templates
 */
export const renderTemplates = (
  templates: Record<string, string>, 
  variables: TemplateVariables
): Record<string, string> => {
  const result: Record<string, string> = {};
  
  Object.entries(templates).forEach(([key, template]) => {
    result[key] = renderTemplate(template, variables);
  });
  
  return result;
};
