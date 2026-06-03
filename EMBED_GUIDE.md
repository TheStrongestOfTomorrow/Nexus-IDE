# Nexus IDE - Embeddable Browser OS Integration Guide

## Overview

Nexus IDE is now production-ready for embedding into any web application, including Browser OS environments. The embeddable version provides complete isolation through Shadow DOM and includes a full API for programmatic control.

## Features

✅ **Complete CSS Isolation** - Shadow DOM prevents style conflicts  
✅ **Event Containment** - Keyboard shortcuts and mouse events stay within the IDE  
✅ **Lifecycle Management** - `destroy()` method for clean unmounting and memory cleanup  
✅ **PostMessage API** - Cross-origin communication support  
✅ **Theme Support** - Dynamic dark/light theme switching  
✅ **Command System** - Send commands to the IDE from parent app  
✅ **Event Listening** - Receive events from the IDE  

## Installation

### Option 1: CDN (Quick Start)

```html
<script type="module">
  import { NexusIDE } from 'https://thestrongestoftomorrow.github.io/Nexus-IDE/nexus-embed.es.js';
  
  const app = NexusIDE.create('my-container', {
    theme: 'dark',
    initialProject: 'my-project'
  });
</script>
```

### Option 2: NPM Package (After Publishing)

```bash
npm install nexus-ide
```

```javascript
import { NexusEmbed } from 'nexus-ide';
```

## Usage Examples

### React Integration

```jsx
import { useRef } from 'react';
import { NexusEmbed, NexusEmbedAPI } from './nexus-embed.es.js';

function MyBrowserOS() {
  const ideRef = useRef<NexusEmbedAPI>(null);
  
  const handleOpenApp = () => {
    if (ideRef.current?.isReady()) {
      ideRef.current.sendMessage('open-file', { path: 'src/main.ts' });
    }
  };
  
  const handleCloseApp = () => {
    ideRef.current?.destroy();
  };
  
  return (
    <div className="window-content">
      <NexusEmbed
        ref={ideRef}
        theme="dark"
        onReady={() => console.log('IDE Ready!')}
        onError={(error) => console.error(error)}
      />
    </div>
  );
}
```

### Vanilla JavaScript

```html
<div id="ide-container" style="width: 100%; height: 600px;"></div>

<script type="module">
  import { NexusIDE } from './nexus-embed.es.js';
  
  // Create instance
  const app = NexusIDE.create('ide-container', {
    theme: 'dark'
  });
  
  // Send commands
  setTimeout(() => {
    app.getElement().dispatchEvent(new CustomEvent('nexus-command', {
      detail: { command: 'new-file', payload: { name: 'test.js' } }
    }));
  }, 2000);
  
  // Cleanup when closing window
  function closeWindow() {
    app.destroy();
  }
</script>
```

### Auto-Initialization (HTML Attribute)

```html
<div 
  data-nexus-embed-auto 
  data-theme="dark"
  data-initial-project="demo"
  id="my-ide"
  style="width: 100%; height: 800px;"
></div>

<script>
  // Manual destroy later
  document.getElementById('my-ide').nexusDestroy();
</script>
```

## API Reference

### NexusEmbedAPI

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `destroy()` | Completely unmounts the IDE and cleans up resources | None | void |
| `sendMessage(command, payload)` | Send a command to the IDE | `command: string`, `payload?: any` | void |
| `onMessage(callback)` | Subscribe to IDE events | `callback: (data: any) => void` | Unsubscribe function |
| `isReady()` | Check if IDE is fully loaded | None | boolean |
| `getContainer()` | Get the root container element | None | HTMLElement \| null |

### Commands

Send commands via `sendMessage()` or custom events:

```javascript
// Via API
ideRef.current.sendMessage('open-file', { path: 'src/main.ts' });

// Via Event
container.dispatchEvent(new CustomEvent('nexus-command', {
  detail: { 
    command: 'open-file', 
    payload: { path: 'src/main.ts' } 
  }
}));
```

**Supported Commands:**
- `open-file` - Open a file: `{ path: string }`
- `new-file` - Create a file: `{ name: string, content?: string }`
- `save-file` - Save current file: `{ path?: string }`
- `run-code` - Execute code in terminal: `{ language?: string }`
- `toggle-terminal` - Show/hide terminal
- `toggle-sidebar` - Show/hide sidebar

### Events

Listen to IDE events:

```javascript
// Via API
const unsubscribe = ideRef.current.onMessage((data) => {
  console.log('IDE Event:', data);
});

// Via postMessage (cross-origin)
window.addEventListener('message', (event) => {
  if (event.data.type === 'nexus-ide-event') {
    console.log('Event:', event.data.payload);
  }
  if (event.data.type === 'nexus-ide-ready') {
    console.log('IDE is ready!');
  }
});
```

**Emitted Events:**
- `file-opened` - When a file is opened
- `file-saved` - When a file is saved
- `terminal-output` - Terminal output data
- `ai-response` - AI assistant response
- `error` - Error occurred

## Browser OS Integration Example

```javascript
class BrowserOS {
  constructor() {
    this.apps = new Map();
  }
  
  openNexusIDE(windowId, config = {}) {
    const windowEl = this.createWindow(windowId, {
      title: 'Nexus IDE',
      icon: 'code',
      width: 1200,
      height: 800
    });
    
    const container = windowEl.querySelector('.content');
    
    // Create IDE instance
    const app = NexusIDE.create(container, {
      theme: config.theme || 'dark',
      initialProject: config.project
    });
    
    // Store reference
    this.apps.set(windowId, {
      type: 'nexus-ide',
      instance: app,
      window: windowEl
    });
    
    // Handle window close
    windowEl.onClose = () => {
      app.destroy();
      this.apps.delete(windowId);
    };
    
    return app;
  }
  
  sendMessageToApp(windowId, command, payload) {
    const app = this.apps.get(windowId);
    if (app && app.instance) {
      app.instance.sendMessage(command, payload);
    }
  }
}

// Usage
const os = new BrowserOS();
const ide = os.openNexusIDE('ide-1', { project: 'my-app' });
os.sendMessageToApp('ide-1', 'open-file', { path: 'README.md' });
```

## Deployment

The embed build is automatically generated when deploying to GitHub Pages:

```yaml
# Build both standard and embed versions
npm run build                    # Standard build
EMBED_MODE=true npm run build   # Embed build
```

Files produced:
- `dist/index.html` - Standard standalone version
- `dist/nexus-embed.es.js` - ES module for embedding
- `dist/embed-example.html` - Interactive demo

## Performance Considerations

1. **Memory Management**: Always call `destroy()` when closing the IDE window
2. **Lazy Loading**: Load the embed script only when the app is opened
3. **Shared Workers**: WebContainer and v86 share workers across instances
4. **Asset Caching**: Monaco editor and xterm assets are cached after first load

## Troubleshooting

### Styles Not Loading
Ensure COOP/COEP headers are set for SharedArrayBuffer:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Events Not Working
Check that you're dispatching events with `bubbles: true`:
```javascript
new CustomEvent('nexus-command', { 
  detail: { command, payload },
  bubbles: true 
})
```

### Memory Leaks
Always call `destroy()` before removing the container:
```javascript
app.destroy();
container.remove();
```

## License

MIT License - See LICENSE file for details
