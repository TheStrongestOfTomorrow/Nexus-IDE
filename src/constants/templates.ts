export const GRAPHICS_TEMPLATES = {
  webgl: {
    name: 'WebGL Basic',
    files: [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
    <title>WebGL Basic</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; }
        canvas { width: 100vw; height: 100vh; display: block; }
    </style>
</head>
<body>
    <canvas id="glCanvas"></canvas>
    <script src="main.js"></script>
</body>
</html>`
      },
      {
        name: 'main.js',
        content: `const canvas = document.querySelector('#glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL not supported');
}

// Vertex shader program
const vsSource = \`
    attribute vec4 aVertexPosition;
    void main() {
        gl_Position = aVertexPosition;
    }
\`;

// Fragment shader program
const fsSource = \`
    void main() {
        gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);
    }
\`;

function initShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const vertexShader = initShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = initShader(gl, gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

const positions = [
    -0.5,  0.5,
     0.5,  0.5,
    -0.5, -0.5,
     0.5, -0.5,
];

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const positionAttributeLocation = gl.getAttribLocation(program, 'aVertexPosition');
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);`
      }
    ]
  },
  threejs: {
    name: 'Three.js Starter',
    files: [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
    <title>Three.js Starter</title>
    <style>
        body { margin: 0; overflow: hidden; }
    </style>
</head>
<body>
    <script type="importmap">
      {
        "imports": {
          "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
        }
      }
    </script>
    <script type="module" src="main.js"></script>
</body>
</html>`
      },
      {
        name: 'main.js',
        content: `import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});`
      }
    ]
  },
  webgpu: {
    name: 'WebGPU (Next-Gen)',
    files: [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
    <title>WebGPU Basic</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; }
        canvas { width: 100vw; height: 100vh; display: block; }
    </style>
</head>
<body>
    <canvas id="gpuCanvas"></canvas>
    <script src="main.js"></script>
</body>
</html>`
      },
      {
        name: 'main.js',
        content: `async function init() {
    if (!navigator.gpu) {
        alert("WebGPU not supported on this browser.");
        return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const canvas = document.querySelector("#gpuCanvas");
    const context = canvas.getContext("webgpu");

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    const module = device.createShaderModule({
        label: "our hardcoded red triangle shaders",
        code: \`
            @vertex fn vs(
                @builtin(vertex_index) vertexIndex : u32
            ) -> @builtin(position) vec4f {
                var pos = array<vec2f, 3>(
                    vec2f( 0.0,  0.5),
                    vec2f(-0.5, -0.5),
                    vec2f( 0.5, -0.5)
                );
                return vec4f(pos[vertexIndex], 0.0, 1.0);
            }

            @fragment fn fs() -> @location(0) vec4f {
                return vec4f(1, 0, 0, 1);
            }
        \`,
    });

    const pipeline = device.createRenderPipeline({
        label: "our hardcoded red triangle pipeline",
        layout: "auto",
        vertex: {
            module,
            entryPoint: "vs",
        },
        fragment: {
            module,
            entryPoint: "fs",
            targets: [{ format: presentationFormat }],
        },
    });

    const renderPassDescriptor = {
        label: "our basic canvas render pass",
        colorAttachments: [{
            view: undefined, // to be filled out every frame
            clearValue: [0.3, 0.3, 0.3, 1],
            loadOp: "clear",
            storeOp: "store",
        }],
    };

    function render() {
        renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

        const encoder = device.createCommandEncoder({ label: "our encoder" });
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.draw(3);
        pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        requestAnimationFrame(render);
    }

    render();
}

init();`
      }
    ]
  },
  wasm: {
    name: 'WASM (Rust/C++)',
    files: [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
    <title>WASM Basic</title>
</head>
<body>
    <h1>WASM Result: <span id="result">Loading...</span></h1>
    <script src="main.js"></script>
</body>
</html>`
      },
      {
        name: 'main.js',
        content: `// This example assumes you have a 'module.wasm' file.
// Since we are in a browser IDE, we mock the fetch and instantiation.
async function runWasm() {
    try {
        // In a real app, you'd fetch an actual .wasm file
        // const response = await fetch('module.wasm');
        // const bytes = await response.arrayBuffer();
        // const { instance } = await WebAssembly.instantiate(bytes);
        
        document.getElementById('result').textContent = "WebAssembly is ready to be loaded! (Upload a .wasm file to test)";
    } catch (err) {
        document.getElementById('result').textContent = "Error: " + err.message;
    }
}

runWasm();`
      }
    ]
  },
  nextjs: {
    name: 'Next.js (App Router)',
    files: [
      {
        name: 'app/page.tsx',
        content: `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Welcome to Next.js</h1>
      <p className="mt-4 text-xl">Get started by editing app/page.tsx</p>
    </main>
  )
}`
      },
      {
        name: 'app/layout.tsx',
        content: `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`
      }
    ]
  },
  vue: {
    name: 'Vue.js 3',
    files: [
      {
        name: 'App.vue',
        content: `<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <div class="vue-app">
    <h1>Vue 3 + Vite</h1>
    <button @click="count++">count is {{ count }}</button>
  </div>
</template>

<style scoped>
.vue-app { text-align: center; padding: 2rem; }
</style>`
      }
    ]
  },
  svelte: {
    name: 'Svelte',
    files: [
      {
        name: 'App.svelte',
        content: `<script>
  let count = 0;
</script>

<main>
  <h1>Svelte + Vite</h1>
  <button on:click={() => count += 1}>
    count is {count}
  </button>
</main>

<style>
  main { text-align: center; padding: 1em; }
</style>`
      }
    ]
  },
  tailwind: {
    name: 'Tailwind CSS Starter',
    files: [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white min-h-screen flex items-center justify-center">
    <div class="max-w-md p-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
        <h1 class="text-3xl font-bold text-emerald-400 mb-4">Nexus + Tailwind</h1>
        <p class="text-slate-400 leading-relaxed">
            Ready to build something beautiful with utility-first CSS.
        </p>
        <button class="mt-6 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-full font-bold transition-all">
            Get Started
        </button>
    </div>
</body>
</html>`
      }
    ]
  }
};
