// src/threejs_animation.js

import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';

// Definição do ShockwaveShader (pode ficar fora da função, pois não depende do DOM)
const ShockwaveShader = {
    uniforms: {
        tDiffuse: { value: null },
        center: { value: new THREE.Vector2(0.5, 0.5) },
        time: { value: 0.0 },
        maxRadius: { value: 1.0 },
        amplitude: { value: 0.1 },
        speed: { value: 0.3 },
        width: { value: 0.3 },
        aspect: { value: 1.0 },
        smoothing: { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        #define PI 3.14159265359
        uniform sampler2D tDiffuse;
        uniform vec2 center;
        uniform float time;
        uniform float maxRadius;
        uniform float amplitude;
        uniform float speed;
        uniform float width;
        uniform float aspect;
        uniform float smoothing;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            vec2 aspectUV = vec2((uv.x - center.x) * aspect, uv.y - center.y);
            float dist = length(aspectUV);
            float wave = 0.0;
            float t = mod(time * speed, maxRadius + width);
            if (dist < t && dist > t - width) {
                float edgeDist = abs(dist - (t - width / 2.0)) / (width / 2.0);
                float smoothFactor = smoothstep(1.0 - smoothing, 1.0, edgeDist);
                wave = amplitude * sin((dist - t + width) / width * PI * 2.0) * (1.0 - smoothFactor);
            }
            uv += normalize(aspectUV) * wave;
            gl_FragColor = texture2D(tDiffuse, uv);
        }
    `
};

// Declare as variáveis no escopo superior (ou seja, fora de initThreeJS) para que
// as funções animate e onWindowResize possam acessá-las.
// Mas inicialize-as DENTRO de initThreeJS.
let container, canvas, renderer, scene, camera, rotatingGroup, stars;
let composer, bloomPass, shockwavePass; // Variáveis de pós-processamento
let shockwaveActive = false;
let shockwaveStartTime = 0;
let shockwaveDuration = 10;

// === FUNÇÃO DE REDIMENSIONAMENTO ===
// Esta função pode ser declarada aqui, mas só será chamada depois que tudo for inicializado.
function onWindowResize() {
    // Adicione verificações de nulidade para garantir que os objetos existam antes de usá-los
    if (!container || !camera || !renderer || !composer || !bloomPass || !shockwavePass) {
        console.warn('Three.js: Objetos não inicializados completamente para redimensionar.');
        return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
        console.warn('Three.js: Container tem dimensões zero, pulando redimensionamento.');
        return;
    }

    camera.aspect = width / height;
    
    const fov = camera.fov * ( Math.PI / 180 ); 
    const objectSize = 1.5; 
    let distance = objectSize / ( 2 * Math.tan( fov / 2 ) );

    if (width / height < 1) { 
        const aspectCompensation = (1 / (width / height));
        camera.position.z = distance * aspectCompensation * 1.5; 
    } else { 
        camera.position.z = distance * 1.5; 
    }
    
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    bloomPass.setSize(width, height);
    shockwavePass.uniforms.aspect.value = width / height;
}

// === FUNÇÃO DE ANIMAÇÃO ===
// Esta função também pode ser declarada aqui, mas só funcionará depois da inicialização.
function animate() {
    requestAnimationFrame(animate);

    if (rotatingGroup) { 
        rotatingGroup.rotation.x += 0.002;
        rotatingGroup.rotation.y += 0.001;
    }

    if (shockwaveActive) {
        const elapsedTime = performance.now() / 1000 - shockwaveStartTime;
        if (elapsedTime < shockwaveDuration) {
            if (shockwavePass && shockwavePass.uniforms) {
                shockwavePass.uniforms.time.value = elapsedTime;
            }
        } else {
            shockwaveActive = false;
            if (shockwavePass && shockwavePass.uniforms) {
                shockwavePass.uniforms.time.value = 0.0;
            }
        }
    }
    
    if (composer) { 
        composer.render();
    }
}


// --- FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO (EXPORTADA) ---
// TODO o código que inicializa os objetos Three.js e interage com o DOM deve estar AQUI.
export function initThreeJS() {
    // === OBTENÇÃO DE ELEMENTOS DO DOM (AGORA SEGURO PARA FAZER AQUI) ===
    container = document.getElementById('threejs-background-container');
    canvas = document.querySelector('#goo-canvas');

    if (!container || !canvas) {
        console.error('Three.js: Container ou Canvas não encontrado. A inicialização falhou.');
        return; // Sai da função se os elementos não estiverem no DOM
    }

    // === RENDERER ===
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding; 

    // === CENA ===
    scene = new THREE.Scene();
    scene.background = null; 

    // === CÂMERA ===
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100); 
    camera.position.z = 5;

    // === LUZ ===
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    // === GRUPO ROTATIVO ===
    rotatingGroup = new THREE.Group();
    scene.add(rotatingGroup); 

    // === ESTRELAS ===
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starsPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
        starsPositions[i] = (Math.random() - 0.5) * 200;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
        color: 0x2CE1C6,
        size: 0.1,
        sizeAttenuation: true
    });
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // === ICOSAEDROS / ESFERA PRINCIPAL ===
    const innerGeometry = new THREE.IcosahedronGeometry(2, 1);
    const innerMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.5,
        metalness: 1,
        flatShading: true,
        transparent: true,
        opacity: 0.7
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    rotatingGroup.add(innerMesh); 
    
    const outerGeometry = new THREE.IcosahedronGeometry(2, 1);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.1
    });
    const wireframeMesh = new THREE.Mesh(outerGeometry, wireframeMaterial);
    rotatingGroup.add(wireframeMesh); 
    
    const positions = [];
    const posAttr = outerGeometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 4));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x2E86D0,
        size: 0.025
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    rotatingGroup.add(particles); 
    
    // === PÓS-PROCESSAMENTO ===
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(container.clientWidth, container.clientHeight), 
        1.5,
        0.4,
        0.05
    );
    composer.addPass(bloomPass);

    shockwavePass = new ShaderPass(ShockwaveShader);
    shockwavePass.renderToScreen = true;
    composer.addPass(shockwavePass);

    // === EVENTO DE DOUBLE CLICK (AGORA DENTRO DA INICIALIZAÇÃO) ===
    window.addEventListener('dblclick', (event) => {
        const rect = container.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom) {
            
            const mouseX = (event.clientX - rect.left) / rect.width;
            const mouseY = 1.0 - (event.clientY - rect.top) / rect.height;
            
            shockwavePass.uniforms.center.value.set(mouseX, mouseY);
            shockwaveActive = true;
            shockwaveStartTime = performance.now() / 1000;
            shockwavePass.uniforms.time.value = 0.0;
        }
    });

    // === CHAMADAS INICIAIS ===
    onWindowResize(); // Define o tamanho inicial
    window.addEventListener('resize', onWindowResize); // Listener para redimensionamento
    animate(); // Inicia o loop de animação (que agora pode usar os objetos inicializados)
}

// Nota: as chamadas onWindowResize(); e animate(); no final do arquivo (fora da função initThreeJS)
// devem ser removidas ou não estarão mais lá, pois elas agora são chamadas DENTRO de initThreeJS.
// Se você tinha dat.gui ou outros elementos de UI que não são para produção,
// certifique-se de que estão comentados ou removidos.