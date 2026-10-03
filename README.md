# Dentista Morales & Asociados · Clínica Dental
### Web Sanitaria con Diseño Humano (Anti-IA) & Experiencia 3D Scroll Storytelling (Invisalign®)

Sitio web completo para clínica dental con enfoque en conversión (CRO), cumplimiento riguroso de RGPD / publicidad sanitaria, optimización para Core Web Vitals y una sección interactiva de **Scroll Storytelling 3D** con alineadores invisibles.

---

## 🌟 Características Principales

1. **Diseño Visual Anti-Plantilla (Anti-IA):**
   - Rompe con los patrones típicos de IA (cero glassmorphism, cero gradientes neón morado/azul, cero tarjetas flotantes con sombras perfectas).
   - Paleta orgánica inspirada en tonos tierra, verde bosque (`#203B31`), terracota (`#C85A32`), mostaza (`#E5A93C`) y crema avena (`#FAF7F2`).
   - Tipografía con carácter editorial: **Fraunces** + **Plus Jakarta Sans** + **Caveat** (manuscrita).
   - Asimetría controlada, texturas de grano sutiles y bordes analógicos imperfectos.

2. **Copywriting Médico con Voz Humana y Transparencia:**
   - Comunicación ética y cercana sin tecnicismos vacíos.
   - Tabla comparativa de **Beneficios vs. Riesgos reales** en tratamientos de alto valor.
   - Perfiles del equipo médico con números de colegiado oficiales y notas personales auténticas.

3. **Experiencia 3D Scroll Storytelling (Invisalign®):**
   - Ubicación: [invisalign.html](invisalign.html) (también accesible vía `ortodoncia-invisible.html`).
   - Modelos GLB independientes para **Arcada Superior (Maxilar)** y **Arcada Inferior (Mandíbula)**.
   - 5 fases de storytelling sincronizadas con el scroll (GSAP ScrollTrigger):
     1. *Así es tu sonrisa antes del tratamiento.*
     2. *Escaneamos tu boca en 3D y planificamos cada movimiento.*
     3. *Cada alineador mueve tus dientes milímetros exactos.*
     4. *En 6 a 18 meses, sin brackets y sin que nadie lo note.*
     5. *Sonrisa alineada. Cita tu valoración gratuita.*
   - **Reglas de rendimiento estrictas:**
     - Vanilla JS (sin React Three Fiber ni sobrecoste de librerías).
     - Decodificación Draco multihilo en Web Workers (`workerLimit = 2`).
     - Precompilación de shaders con `renderer.compileAsync` y warm-up frames.
     - Material `MeshStandardMaterial` optimizado para aspecto translúcido SmartTrack® sin la penalización de transmisión GPU.
     - Cero sombras dinámicas pesadas. DPR acotado a 1.5 en desktop y 1.1 en móvil.
     - Pausado automático del render cuando la sección sale del viewport (IntersectionObserver).
     - Flag global de desactivación rápida: `window.ENABLE_INVISALIGN_3D = true`.
     - Soporte para `prefers-reduced-motion` con fallback estático.

4. **SEO YMYL, E-E-A-T y Cumplimiento Legal:**
   - Datos estructurados completos en JSON-LD: `Dentist`, `MedicalBusiness`, `Physician`, `MedicalProcedure` y `FAQPage`.
   - Formulario de contacto con checkboxes de consentimiento RGPD / LFPDPPP granulares y separados.
   - Identificación sanitaria visible: Registro NICA 12345 y colegiados COEM.

---

## 📁 Estructura del Proyecto

```
├── index.html                    # Página Principal (Home) con los 13 bloques
├── invisalign.html               # Landing especializada con simulación 3D de ortodoncia
├── ortodoncia-invisible.html     # Redirección canónica amigable a invisalign.html
├── implantes.html                # Landing de Implantes Dentales (tabla pros/riesgos, timeline)
├── equipo.html                   # Perfiles del Equipo Médico colegiado
├── contacto.html                 # Página de Contacto con formulario RGPD, mapa y urgencias
├── 404.html                      # Página 404 creativa ("Este diente se ha caído")
├── styles.css                    # Estilos globales y sistema de diseño artesanal
├── scripts.js                    # Microinteracciones, easter eggs, estado de clínica en vivo
├── sitemap.xml                   # Mapa del sitio XML
├── schema-structured-data.json   # Esquema JSON-LD standalone
├── css/
│   └── invisalign.css            # Estilos dedicados a la sección 3D
├── js/
│   └── invisalign-story.js       # Motor 3D Three.js + GSAP ScrollTrigger
├── modelos/                      # Modelos 3D originales
│   ├── arcada_superior.glb
│   └── arcada_inferior.glb
└── assets/
    ├── models/                   # Modelos servidos a la web
    ├── draco/                    # Decodificadores locales de Draco (WASM y Web Workers)
    └── vendor/                   # Librerías Three.js y GSAP locales
```

---

## 🚀 Cómo Probar la Web en Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/EcoChip/dentaltest2.git
   cd dentaltest2
   ```

2. Inicia un servidor web local (por ejemplo con Python):
   ```bash
   python -m http.server 8000
   ```

3. Abre en tu navegador:
   - **Página Principal:** [http://localhost:8000/index.html](http://localhost:8000/index.html)
   - **Simulación 3D Invisalign:** [http://localhost:8000/invisalign.html](http://localhost:8000/invisalign.html)
   - **Implantes:** [http://localhost:8000/implantes.html](http://localhost:8000/implantes.html)

---

## 🕹️ Easter Eggs para Curiosos

1. **Logotipo:** Haz clic 5 veces seguidas en el logotipo del diente en la esquina superior izquierda.
2. **Consola:** Abre las herramientas de desarrollador (`F12`) y revisa la pestaña *Console*.
3. **Footer Dinámico:** Recarga la página y observa cómo cambia la frase artesanal en el pie de página.
