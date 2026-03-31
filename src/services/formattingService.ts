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
    // Basic JS formatting — avoid breaking template literals and regex
    let formatted = code;
    // Only add spaces around braces that are NOT inside template literals
    // Use a simpler approach: normalize indentation only
    const lines = formatted.split('\n');
    let indent = 0;
    return lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indent = Math.max(0, indent - 1);
      }
      const result = '  '.repeat(indent) + trimmed;
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        indent++;
      }
      return result;
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
    // Python formatting — preserve indentation (critical for Python syntax)
    const lines = code.split('\n');
    return lines.map(line => {
      const trimmed = line.trimEnd();
      // Preserve leading whitespace for Python indentation
      const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
      // Normalize tabs to 4 spaces
      const normalizedIndent = leadingWhitespace.replace(/\t/g, '    ');
      return normalizedIndent + trimmed;
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
      // Remove block comments first, then line comments (but not inside strings)
      // Simple approach: remove block comments, then remove line comments that aren't inside strings
      let minified = code.replace(/\/\*[\s\S]*?\*\//g, '');
      // Remove line comments — avoid matching // inside strings by checking for quotes
      minified = minified.replace(/(?:(?:(?:"(?:[^"\\]|\\.)*")|(?:'(?:[^'\\]|\\.)*')|[^"'\/])|(\/\/.*$))/gm, (match, _p1, _p2, p3, offset, str) => {
        // If this is a line comment (starts with //)
        if (match.startsWith('//')) {
          // Check if it's inside a string by counting unescaped quotes before this position
          let inDouble = false;
          let inSingle = false;
          for (let i = 0; i < offset; i++) {
            if (str[i] === '\\' && !inDouble) continue;
            if (str[i] === '"' && !inSingle) inDouble = !inDouble;
            if (str[i] === "'" && !inDouble) inSingle = !inSingle;
          }
          if (inDouble || inSingle) return match; // Inside a string, keep it
          return ''; // Outside a string, strip it
        }
        return match;
      });
      minified = minified.replace(/\s+/g, ' ').trim();
      return minified;
    } catch {
      return code;
    }
  }
}

export default FormattingService;
