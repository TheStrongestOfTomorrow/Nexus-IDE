import React, { useEffect, useRef, useState } from 'react';
import { FileNode } from '../hooks/useFileSystem';
import { Play, RefreshCw } from 'lucide-react';

interface PreviewProps {
  files: FileNode[];
  activeFileId: string | null;
}

export default function Preview({ files, activeFileId }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  const activeFile = files.find(f => f.id === activeFileId);

  const runPreview = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    if (!iframeRef.current) return;

    const htmlFile = files.find(f => f.name === 'index.html');
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const jsFiles = files.filter(f => f.name.endsWith('.js'));
    const pyFiles = files.filter(f => f.name.endsWith('.py'));

    let htmlContent = htmlFile ? htmlFile.content : '<html><body><h1>No index.html found</h1></body></html>';

    // If active file is python, we might want to just run python
    if (activeFile?.name.endsWith('.py')) {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>
          <style>
            body { background: #1e1e1e; color: #d4d4d4; font-family: monospace; padding: 1rem; margin: 0; }
            pre { margin: 0; white-space: pre-wrap; }
            .error { color: #f48771; }
            .system { color: #569cd6; }
          </style>
        </head>
        <body>
          <div class="system">Loading Python environment...</div>
          <pre id="output"></pre>
          <script type="text/python" id="python-code">
${activeFile.content.replace(/</g, '\\u003c')}
          </script>
          <script>
            async function main() {
              try {
                let pyodide = await loadPyodide();
                document.querySelector('.system').style.display = 'none';
                
                // Redirect stdout
                pyodide.setStdout({ batched: (str) => {
                  const out = document.getElementById('output');
                  out.textContent += str + '\\n';
                }});
                
                // Redirect stderr
                pyodide.setStderr({ batched: (str) => {
                  const out = document.getElementById('output');
                  const span = document.createElement('span');
                  span.className = 'error';
                  span.textContent = str + '\\n';
                  out.appendChild(span);
                }});

                const code = document.getElementById('python-code').textContent;
                await pyodide.runPythonAsync(code);
              } catch (err) {
                const out = document.getElementById('output');
                const span = document.createElement('span');
                span.className = 'error';
                span.textContent = err + '\\n';
                out.appendChild(span);
              }
            }
            main();
          </script>
        </body>
        </html>
      `;
    } else if (activeFile?.name.endsWith('.md')) {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown.min.css">
          <style>
            body { padding: 2rem; background: #fff; }
            .markdown-body { min-width: 200px; max-width: 980px; margin: 0 auto; }
            @media (prefers-color-scheme: dark) {
              body { background: #0d1117; }
            }
          </style>
        </head>
        <body class="markdown-body">
          <div id="content"></div>
          <script>
            document.getElementById('content').innerHTML = marked.parse(\`${activeFile.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
          </script>
        </body>
        </html>
      `;
    } else if (activeFile?.name.endsWith('.json') || activeFile?.name.endsWith('.sql')) {
      const isJson = activeFile.name.endsWith('.json');
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background: #1e1e1e; color: #d4d4d4; font-family: monospace; padding: 1rem; margin: 0; }
            pre { margin: 0; white-space: pre-wrap; }
            .key { color: #9cdcfe; }
            .string { color: #ce9178; }
            .number { color: #b5cea8; }
            .boolean { color: #569cd6; }
            .keyword { color: #c586c0; }
          </style>
        </head>
        <body>
          <pre id="output">${activeFile.content.replace(/</g, '&lt;')}</pre>
        </body>
        </html>
      `;
    } else {
      // Inject CSS
      let styleTags = cssFiles.map(f => `<style>\n${f.content}\n</style>`).join('\n');
      
      // Inject JS
      let scriptTags = jsFiles.map(f => `<script>\n${f.content}\n</script>`).join('\n');

      // Replace linked files with inline content if possible
      // This is a simple approach. A real bundler would be better.
      htmlContent = htmlContent.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)">/g, (match, href) => {
        const file = files.find(f => f.name === href);
        return file ? `<style>\n${file.content}\n</style>` : match;
      });

      htmlContent = htmlContent.replace(/<script\s+src="([^"]+)"><\/script>/g, (match, src) => {
        const file = files.find(f => f.name === src);
        return file ? `<script>\n${file.content}\n</script>` : match;
      });

      // If there's no head, just prepend styles
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${styleTags}\n</head>`);
      } else {
        htmlContent = `${styleTags}\n${htmlContent}`;
      }

      // If there's no body, just append scripts
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${scriptTags}\n</body>`);
      } else {
        htmlContent = `${htmlContent}\n${scriptTags}`;
      }
    }

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    iframeRef.current.src = url;

    return () => URL.revokeObjectURL(url);
  }, [files, activeFileId, key]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-[#333]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#252526]">
        <span className="text-sm font-medium text-gray-700 dark:text-[#cccccc] uppercase tracking-wider">Preview</span>
        <button 
          onClick={runPreview}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#333] text-gray-600 dark:text-[#cccccc] transition-colors flex items-center gap-1 text-xs"
        >
          <Play size={14} />
          Run
        </button>
      </div>
      <div className="flex-1 bg-white relative">
        <iframe
          key={key}
          ref={iframeRef}
          className="absolute inset-0 w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin"
          title="preview"
        />
      </div>
    </div>
  );
}
