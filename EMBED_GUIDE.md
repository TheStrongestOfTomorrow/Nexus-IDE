# 🔌 Nexus IDE v2: Developer Embedding & Onboarding Integration Guide
**Version 2.0 (High-Performance Shadow DOM & PostMessage API Integration)**

---

## 1. Introduction

Nexus IDE is designed from the ground up for seamless, deep integration into existing technical platforms. Whether you are building an interactive coding blog, writing technical API documentation, running an educational coding bootcamp, or embedding an isolated playground into an application portfolio, Nexus IDE provides a robust, zero-leak, zero-lag solution.

By leveraging **Shadow DOM container boundary encapsulation**, Nexus guarantees complete CSS isolation. External parent stylesheet designs never leak in to corrupt the Monaco rendering container, and hotkeys (like `Ctrl+F` or `Ctrl+S`) stay fully captured within the active editor.

With a comprehensive **bi-directional PostMessage API**, parent platforms can dynamically push file writes, trigger terminal commands, listen to active workspace occurrences, and easily hook interactive client-side execution environments directly to text and animations.

---

## 2. The 1-Line HTML iframe Embed

The quickest, most robust way to embed a pre-configured coding environment is using a standard `<iframe>` pointing to the Nexus Web endpoint. By appending query parameters to the URL, you can configure the initialization state on-the-fly.

### The Standard Iframe Embed Template

```html
<iframe
  src="https://thestrongestoftomorrow.github.io/Nexus-IDE/?repo=github.com/TheStrongestOfTomorrow/Nexus-IDE&file=src/embed.tsx&theme=dark&terminal=true"
  style="width: 100%; height: 650px; border: 1px solid #30363d; border-radius: 8px; overflow: hidden;"
  allow="cross-origin-isolated; filesystem; clipboard-read; clipboard-write; sync-xhr"
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
></iframe>
```

### Supported URL Query Parameters

| Parameter | Type | Default | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| **`repo`** | `string` | `none` | Automatically clones a public GitHub repository on initialization via `isomorphic-git`. | `?repo=github.com/octocat/Spoon-Knife` |
| **`file`** | `string` | `none` | The relative path of the file that should automatically open in the active Monaco tab. | `?file=README.md` |
| **`theme`** | `string` | `dark` | Defines the starting visual skin. Acceptable options are `dark` or `light`. | `?theme=light` |
| **`terminal`** | `boolean`| `false` | Instructs the editor panel layout to open with the terminal drawer split visible. | `?terminal=true` |
| **`workspace`**| `string` | `none` | Loads a pre-defined workspace configuration from browser IndexedDB. | `?workspace=react-boiler` |
| **`mode`** | `string` | `full` | Toggles layout simplicity. `full` shows all menus. `lean` collapses the sidebar. | `?mode=lean` |

---

## 3. Auto-Initialization via HTML Attributes

For serverless deployments where you want to embed a native component directly into the DOM using Javascript rather than standard iframes, you can load the compiled ES module and utilize simple `data-nexus-embed-auto` elements.

When the script executes, it automatically detects any elements carrying the `data-nexus-embed-auto` tag, extracts configuration parameters, and mounts the isolated Shadow DOM code environment.

### HTML Structure

```html
<!-- The container element with custom attributes -->
<div 
  data-nexus-embed-auto 
  data-theme="dark"
  data-initial-project="demo-workspace"
  id="my-custom-editor"
  style="width: 100%; height: 600px; border: 1px solid #232323; border-radius: 6px;"
></div>

<!-- Load the compiled ES module -->
<script type="module" src="https://thestrongestoftomorrow.github.io/Nexus-IDE/nexus-embed.es.js"></script>
```

### Dynamic Teardown

If you are running a Single Page Application (SPA) or custom navigation flow, you must clean up memory and unmount the DOM when a user navigates away. The auto-initializer automatically attaches a cleanup handler directly to the native element object:

```javascript
// Cleanly unmount and dispose of the editor instance
document.getElementById('my-custom-editor').nexusDestroy();
```

---

## 4. Programmatic Vanilla JS & CDN Integration

If you prefer explicit control over when, where, and how an IDE instance mounts, you can use the global `NexusIDE` API initialized by the CDN script.

### JS Integration Template

```html
<div id="ide-container" style="width: 100%; height: 600px;"></div>

<!-- Import using ES modules -->
<script type="module">
  import { NexusIDE } from 'https://thestrongestoftomorrow.github.io/Nexus-IDE/nexus-embed.es.js';
  
  try {
    // Programmatically initialize the IDE
    const app = NexusIDE.create('ide-container', {
      theme: 'dark',
      initialProject: 'todo-list-app'
    });
    
    // Perform operations...
    console.log('IDE mounted inside container:', app.getElement());
    
    // To cleanly unmount and clear resources:
    // app.destroy();
  } catch (error) {
    console.error('Failed to mount Nexus IDE:', error);
  }
</script>
```

---

## 5. Modern Framework Integrations

Because Nexus compiles into a unified ES module, it is trivial to embed inside modern component-driven SPA frameworks.

### 5.1 React Functional Component

This React component utilizes a reference hook to safely handle the lifecycle, initializing cleanly on mount, offering reactive communication, and unmounting via `.destroy()` to prevent severe memory leaks.

```tsx
import React, { useEffect, useRef } from 'react';
import { NexusEmbed, NexusEmbedAPI } from 'https://thestrongestoftomorrow.github.io/Nexus-IDE/nexus-embed.es.js';

interface CodePlaygroundProps {
  theme?: 'dark' | 'light';
  project?: string;
  onIdeReady?: () => void;
}

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
  theme = 'dark',
  project,
  onIdeReady
}) => {
  const ideRef = useRef<NexusEmbedAPI>(null);

  // Send an open-file directive to the active editor
  const openSourceFile = (filePath: string) => {
    if (ideRef.current?.isReady()) {
      ideRef.current.sendMessage('open-file', { path: filePath });
    }
  };

  useEffect(() => {
    // Dynamic initialization actions on Mount...
    console.log('[Component] Mounting CodePlayground');
    
    return () => {
      // CRITICAL: Prevent memory leaks in React SPAs on Unmount
      if (ideRef.current) {
        console.log('[Component] Invoking destruction teardown...');
        ideRef.current.destroy();
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div style={{ padding: '10px', background: '#1e1e1e', borderBottom: '1px solid #333' }}>
        <button onClick={() => openSourceFile('src/main.ts')}>
          Edit Entrypoint (src/main.ts)
        </button>
      </div>
      
      <div style={{ height: 'calc(100% - 50px)' }}>
        <NexusEmbed
          ref={ideRef}
          theme={theme}
          initialProject={project}
          onReady={() => {
            console.log('[Component] Nexus IDE is ready!');
            if (onIdeReady) onIdeReady();
          }}
          onError={(err) => console.error('[Component] Mount Error:', err)}
        />
      </div>
    </div>
  );
};
```

### 5.2 Vue 3 Component

```html
<template>
  <div class="playground-wrapper">
    <div ref="container" style="width: 100%; height: 600px;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { NexusIDE } from 'https://thestrongestoftomorrow.github.io/Nexus-IDE/nexus-embed.es.js';

const props = defineProps({
  theme: { type: String, default: 'dark' }
});

const container = ref(null);
let ideApp = null;

onMounted(() => {
  if (container.value) {
    ideApp = NexusIDE.create(container.value, {
      theme: props.theme
    });
  }
});

onBeforeUnmount(() => {
  // Clear Wasm, VM caches, and listeners
  if (ideApp) {
    ideApp.destroy();
  }
});
</script>
```

---

## 6. Bi-directional PostMessage API & Custom Events

The parent application and the embedded Nexus IDE communicate using a standard, low-overhead event pipeline. Communication can occur natively (when both exist on the same origin via Shadow DOM custom events) or cross-origin (when embedded via standard iframes using PostMessage).

### 6.1 Parent to IDE: Sending Commands

The parent app can programmatically instruct the IDE to create files, load scripts, run terminal commands, or toggle layouts.

#### Option A: PostMessage API (For iframe embeds)

```javascript
const iframe = document.querySelector('iframe');

// Utility to send commands safely
function sendIframeCommand(command, payload = {}) {
  if (iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'nexus-ide-command',
      eventId: `cmd-${Date.now()}`,
      command: command,
      payload: payload
    }, '*');
  }
}

// Example commands
sendIframeCommand('open-file', { path: 'src/App.tsx' });
sendIframeCommand('new-file', { name: 'config.json', content: '{"active": true}' });
sendIframeCommand('run-code', { language: 'typescript' });
sendIframeCommand('toggle-terminal');
```

#### Option B: Custom DOM Events (For Shadow DOM embeds)

If you are running Nexus in the same origin DOM, you can dispatch CustomEvents directly to the container:

```javascript
const ideElement = document.getElementById('nexus-ide-root');

const dispatchCommand = (command, payload = {}) => {
  const event = new CustomEvent('nexus-command', {
    detail: { command, payload },
    bubbles: true
  });
  ideElement.dispatchEvent(event);
};

// Toggle the terminal sidebar
dispatchCommand('toggle-terminal');
```

---

### 6.2 IDE to Parent: Listening to Events

Nexus emits high-fidelity real-time events regarding workspace status, terminal activities, or AI agent responses back to the parent.

#### Option A: MessageEvent Listener (For iframe embeds)

```javascript
window.addEventListener('message', (event) => {
  // Ensure the message is from Nexus IDE
  if (event.data?.type === 'nexus-ide-ready') {
    console.log('🎉 Nexus IDE is fully loaded and ready to receive commands!');
  }
  
  if (event.data?.type === 'nexus-ide-event') {
    const { event: eventName, data } = event.data.payload;
    console.log(`[Event Received] ${eventName}:`, data);
    
    switch (eventName) {
      case 'file-saved':
        console.log('User saved file:', data.path);
        break;
      case 'terminal-output':
        console.log('Received raw terminal stdout:', data.output);
        break;
      case 'ai-response':
        console.log('AI streamed completion chunks:', data.chunk);
        break;
    }
  }
});
```

#### Option B: DOM Event Listeners (For Shadow DOM embeds)

Listen for CustomEvents on the container element:

```javascript
const container = document.getElementById('nexus-ide-root');

container.addEventListener('nexus-event', (event) => {
  const { event: eventName, data } = event.detail;
  console.log(`[DOM Event] ${eventName}`, data);
});
```

---

### 6.3 Supported Command & Event Schema

#### Supported Outbound Commands (Parent ➜ IDE)
*   `open-file`: `{ path: string }` - Opens a file in the Monaco Editor viewport.
*   `new-file`: `{ name: string, content?: string }` - Creates a new empty or pre-populated file in the workspace.
*   `save-file`: `{ path?: string }` - Manually triggers a save-to-storage operation.
*   `run-code`: `{ language?: string }` - Sends the current active file buffer to the virtualized Terminal/WebContainer compiler.
*   `toggle-terminal`: Toggles the visibility of the bottom Terminal pane.
*   `toggle-sidebar`: Toggles the left-hand directory and explorer navigation tree.

#### Supported Inbound Events (IDE ➜ Parent)
*   `file-opened`: `{ path: string, content: string }` - Dispatched when Monaco successfully opens a file.
*   `file-saved`: `{ path: string }` - Dispatched when file writes sync to IndexedDB.
*   `terminal-output`: `{ output: string }` - Streams the raw ANSI output of standard compiling terminals.
*   `ai-response`: `{ chunk: string, model: string }` - Streams the response chunks of the direct-to-provider AI agent.
*   `error`: `{ message: string, code?: string }` - Dispatched when internal system compilation or loading issues occur.

---

## 7. Performance & Production Best Practices

To guarantee a world-class user experience, developers should implement these engineering practices:

### 7.1 Cross-Origin Isolation Headers (Crucial for Terminal Supports)
Because the **v86 Alpine VM** and **Node.js WebContainers** require low-overhead multi-threaded memory models, they rely on `SharedArrayBuffer` support. Without secure isolation, modern browsers completely disable SharedArrayBuffer, causing terminal features to hide silently.

Your web server **must** return the following HTTP response headers for the page hosting the embed:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

#### Nginx Configuration
```nginx
location / {
    add_header Cross-Origin-Opener-Policy "same-origin";
    add_header Cross-Origin-Embedder-Policy "require-corp";
}
```

#### Apache `.htaccess` Configuration
```apache
<IfModule mod_headers.c>
    Header set Cross-Origin-Opener-Policy "same-origin"
    Header set Cross-Origin-Embedder-Policy "require-corp"
</IfModule>
```

---

### 7.2 Memory and Lifecycle Cleanup
WASM threads and Monaco Editor contexts consume local client memory. If users can open and close the IDE component within your parent single-page app, always call the `.destroy()` API method before unmounting or removing container divs. 

Failing to do so will block garbage collection on the browser's WebAssembly execution heap, eventually causing the tab to crash with **Out-Of-Memory (OOM)** errors.

---

### 7.3 Resource Lazy Loading
The main embedding file (`nexus-embed.es.js`) is highly optimized, but Monaco Editor and WebContainers require dynamic external loading. 
*   **Recommendation:** Do not inject the embedding module directly into the primary `index.html` boot loader of your parent app. Instead, dynamically inject the script or mount the React wrapper **only when the user actively triggers** the IDE modal or navigates to the playground route.
