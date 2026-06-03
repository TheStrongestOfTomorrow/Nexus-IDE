import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App';
import './index.css';

// PostMessage API types
export interface NexusEmbedMessage {
  type: 'nexus-ide-command' | 'nexus-ide-event' | 'nexus-ide-ready';
  command?: string;
  payload?: any;
  eventId?: string;
}

export interface NexusEmbedAPI {
  destroy: () => void;
  sendMessage: (command: string, payload?: any) => void;
  onMessage: (callback: (data: any) => void) => () => void;
  isReady: () => boolean;
  getContainer: () => HTMLElement | null;
}

// Embed mode wrapper that isolates Nexus IDE from parent page
const NexusEmbed = forwardRef<NexusEmbedAPI, {
  containerId?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onEvent?: (event: string, data: any) => void;
  theme?: 'dark' | 'light';
  initialProject?: string;
}>(({ 
  containerId = 'nexus-ide-root', 
  onReady, 
  onError, 
  onEvent,
  theme = 'dark',
  initialProject
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const rootRef = useRef<Root | null>(null);
  const eventListenersRef = useRef<Set<(data: any) => void>>(new Set());
  const isReadyRef = useRef(false);
  const messageQueueRef = useRef<Array<{command: string, payload?: any}>>([]);
  const preventLeakRef = useRef<(e: Event) => void>(() => {});

  // Expose API via ref
  useImperativeHandle(ref, () => ({
    destroy: () => {
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
      if (containerRef.current) {
        const rootElement = containerRef.current.shadowRoot 
          ? containerRef.current.shadowRoot.firstChild as HTMLElement 
          : containerRef.current;
        
        // Remove event listeners
        if (preventLeakRef.current) {
          rootElement.removeEventListener('keydown', preventLeakRef.current, true);
          rootElement.removeEventListener('keyup', preventLeakRef.current, true);
          rootElement.removeEventListener('click', preventLeakRef.current, true);
          rootElement.removeEventListener('wheel', preventLeakRef.current as any, { passive: false, capture: true });
        }
        
        // Clear shadow DOM if exists
        if (containerRef.current.shadowRoot) {
          containerRef.current.shadowRoot.innerHTML = '';
          containerRef.current.removeAttribute('data-shadow-root');
        }
      }
      initializedRef.current = false;
      isReadyRef.current = false;
      eventListenersRef.current.clear();
      messageQueueRef.current = [];
      console.log('[NexusEmbed] Destroyed successfully');
    },
    
    sendMessage: (command: string, payload?: any) => {
      if (isReadyRef.current) {
        const event = new CustomEvent('nexus-command', { 
          detail: { command, payload },
          bubbles: true 
        });
        
        const rootElement = containerRef.current?.shadowRoot 
          ? containerRef.current.shadowRoot.firstChild as HTMLElement 
          : containerRef.current;
          
        if (rootElement) {
          rootElement.dispatchEvent(event);
        }
      } else {
        messageQueueRef.current.push({ command, payload });
      }
    },
    
    onMessage: (callback: (data: any) => void) => {
      eventListenersRef.current.add(callback);
      return () => eventListenersRef.current.delete(callback);
    },
    
    isReady: () => isReadyRef.current,
    
    getContainer: () => {
      if (containerRef.current?.shadowRoot) {
        return containerRef.current.shadowRoot.firstChild as HTMLElement;
      }
      return containerRef.current;
    }
  }), []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      let rootElement: HTMLElement;
      
      if (containerRef.current) {
        const useShadow = containerRef.current.getAttribute('data-shadow') !== 'false';
        
        if (useShadow && !containerRef.current.shadowRoot) {
          const shadow = containerRef.current.attachShadow({ mode: 'open' });
          containerRef.current.setAttribute('data-shadow-root', 'true');
          
          const shadowContainer = document.createElement('div');
          shadowContainer.id = containerId;
          shadowContainer.style.all = 'initial';
          shadowContainer.style.display = 'block';
          shadowContainer.style.width = '100%';
          shadowContainer.style.height = '100%';
          shadowContainer.style.position = 'relative';
          shadowContainer.style.overflow = 'hidden';
          shadow.appendChild(shadowContainer);
          rootElement = shadowContainer;
          
          const styleElement = document.createElement('style');
          styleElement.textContent = `
            #${containerId} {
              all: initial;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              width: 100%;
              height: 100%;
              position: relative;
              background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
            }
            #${containerId} * { box-sizing: border-box; }
          `;
          shadow.insertBefore(styleElement, shadow.firstChild);
        } else if (containerRef.current.shadowRoot) {
          rootElement = containerRef.current.shadowRoot.firstChild as HTMLElement;
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
      preventLeakRef.current = preventLeak;

      rootElement.addEventListener('keydown', preventLeak, true);
      rootElement.addEventListener('keyup', preventLeak, true);
      rootElement.addEventListener('click', preventLeak, true);
      rootElement.addEventListener('wheel', preventLeak, { passive: false, capture: true });

      const root = createRoot(rootElement);
      rootRef.current = root;
      
      root.render(
        <React.StrictMode>
          <div 
            id="nexus-app-container" 
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
            data-theme={theme}
            data-initial-project={initialProject || ''}
          >
            <App />
          </div>
        </React.StrictMode>
      );

      const handleMessage = (event: MessageEvent<NexusEmbedMessage>) => {
        if (event.data?.type === 'nexus-ide-command') {
          const { command, payload } = event.data;
          const internalEvent = new CustomEvent('nexus-command', { 
            detail: { command, payload },
            bubbles: true 
          });
          rootElement.dispatchEvent(internalEvent);
          
          event.source?.postMessage({
            type: 'nexus-ide-event',
            eventId: event.data.eventId,
            payload: { success: true, command }
          }, event.origin);
        }
      };

      window.addEventListener('message', handleMessage);

      const handleInternalEvent = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) {
          eventListenersRef.current.forEach(cb => cb(customEvent.detail));
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'nexus-ide-event',
              payload: customEvent.detail
            }, '*');
          }
        }
      };

      rootElement.addEventListener('nexus-event', handleInternalEvent);

      setTimeout(() => {
        isReadyRef.current = true;
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'nexus-ide-ready' }, '*');
        }
        messageQueueRef.current.forEach(({ command, payload }) => {
          const event = new CustomEvent('nexus-command', { 
            detail: { command, payload },
            bubbles: true 
          });
          rootElement.dispatchEvent(event);
        });
        messageQueueRef.current = [];
        if (onReady) onReady();
      }, 100);

      return () => {
        window.removeEventListener('message', handleMessage);
        rootElement.removeEventListener('nexus-event', handleInternalEvent);
        rootElement.removeEventListener('keydown', preventLeak, true);
        rootElement.removeEventListener('keyup', preventLeak, true);
        rootElement.removeEventListener('click', preventLeak, true);
        rootElement.removeEventListener('wheel', preventLeak, { passive: false, capture: true });
      };
    } catch (error) {
      console.error('Nexus IDE embed error:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [containerId, onReady, onError, onEvent, theme, initialProject]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        display: 'block',
        position: 'relative',
      }}
      data-nexus-embed="true"
      role="application"
      aria-label="Nexus IDE"
    />
  );
});

NexusEmbed.displayName = 'NexusEmbed';

export default NexusEmbed;

// Auto-initialize if script is loaded directly
if (typeof window !== 'undefined') {
  const autoInitElements = document.querySelectorAll('[data-nexus-embed-auto]');
  autoInitElements.forEach((el) => {
    const containerId = el.getAttribute('id') || `nexus-${Date.now()}`;
    if (!el.id) el.id = containerId;
    
    const theme = (el.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
    const initialProject = el.getAttribute('data-initial-project') || undefined;
    
    const root = createRoot(el as HTMLElement);
    root.render(
      <NexusEmbed 
        containerId={containerId} 
        theme={theme}
        initialProject={initialProject}
      />
    );
    
    (el as any).nexusDestroy = () => root.unmount();
  });
  
  (window as any).NexusIDE = {
    create: (container: string | HTMLElement, options?: { theme?: 'dark' | 'light', initialProject?: string }) => {
      const el = typeof container === 'string' ? document.getElementById(container) : container;
      if (!el) throw new Error('Container not found');
      
      const root = createRoot(el as HTMLElement);
      root.render(
        <NexusEmbed 
          containerId={el.id || `nexus-${Date.now()}`}
          theme={options?.theme || 'dark'}
          initialProject={options?.initialProject}
        />
      );
      
      return {
        destroy: () => root.unmount(),
        getElement: () => el
      };
    }
  };
}
