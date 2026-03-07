// Code formatting and linting service

export class FormattingService {
  static async formatCode(code: string, language: string): Promise<string> {
    try {
      // Basic formatting for different languages
      switch (language) {
        case 'javascript':
        case 'jsx':
        case 'typescript':
        case 'tsx':
          return this.formatJS(code);
        case 'json':
          return this.formatJSON(code);
        case 'html':
          return this.formatHTML(code);
        case 'css':
        case 'scss':
          return this.formatCSS(code);
        case 'python':
          return this.formatPython(code);
        default:
          return code;
      }
    } catch (error) {
      console.error('Formatting error:', error);
      return code;
    }
  }

  private static formatJS(code: string): string {
    let formatted = code;
    // Normalize spacing
    formatted = formatted.replace(/\{\s*/g, '{ ').replace(/\s*\}/g, ' }');
    formatted = formatted.replace(/\(\s*/g, '(').replace(/\s*\)/g, ')');
    // Fix indentation (basic)
    const lines = formatted.split('\n');
    let indent = 0;
    return lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indent = Math.max(0, indent - 1);
      }
      const formatted = '  '.repeat(indent) + trimmed;
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        indent++;
      }
      return formatted;
    }).join('\n');
  }

  private static formatJSON(code: string): string {
    try {
      return JSON.stringify(JSON.parse(code), null, 2);
    } catch {
      return code;
    }
  }

  private static formatHTML(code: string): string {
    let formatted = code;
    formatted = formatted.replace(/>\s*</g, '>\n<');
    formatted = formatted.replace(/>\s+</g, '>\n<');
    return formatted;
  }

  private static formatCSS(code: string): string {
    let formatted = code;
    formatted = formatted.replace(/\{\s*/g, ' {\n  ');
    formatted = formatted.replace(/;\s*/g, ';\n  ');
    formatted = formatted.replace(/\}\s*/g, '\n}\n');
    return formatted;
  }

  private static formatPython(code: string): string {
    // Basic Python formatting
    const lines = code.split('\n');
    return lines.map(line => {
      const trimmed = line.trim();
      return trimmed;
    }).join('\n');
  }

  static getLanguageFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      'js': 'javascript', 'jsx': 'jsx', 'ts': 'typescript', 'tsx': 'tsx',
      'json': 'json', 'html': 'html', 'htm': 'html',
      'css': 'css', 'scss': 'scss', 'less': 'less',
      'py': 'python', 'md': 'markdown', 'sql': 'sql'
    };
    return map[ext] || ext;
  }

  static minifyCode(code: string, language: string): string {
    try {
      if (language === 'json') {
        return JSON.stringify(JSON.parse(code));
      }
      // Remove comments and extra whitespace
      let minified = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      minified = minified.replace(/\s+/g, ' ').trim();
      return minified;
    } catch {
      return code;
    }
  }
}

export default FormattingService;
