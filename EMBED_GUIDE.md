# Nexus IDE Embed Mode

## Embedding Nexus IDE in Your HTML Page

Nexus IDE can now be embedded into any HTML page without interfering with other applications on the page.

### Method 1: React Component (Recommended)

```html
<!-- Container for Nexus IDE -->
<div id="my-nexus-ide" style="width: 100%; height: 700px;"></div>

<!-- Load React and ReactDOM -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Load Nexus IDE embed script -->
<script type="module">
  import NexusEmbed from 'https://thestrongestoftomorrow.github.io/Nexus-IDE/nexus-embed.es.js';
  
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('my-nexus-ide');
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(NexusEmbed, {
      containerId: 'my-nexus-ide',
      onReady: () => console.log('Nexus IDE loaded!'),
      onError: (err) => console.error('Error:', err)
    }));
  });
</script>
```

### Method 2: Auto-initialization

```html
<!-- Just add data-nexus-embed-auto attribute -->
<div 
  id="my-ide" 
  data-nexus-embed-auto 
  style="width: 100%; height: 700px;"
></div>

<script type="module" src="https://thestrongestoftomorrow.github.io/Nexus-IDE/nexus-embed.es.js"></script>
```

## Features

- **Shadow DOM Isolation**: Complete CSS and event isolation from parent page
- **Event Containment**: Keyboard, mouse, and wheel events don't leak to parent
- **Responsive**: Adapts to container size
- **Customizable**: Pass callbacks for ready/error states

## Configuration Options

```javascript
<NexusEmbed 
  containerId="my-container"  // Custom container ID
  onReady={() => {}}          // Called when IDE is ready
  onError={(err) => {}}       // Called on error
/>
```

## Disable Shadow DOM

If you need to disable Shadow DOM isolation:

```html
<div id="my-ide" data-shadow="false" style="width: 100%; height: 700px;"></div>
```

## Demo

See `embed-example.html` for a complete working example.

## Notes

- Minimum recommended container height: 400px
- For full functionality, ensure your server sends these headers:
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Opener-Policy: same-origin`
- The embed version is built automatically when deploying to GitHub Pages
