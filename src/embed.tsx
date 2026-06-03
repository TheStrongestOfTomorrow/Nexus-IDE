import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Embed mode wrapper that isolates Nexus IDE from parent page
const NexusEmbed: React.FC<{
  containerId?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}> = ({ containerId = 'nexus-ide-root', onReady, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      // Create shadow DOM for complete isolation if not already created
      let rootElement: HTMLElement;
      
      if (containerRef.current) {
        // Check if we should use shadow DOM for isolation
        const useShadow = containerRef.current.getAttribute('data-shadow') !== 'false';
        
        if (useShadow && !containerRef.current.shadowRoot) {
          const shadow = containerRef.current.attachShadow({ mode: 'open' });
          
          // Create container inside shadow DOM
          const shadowContainer = document.createElement('div');
          shadowContainer.id = containerId;
          shadowContainer.style.all = 'initial'; // Reset all inherited styles
          shadowContainer.style.display = 'block';
          shadowContainer.style.width = '100%';
          shadowContainer.style.height = '100%';
          shadow.appendChild(shadowContainer);
          rootElement = shadowContainer;
          
          // Inject required styles into shadow DOM
          const styleElement = document.createElement('style');
          styleElement.textContent = `
            #${containerId} {
              all: initial;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              width: 100%;
              height: 100%;
              position: relative;
            }
            #${containerId} * {
              box-sizing: border-box;
            }
          `;
          shadow.insertBefore(styleElement, shadow.firstChild);
        } else {
          rootElement = containerRef.current;
          rootElement.id = containerId;
        }
      } else {
        rootElement = document.getElementById(containerId) || document.body;
      }

      // Prevent event leakage to parent
      const preventLeak = (e: Event) => {
        e.stopPropagation();
      };

      rootElement.addEventListener('keydown', preventLeak, true);
      rootElement.addEventListener('keyup', preventLeak, true);
      rootElement.addEventListener('click', preventLeak, true);
      rootElement.addEventListener('wheel', preventLeak, { passive: false, capture: true });

      // Render app
      const root = createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <App />
          </div>
        </React.StrictMode>
      );

      if (onReady) {
        setTimeout(onReady, 100);
      }
    } catch (error) {
      console.error('Nexus IDE embed error:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [containerId, onReady, onError]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        display: 'block',
      }}
      data-nexus-embed="true"
    />
  );
};

export default NexusEmbed;

// Auto-initialize if script is loaded directly
if (typeof window !== 'undefined') {
  const autoInitElements = document.querySelectorAll('[data-nexus-embed-auto]');
  autoInitElements.forEach((el) => {
    const containerId = el.getAttribute('id') || `nexus-${Date.now()}`;
    if (!el.id) el.id = containerId;
    
    const root = createRoot(el as HTMLElement);
    root.render(<NexusEmbed containerId={containerId} />);
  });
}
