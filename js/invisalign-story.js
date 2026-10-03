/**
 * ============================================================================
 * INVISALIGN 3D SCROLL STORYTELLING - MOTOR VANILLA THREE.JS + GSAP
 * Clínica Dental Dr. Morales & Asociados · Ciudad de México (CDMX)
 * ============================================================================
 * 
 * DIRECTRICES DE RENDIMIENTO APLICADAS:
 * 1. Zero-frameworks (Vanilla JS). Cero sobrecoste de React Three Fiber ni re-renders.
 * 2. Un único bucle de renderizado enlazado a gsap.ticker, pausado automáticamente fuera del viewport.
 * 3. Mutación directa de propiedades Three.js (position, rotation, scale) sin instanciación en runtime.
 * 4. DRACOLoader con decodificación multihilo en Web Workers (workerLimit = 2).
 * 5. Precompilación GPU mediante renderer.compileAsync y 2 frames de calentamiento previo.
 * 6. Material MeshStandardMaterial optimizado con simulación SmartTrack® sin la penalización de transmisión.
 * 7. DPR acotado a 1.5 en desktop y 1.1 en móvil. Cero sombras dinámicas (shadowMap = false).
 * 8. Interfaz desacoplada con aceleración por hardware (transform3d y opacity).
 * 9. Flag global de reversión rápida: window.ENABLE_INVISALIGN_3D
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// FLAG GLOBAL DE REVERSIÓN / ACTIVACIÓN
// Si se cambia a false, la experiencia 3D se desactiva instantáneamente y muestra
// la versión estática sin cargar Three.js ni los modelos GLB.
// ----------------------------------------------------------------------------
window.ENABLE_INVISALIGN_3D = true;

(() => {
  'use strict';

  // Detección de preferencias del usuario y móvil
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  // Referencias DOM
  const section = document.getElementById('invisalign-3d-section');
  const canvas = document.getElementById('invisalign-canvas');
  const poster = document.getElementById('invisalign-poster');
  const progressBar = document.getElementById('invisalign-progress-bar');
  const progressText = document.getElementById('invisalign-progress-text');
  const staticFallback = document.getElementById('invisalign-static-fallback');
  const cards = document.querySelectorAll('.story-card');
  const dots = document.querySelectorAll('.story-dot');

  // Si el flag está desactivado o el usuario prefiere movimiento reducido, activar fallback
  if (!window.ENABLE_INVISALIGN_3D || prefersReducedMotion) {
    activateStaticFallback();
    return;
  }

  if (!section || !canvas) {
    return;
  }

  function activateStaticFallback() {
    if (poster) poster.classList.add('is-hidden');
    if (canvas) canvas.style.display = 'none';
    if (staticFallback) staticFallback.style.display = 'block';
    cards.forEach(card => card.classList.add('is-active'));
  }

  // --------------------------------------------------------------------------
  // CARGA PEREZOSA (LAZY INITIALIZATION CON INTERSECTION OBSERVER)
  // No se inicializa WebGL ni se descargan los GLB hasta que la sección está cerca
  // --------------------------------------------------------------------------
  let isInitialized = false;
  let isIntersecting = false;

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isIntersecting = entry.isIntersecting;

      if (entry.isIntersecting && !isInitialized) {
        isInitialized = true;
        initInvisalign3D();
      }
    });
  }, {
    rootMargin: '350px 0px', // Precarga con margen amplio antes de entrar al viewport
    threshold: 0.01
  });

  sectionObserver.observe(section);

  // --------------------------------------------------------------------------
  // VARIABLES DEL MUNDO 3D
  // --------------------------------------------------------------------------
  let scene, camera, renderer;
  let sceneGroup;      // Contenedor global de rotación/posición del conjunto
  let upperPivot;      // Pivot exclusivo de la Arcada Superior (Maxilar)
  let lowerPivot;      // Pivot exclusivo de la Arcada Inferior (Mandíbula)
  let upperMeshGroup;  // Modelo GLTF superior
  let lowerMeshGroup;  // Modelo GLTF inferior

  // Tracking de progreso de carga (2 archivos independientes)
  let progressUpper = 0;
  let progressLower = 0;

  async function initInvisalign3D() {
    try {
      // 1. Escena
      scene = new THREE.Scene();

      // 2. Cámara (FOV moderado para evitar distorsión de perspectiva)
      const aspect = section.clientWidth / section.clientHeight;
      camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50);
      camera.position.set(0, 0, isMobile ? 4.2 : 3.4);

      // 3. Renderer de alto rendimiento
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: !isMobile, // Desactivar antialias en móvil para máxima tasa de cuadros
        powerPreference: 'high-performance'
      });
      renderer.setSize(section.clientWidth, section.clientHeight, false);
      // Regla de rendimiento: DPR limitado a 1.5 en desktop y 1.1 en móvil
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.1 : 1.5));
      renderer.shadowMap.enabled = false; // Sin coste de sombras dinámicas en GPU
      renderer.outputEncoding = THREE.sRGBEncoding;

      // 4. Iluminación clínica optimizada (sin sombras de render target)
      // Luz ambiental suave para claridad en todas las caras
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      // Luz direccional frontal/superior (key light clínica)
      const keyLight = new THREE.DirectionalLight(0xd9f2fa, 1.1);
      keyLight.position.set(2, 4, 3);
      scene.add(keyLight);

      // Luz de relleno lateral con tinte menta (#0d9488) para acento visual
      const mintRimLight = new THREE.DirectionalLight(0x0d9488, 0.65);
      mintRimLight.position.set(-3, -2, -2);
      scene.add(mintRimLight);

      // 5. Grupos de jerarquía independiente
      sceneGroup = new THREE.Group();
      scene.add(sceneGroup);

      // Posición y orientación base centrada
      sceneGroup.position.set(isMobile ? 0 : 0.45, 0, 0); // Ligeramente desplazado a la derecha en escritorio para dar espacio al texto

      upperPivot = new THREE.Group();
      lowerPivot = new THREE.Group();
      sceneGroup.add(upperPivot);
      sceneGroup.add(lowerPivot);

      // 6. Carga de modelos con DRACOLoader multihilo
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('assets/draco/');
      dracoLoader.setWorkerLimit(2); // Dos hilos en Web Workers para no congelar el main thread

      const gltfLoader = new THREE.GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);

      // Material SmartTrack® translúcido clínico optimizado
      // Sustituye MeshPhysicalMaterial por MeshStandardMaterial con DoubleSide y transparencia
      const smartTrackMaterial = new THREE.MeshStandardMaterial({
        color: 0xebf8fa,
        roughness: 0.14,
        metalness: 0.08,
        transparent: true,
        opacity: 0.84,
        depthWrite: true,
        side: THREE.DoubleSide
      });

      // Función auxiliar para procesar los meshes cargados
      const processLoadedScene = (gltf) => {
        const root = gltf.scene || gltf.scenes[0];
        root.traverse((child) => {
          if (child.isMesh) {
            child.material = smartTrackMaterial;
            child.castShadow = false;
            child.receiveShadow = false;
            child.frustumCulled = true;
          }
        });
        return root;
      };

      // Carga en paralelo de ambas arcadas
      const loadUpperPromise = new Promise((resolve, reject) => {
        gltfLoader.load(
          'assets/models/arcada_superior.glb',
          (gltf) => {
            upperMeshGroup = processLoadedScene(gltf);
            upperPivot.add(upperMeshGroup);
            progressUpper = 100;
            updateLoadingUI();
            resolve();
          },
          (xhr) => {
            if (xhr.total > 0) {
              progressUpper = Math.round((xhr.loaded / xhr.total) * 100);
              updateLoadingUI();
            }
          },
          reject
        );
      });

      const loadLowerPromise = new Promise((resolve, reject) => {
        gltfLoader.load(
          'assets/models/arcada_inferior.glb',
          (gltf) => {
            lowerMeshGroup = processLoadedScene(gltf);
            lowerPivot.add(lowerMeshGroup);
            progressLower = 100;
            updateLoadingUI();
            resolve();
          },
          (xhr) => {
            if (xhr.total > 0) {
              progressLower = Math.round((xhr.loaded / xhr.total) * 100);
              updateLoadingUI();
            }
          },
          reject
        );
      });

      await Promise.all([loadUpperPromise, loadLowerPromise]);

      // Liberar recursos del DracoLoader una vez descomprimidos
      dracoLoader.dispose();

      // Posicionamiento anatómico inicial (mordida cerrada)
      // Ajuste de escala responsiva
      const baseScale = isMobile ? 0.78 : 1.0;
      sceneGroup.scale.set(baseScale, baseScale, baseScale);

      // Estado 0 inicial
      setStorytellingState(0);

      // 7. Precompilación GPU y Warm-up de 2 frames
      // Regla de rendimiento: compilar shaders antes de revelar canvas al usuario
      if (renderer.compileAsync) {
        await renderer.compileAsync(scene, camera);
      } else {
        renderer.compile(scene, camera);
      }

      // Warm-up de dos cuadros para forzar el pipeline de la tarjeta gráfica
      renderer.render(scene, camera);
      renderer.render(scene, camera);

      // Ocultar poster de carga y mostrar canvas fluidamente
      if (poster) poster.classList.add('is-hidden');
      canvas.classList.add('is-ready');

      // 8. Integración con bucle único GSAP Ticker
      gsap.ticker.add(renderScene);

      // 9. Configuración de GSAP ScrollTrigger
      initScrollTrigger();

      // 10. Listener de Resize desacoplado con debounce
      setupResizeHandler();

    } catch (err) {
      console.warn('[Invisalign 3D] Error inicializando Three.js. Activando fallback estático:', err);
      activateStaticFallback();
    }
  }

  function updateLoadingUI() {
    const totalProgress = Math.round((progressUpper + progressLower) / 2);
    if (progressBar) progressBar.style.width = `${totalProgress}%`;
    if (progressText) progressText.textContent = `Cargando alineadores 3D (${totalProgress}%)...`;
  }

  // --------------------------------------------------------------------------
  // BUCLE DE RENDER ÚNICO (GSAP TICKER)
  // Regla de rendimiento: Sin RAF propio competidor. Pausa fuera de pantalla.
  // --------------------------------------------------------------------------
  function renderScene() {
    if (!isIntersecting || !renderer || !scene || !camera) return;
    renderer.render(scene, camera);
  }

  // --------------------------------------------------------------------------
  // CONFIGURACIÓN DE SCROLLTRIGGER & ETAPAS DE STORYTELLING
  // --------------------------------------------------------------------------
  let scrollTriggerInstance = null;

  function initScrollTrigger() {
    if (typeof ScrollTrigger === 'undefined') {
      console.warn('[Invisalign 3D] ScrollTrigger no está disponible.');
      return;
    }

    scrollTriggerInstance = ScrollTrigger.create({
      trigger: '#invisalign-3d-section',
      start: 'top top',
      end: '+=350%',
      pin: true,
      anticipatePin: 1,
      scrub: 0.6, // Suavizado de inercia ligero sin lag
      onUpdate: (self) => {
        setStorytellingState(self.progress);
      }
    });
  }

  // --------------------------------------------------------------------------
  // MUTACIÓN DIRECTA DE PROPIEDADES (ESTADOS 3D SIN GARBAGE COLLECTION)
  // Progreso normalizado: 0.0 -> 1.0
  // Etapa 1: 0.00 - 0.20 | Así es tu sonrisa antes
  // Etapa 2: 0.20 - 0.40 | Escaneo 3D y separación de arcadas
  // Etapa 3: 0.40 - 0.65 | Fuerzas controladas y desplazamiento milimétrico
  // Etapa 4: 0.65 - 0.85 | Proceso estético invisible
  // Etapa 5: 0.85 - 1.00 | Sonrisa final alineada en mordida ideal
  // --------------------------------------------------------------------------
  function lerp(start, end, t) {
    return start + (end - start) * Math.min(Math.max(t, 0), 1);
  }

  function setStorytellingState(progress) {
    if (!upperPivot || !lowerPivot || !sceneGroup) return;

    let activeStepIndex = 0;

    if (progress < 0.20) {
      // ----------------------------------------------------------------------
      // ETAPA 1: Introducción (Mordida cerrada)
      // ----------------------------------------------------------------------
      activeStepIndex = 0;
      const t = progress / 0.20;

      // Arcadas en contacto oclusal anatómico inicial
      upperPivot.position.y = lerp(0.04, 0.04, t);
      lowerPivot.position.y = lerp(-0.04, -0.04, t);

      upperPivot.rotation.x = lerp(0, 0.02, t);
      lowerPivot.rotation.x = lerp(0, -0.02, t);

      sceneGroup.rotation.y = lerp(0, 0.15, t);
      sceneGroup.rotation.x = 0.05;
      sceneGroup.position.z = lerp(0, 0.1, t);

    } else if (progress < 0.40) {
      // ----------------------------------------------------------------------
      // ETAPA 2: Escaneo 3D y separación maxilar / mandibular
      // ----------------------------------------------------------------------
      activeStepIndex = 1;
      const t = (progress - 0.20) / 0.20;

      // Separación vertical de arcadas para mostrar caras oclusales y grosor del alineador
      upperPivot.position.y = lerp(0.04, 0.58, t);
      lowerPivot.position.y = lerp(-0.04, -0.52, t);

      // Inclinación anatómica para apreciar el interior de cada arcada
      upperPivot.rotation.x = lerp(0.02, -0.35, t);
      lowerPivot.rotation.x = lerp(-0.02, 0.35, t);

      sceneGroup.rotation.y = lerp(0.15, 0.52, t);
      sceneGroup.rotation.x = lerp(0.05, 0.12, t);
      sceneGroup.position.z = lerp(0.1, 0.25, t);

    } else if (progress < 0.65) {
      // ----------------------------------------------------------------------
      // ETAPA 3: Alineadores en acción (Micro-movimientos y fuerzas SmartTrack)
      // ----------------------------------------------------------------------
      activeStepIndex = 2;
      const t = (progress - 0.40) / 0.25;

      // Simulación de alineación: ligera oscilación milimétrica controlada
      const microVibe = Math.sin(t * Math.PI * 4) * 0.02;

      upperPivot.position.y = lerp(0.58, 0.38, t) + microVibe;
      lowerPivot.position.y = lerp(-0.52, -0.34, t) - microVibe;

      upperPivot.rotation.x = lerp(-0.35, -0.15, t);
      lowerPivot.rotation.x = lerp(0.35, 0.15, t);

      // Rotación a perfil lateral para ver encaje interproximal
      sceneGroup.rotation.y = lerp(0.52, 1.15, t);
      sceneGroup.rotation.x = lerp(0.12, 0.04, t);
      sceneGroup.position.z = 0.25;

    } else if (progress < 0.85) {
      // ----------------------------------------------------------------------
      // ETAPA 4: Discreción total y perspectiva estética 360°
      // ----------------------------------------------------------------------
      activeStepIndex = 3;
      const t = (progress - 0.65) / 0.20;

      // Las arcadas comienzan a converger hacia su posición final
      upperPivot.position.y = lerp(0.38, 0.12, t);
      lowerPivot.position.y = lerp(-0.34, -0.10, t);

      upperPivot.rotation.x = lerp(-0.15, -0.04, t);
      lowerPivot.rotation.x = lerp(0.15, 0.04, t);

      // Giro suave hacia el otro flanco para apreciar la transparencia completa
      sceneGroup.rotation.y = lerp(1.15, -0.45, t);
      sceneGroup.rotation.x = 0.04;
      sceneGroup.position.z = lerp(0.25, 0.1, t);

    } else {
      // ----------------------------------------------------------------------
      // ETAPA 5: Sonrisa alineada final (Mordida perfecta cerrada)
      // ----------------------------------------------------------------------
      activeStepIndex = 4;
      const t = (progress - 0.85) / 0.15;

      // Encaje perfecto de oclusión armónica
      upperPivot.position.y = lerp(0.12, 0.015, t);
      lowerPivot.position.y = lerp(-0.10, -0.015, t);

      upperPivot.rotation.set(0, 0, 0);
      lowerPivot.rotation.set(0, 0, 0);

      // Vista frontal con un ángulo de orgullo estético sutil
      sceneGroup.rotation.y = lerp(-0.45, 0.06, t);
      sceneGroup.rotation.x = 0.02;
      sceneGroup.position.z = lerp(0.1, 0.2, t);
    }

    // Actualización de tarjetas de texto y puntos indicadores
    updateDOMCards(activeStepIndex);
  }

  // --------------------------------------------------------------------------
  // ACTUALIZACIÓN DE TARJETAS HTML (MUTACIÓN DE CLASES LIGERAS)
  // Regla de rendimiento: No tocar propiedades de layout (top/left/width).
  // Solo conmutar clases CSS que manejan transform3d y opacity.
  // --------------------------------------------------------------------------
  let lastActiveIndex = -1;

  function updateDOMCards(activeIndex) {
    if (activeIndex === lastActiveIndex) return;
    lastActiveIndex = activeIndex;

    cards.forEach((card, idx) => {
      card.classList.toggle('is-active', idx === activeIndex);
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === activeIndex);
    });
  }

  // --------------------------------------------------------------------------
  // MANEJO DE RESIZE COORDINADO (CON DEBOUNCE PARA EVITAR JANK EN MÓVIL)
  // --------------------------------------------------------------------------
  function setupResizeHandler() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!renderer || !camera || !section) return;

        const w = section.clientWidth;
        const h = section.clientHeight;
        const isMobileNow = w < 768;

        camera.aspect = w / h;
        camera.position.z = isMobileNow ? 4.2 : 3.4;
        camera.updateProjectionMatrix();

        renderer.setSize(w, h, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileNow ? 1.1 : 1.5));

        const baseScale = isMobileNow ? 0.78 : 1.0;
        if (sceneGroup) {
          sceneGroup.scale.set(baseScale, baseScale, baseScale);
          sceneGroup.position.x = isMobileNow ? 0 : 0.45;
        }

        if (scrollTriggerInstance) {
          ScrollTrigger.refresh();
        }
      }, 150);
    }, { passive: true });
  }

})();
