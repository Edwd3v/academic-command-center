# Orgi → Dashboard transition
Branch: `feature/orgi-dashboard-transition` · Strategy: ask-on-risk / feature-branch-chain (chosen by user) · Runner: `node tests/orgi-transition.cjs` and existing Node suites.
Objective: demonstrate an honest, accessible journey from Orgi's panel to the existing dashboard. Forecast: ~400 authored lines; assess slice strategy before commit.

## Specs
- S1: “en lugar de acceder inmediatamente al dashboard, debería encontrarse con una pantalla intermedia dedicada al asistente.” Enter from “Abrir centro de control”; keep direct mail-to-dashboard navigation and existing dashboard intact. Verify browser navigation.
- S2: “Orgi debe ser el protagonista visual” and “un mensaje breve que lo invite a comenzar la organización de su espacio de trabajo, acompañado de un botón principal de llamado a la acción.” Verify responsive screen, keyboard focus and return action.
- S3: “No quiero que se perciba como una pantalla de carga convencional.” Illustrate “cómo Orgi toma la información inicialmente desorganizada de OGL, la analiza, identifica lo importante y la transforma en un espacio más claro, estructurado y fácil de gestionar.” Verify sequential states, final confirmation, dashboard arrival, reduced-motion behavior and replay.
- S4: “Si la organización real de información todavía no está implementada, puedes utilizar una secuencia demostrativa claramente diferenciada de un procesamiento real. No presentes operaciones simuladas como si hubieran sido ejecutadas.” Verify explicit demo disclosure and unchanged persisted records.
- S5: “Conserva la identidad visual y la coherencia con la aplicación actual.” “Integra la transición dentro del flujo de navegación existente, sin afectar las funcionalidades actuales.” “El nombre correcto del asistente es **Orgi**.” Verify existing suites and no new dependency.
- S6: “El encabezado superior que contiene la esfera de color, el texto «Orgi | OGL» y el mensaje «Tu espacio, más claro».” “La etiqueta «UN MOMENTO CON ORGI» que aparece sobre el avatar.” “Los textos secundarios de carácter decorativo o promocional ubicados en los extremos de la pantalla.” “Los elementos de pie de página que hacen referencia a la demostración de OGL o utilizan mensajes como «Menos ruido, más dirección».” Remove these; keep explanatory disclosure and useful narrative labels.
- S7: “No desarrolles un avatar nuevo ni crees una representación alternativa.” “No necesitamos modificar ni ampliar sus expresiones faciales”. Reuse the original animated avatar DOM node and personality unchanged; move it into the scene and return it to Outlook/dashboard without duplicating or changing its normal behavior. Verify DOM identity, states, CSS sizing and restoration.
- S8: “Conserva las funcionalidades, rutas y comportamientos que ya funcionan correctamente.” Keep arrival, cancellation, replay, reduced-motion, direct contextual mail access, and demo disclosure.
- S9: “Debe incluir únicamente: - Orgi como protagonista visual principal - El título: "Hagamos espacio para lo importante." - Un botón principal: "Organizar mi espacio" - Un elemento mínimo para volver a la bandeja, preferiblemente como un ícono o acción secundaria muy discreta”. Hide cards, description and demo copy in the introduction; keep the existing animated node and functional return control.
- S10: “Una vez el usuario haga clic en "Organizar mi espacio", debe comenzar la experiencia de transformación.” “No quiero una sensación de ‘pantalla cambia por otra pantalla’ ni de ‘foto reemplazada por otra foto’.” Reveal the existing cards within the same scene with smooth progressive motion and continuous card rearrangement; retain the honest demo disclosure during the sequence and ready confirmation, with reduced-motion fallback.

## Tasks
- T1 (S1-S5): inline; complete; commit `8ad56a1`. One coherent transition with focused browser tests and existing suite. No writer trigger: one coupled behavior across shared markup/styles/events.
- T2 (S6-S8): inline; complete; commit `d7803fa`. Refined markup, scoped layout and existing launcher placement in one coupled unit. No writer trigger; shared launcher context and tests moved together.
- T3 (S9-S10): inline; complete; commit `624db4e`. Minimal invitation and continuous story motion in existing transition CSS/markup/JS plus browser checks. No writer trigger: one coupled behavior.

## Log
- L1 (2026-11-06): Cremos una rama desde main  adicional para introducir esta funcionalidad: ## Nueva experiencia de transición: Orgi → Dashboard

Quiero implementar una nueva experiencia de transición entre la presentación de **Orgi**, nuestro asistente virtual, y el dashboard de OGL, que ya se encuentra construido.

### Contexto actual

Actualmente, el usuario ingresa a la demostración de OGL, selecciona a Orgi y se despliega un panel lateral derecho con información e indicaciones sobre el asistente. Al finalizar este panel, aparece un botón llamado **«Abrir centro de control»**, que conduce directamente al dashboard.

Quiero transformar ese último paso en una experiencia más memorable, visualmente atractiva y coherente con la personalidad de Orgi.

### Experiencia deseada

Cuando el usuario termine de conocer a Orgi y decida continuar, en lugar de acceder inmediatamente al dashboard, debería encontrarse con una pantalla intermedia dedicada al asistente.

Esta pantalla debe transmitir cercanía, simplicidad y una sensación de acompañamiento. Orgi debe ser el protagonista visual, ubicado en una composición que destaque su personalidad y genere la sensación de estar interactuando con un asistente inteligente.

El usuario encontrará un mensaje breve que lo invite a comenzar la organización de su espacio de trabajo, acompañado de un botón principal de llamado a la acción. El texto exacto, la composición y los detalles visuales pueden definirse creativamente.

Al activar esta acción, comenzará una experiencia visual que represente cómo Orgi toma la información inicialmente desorganizada de OGL, la analiza, identifica lo importante y la transforma en un espacio más claro, estructurado y fácil de gestionar.

**No quiero que se perciba como una pantalla de carga convencional.** Quiero que sea un pequeño momento narrativo dentro de la aplicación, donde el usuario pueda comprender visualmente el valor de Orgi: convertir el desorden en organización.

Durante esta transición, Orgi puede expresar diferentes estados, acompañar el proceso y comunicar visualmente que está preparando el centro de control del usuario. El estilo, las animaciones y la forma de representar la transformación quedan a tu criterio creativo.

Una vez finalizado el proceso, debe existir un momento breve y satisfactorio de confirmación, que comunique que todo está listo. Posteriormente, el usuario será dirigido al dashboard existente.

### Intención de diseño

Busco una experiencia moderna, fluida, cuidada y con personalidad. Debe sentirse como parte natural del producto, no como una pantalla añadida artificialmente.

Puedes explorar libremente conceptos visuales como interfaces minimalistas, experiencias conversacionales, transformaciones de elementos, microinteracciones y recursos que refuercen el carácter de Orgi.

La transición debe generar una sensación de expectativa, confianza y satisfacción, sin resultar excesivamente larga, repetitiva o recargada.

### Consideraciones importantes

- **El dashboard ya existe:** no quiero rediseñarlo ni reconstruirlo.
- Conserva la identidad visual y la coherencia con la aplicación actual.
- Aprovecha los recursos, componentes y tecnologías que ya estén disponibles en el proyecto.
- Integra la transición dentro del flujo de navegación existente, sin afectar las funcionalidades actuales.
- El nombre correcto del asistente es **Orgi**.
- Esta experiencia está pensada especialmente para demostrar el valor del producto.
- Si la organización real de información todavía no está implementada, puedes utilizar una secuencia demostrativa claramente diferenciada de un procesamiento real. No presentes operaciones simuladas como si hubieran sido ejecutadas.
- Evita introducir dependencias innecesarias o complejidad técnica que no aporte valor a la experiencia.

### Libertad creativa

No quiero limitarte con una estructura visual rígida ni definir de antemano cada interacción.

**Analiza primero la implementación actual, comprende el recorrido existente y diseña la mejor experiencia de transición posible a partir de ese contexto.**

Tienes libertad para proponer y ejecutar las decisiones creativas que consideres adecuadas, siempre que mantengas el objetivo central: hacer que el paso desde Orgi hacia el dashboard se sienta como una transformación significativa, en la que el asistente organiza el espacio de trabajo del usuario antes de presentarle su centro de control.

El resultado debe ser una experiencia integrada, funcional, visualmente consistente y preparada para una demostración del producto.

- L2: Current panel button enters dashboard via `openDashboardForMail(null)` in `scripts/app.js`; mail entry uses `openDashboardForMail(mail)` and must stay direct. Shared launcher must remain a single node. CSS already has reduced-motion rules. T1 route inline: one coupled feature; no high-risk shared contract change intended.
- L3: RED: `node tests/orgi-transition.cjs` failed because the intermediate scene did not exist. GREEN: focused test passed after implementation. Final checks: `node tests/orgi-transition.cjs`, `node tests/orgi-dashboard.cjs`, `node tests/orgi-avatar.cjs`, `node tests/module-structure.cjs`, `git diff --check` all passed. Browser test covers data keys, repeated journey, cancellation, reduced motion, contextual mail entry and mobile overflow. No dependencies or persistence writes added. Risk: none. Forecast and final authored line count below 400, so no chained-delivery decision needed.
- L4: Work-unit commit `8ad56a1` contains behavior, tests, and feature spec. Native committed-only assessment against `e65e4c6`: medium, `review_due=false`, `review_due_reason=under_budget`; no candidate review launched. Reviewed boundary remains `e65e4c6` pending a later slice. No push or PR requested.
- L5 (2026-11-06): ## Refinamiento de la pantalla de transición Orgi → Dashboard

La pantalla de transición que implementaste tiene una buena base visual y quiero conservar su concepto general. Sin embargo, necesitamos simplificarla y mejorar la integración de Orgi con los componentes que ya existen en la aplicación.

### 1. Simplificación visual

Quiero eliminar algunos elementos secundarios que considero innecesarios:

- El encabezado superior que contiene la esfera de color, el texto «Orgi | OGL» y el mensaje «Tu espacio, más claro».
- La etiqueta «UN MOMENTO CON ORGI» que aparece sobre el avatar.
- Los textos secundarios de carácter decorativo o promocional ubicados en los extremos de la pantalla.
- Los elementos de pie de página que hacen referencia a la demostración de OGL o utilizan mensajes como «Menos ruido, más dirección».

El objetivo es reducir el ruido visual y conseguir una interfaz más limpia, en la que los elementos centrales tengan mayor presencia.

No es necesario eliminar todos los textos informativos. Conserva aquellos que realmente ayuden al usuario a comprender la acción que está realizando.

### 2. Reutilización del avatar existente de Orgi

Este es el cambio más importante.

Actualmente, la pantalla utiliza una representación estática de Orgi. Sin embargo, **ya existe un avatar animado de Orgi implementado en otras secciones del proyecto**, específicamente:

- En el simulador de Ublik.
- En el dashboard original.

Quiero que revises esas implementaciones y reutilices el avatar existente en esta nueva pantalla.

No desarrolles un avatar nuevo ni crees una representación alternativa. La intención es mantener una identidad visual y un comportamiento consistentes en toda la aplicación.

Puedes adaptar su tamaño, posición y presentación para que tenga mayor protagonismo en esta pantalla. Idealmente, Orgi debería verse más grande que en sus apariciones habituales, sin perder calidad visual ni alterar su comportamiento original.

Por ahora, **no necesitamos modificar ni ampliar sus expresiones faciales**. Reutiliza sus animaciones y expresiones actuales.

Si el avatar está implementado como un componente reutilizable, aprovéchalo. Si existen implementaciones duplicadas, evalúa la forma más adecuada de compartirlo sin afectar las secciones existentes.

### 3. Composición y jerarquía visual

Con la eliminación de los elementos secundarios y la incorporación del avatar animado, revisa la distribución del espacio.

Quiero que la interfaz se sienta más equilibrada, limpia e inmersiva.

Orgi debe tener una presencia visual importante, acompañado del mensaje principal y del botón «Organizar mi espacio».

La representación visual de cómo las comunicaciones, pendientes y compromisos se transforman en información organizada puede mantenerse, pero tienes libertad para ajustar su composición si mejora la experiencia.

Evita introducir nuevos elementos decorativos que vuelvan a saturar la pantalla.

### 4. Conservación del flujo existente

No quiero modificar el propósito ni el funcionamiento general de la transición.

Debe mantenerse el recorrido:

1. El usuario llega a la pantalla de bienvenida de Orgi.
2. Interactúa con «Organizar mi espacio».
3. Se presenta la experiencia de organización.
4. Se confirma la finalización.
5. Se accede al dashboard existente.

Conserva las funcionalidades, rutas y comportamientos que ya funcionan correctamente.

### 5. Criterio de implementación

Antes de realizar modificaciones, revisa los componentes actuales, particularmente el avatar utilizado en el simulador de Ublik y en el dashboard.

Prioriza la reutilización de código, la consistencia visual y la compatibilidad con la arquitectura actual.

No reconstruyas la pantalla desde cero si los cambios pueden resolverse refinando la implementación existente.

**Resultado esperado:** una versión más limpia y enfocada de la transición, con menos textos accesorios, mayor protagonismo de Orgi y el mismo avatar animado que ya conoce el usuario en otras secciones de OGL.
- L6: The Outlook launcher and dashboard sidebar already share the same `#orgi-launcher`/`#orgi-avatar` node; `initOrgiPersonality` initializes once on that node. The transition's `.transition-face` is separate static art. T2 moves the real node into a scoped portrait slot and restores it at both exits. No shared personality logic or expressions need editing. Risk: none (no public contract change; existing launcher semantics retained in both existing contexts).
- L7: T2 RED: `node tests/orgi-transition.cjs` failed because the launcher remained in `orgi-launcher-slot`. GREEN: focused browser journey passed with same-node identity, active gaze, enlarged vector, return and sidebar restoration; existing `orgi-dashboard`, `orgi-avatar`, `module-structure` suites and `git diff --check` passed. Existing demo disclosure remains. Adding T2 to the previously committed ~347-line feature range exceeds the `ask-on-risk` ~400 authored-line review budget. The user chose a feature-branch chain: first slice `8ad56a1` + `b7d6f86` (base), second slice T2 (refinement). These are local review boundaries; no push or PR implied by this choice.
- L8: T2 rollback boundary is `index.html`, `styles/app.css`, `scripts/app.js`, `tests/orgi-transition.cjs` and this task document; reverting T2 restores the base invitation. No dependency, avatar personality logic, localStorage key or dashboard source changed. Risk: none. S6-S8 browser and structural checks observed as in L7.
- L9: T2 work unit committed as `d7803fa`. Native committed-only assessment against the last reviewed boundary `e65e4c6`: medium, 418 changed lines, `review_due=false`, `review_due_reason=under_budget`; no candidate review launched. Local review slices: base `8ad56a1`–`b7d6f86`, refinement `d7803fa`. Future feature-branch-chain PR work requires a separate request for publishing.
- L10 (2026-11-06): Quiero refinar la experiencia de transición entre Orgi y el dashboard existente de OGL.

La implementación actual va en una dirección interesante, pero necesito simplificarla y mejorar la fluidez de la transición.

## Objetivo general

La experiencia debe dividirse en dos momentos claramente diferenciados:

1. Una pantalla inicial muy simple, enfocada en Orgi.
2. Una segunda etapa donde comienza visualmente la organización del espacio antes de abrir el dashboard.

La intención es que el usuario primero reciba un mensaje claro y limpio, y luego viva una transición suave donde Orgi organiza el contenido de manera visual y natural.

---

## 1. Pantalla inicial: simplificar al máximo

Quiero que la primera pantalla sea mucho más minimalista que la actual.

Debe incluir únicamente:

- Orgi como protagonista visual principal
- El título: "Hagamos espacio para lo importante."
- Un botón principal: "Organizar mi espacio"
- Un elemento mínimo para volver a la bandeja, preferiblemente como un ícono o acción secundaria muy discreta

Quiero eliminar de esta primera pantalla cualquier otro elemento que genere ruido visual o compita con el foco principal.

Eso incluye:

- Tarjetas como "Comunicaciones", "Por revisar", "Compromisos"
- Textos descriptivos adicionales innecesarios
- Etiquetas o bloques decorativos
- Mensajes largos de apoyo
- Cualquier composición que haga sentir esta pantalla recargada

Esta primera vista debe sentirse limpia, clara y centrada en la promesa de valor de Orgi.

Orgi debe reutilizar el avatar existente que ya está implementado en otras partes del proyecto, especialmente en el simulador de Ublik y en el dashboard original. No quiero una versión nueva del avatar. Quiero reutilizar el componente existente, dándole más protagonismo visual y un tamaño mayor dentro de esta pantalla.

No es necesario modificar por ahora sus expresiones faciales. Solo reutilizar el avatar actual.

---

## 2. Segunda etapa: transición hacia la organización

Una vez el usuario haga clic en "Organizar mi espacio", debe comenzar la experiencia de transformación.

Aquí sí pueden aparecer los elementos que representan el contenido desorganizado y su reorganización, pero necesito que esta transición se sienta mucho más fluida que en la versión actual.

Actualmente el cambio visual se siente rígido, como si se mostraran imágenes estáticas o capturas. No quiero ese efecto.

Quiero que la organización del contenido se perciba como una transformación viva, continua e integrada dentro de la misma experiencia.

La sensación debe ser la de un espacio que cambia progresivamente: Orgi toma el contexto disperso y lo convierte en algo más claro, estructurado y útil.

No quiero una sensación de “pantalla cambia por otra pantalla” ni de “foto reemplazada por otra foto”.

Quiero una transición suave entre estados, donde los elementos visuales entren, salgan, se reubiquen o evolucionen de forma natural.

---

## 3. Criterio visual y de experiencia

La pantalla inicial debe ser simple.
La segunda etapa puede ser más rica visualmente, pero sin verse cargada ni artificial.

La narrativa debe ser:

- primero: enfoque y claridad
- después: transformación y organización
- finalmente: acceso al dashboard existente

No quiero reconstruir el dashboard.
No quiero rediseñar todo el flujo.
Quiero refinar la transición para que se sienta más limpia, moderna y coherente.

---

## 4. Criterio técnico

Antes de cambiar la estructura, revisa lo que ya está implementado y reutiliza al máximo los recursos existentes.

Prioriza:

- reutilización del avatar actual de Orgi
- consistencia con la identidad visual ya construida
- transiciones suaves entre estados
- evitar efectos que parezcan imágenes estáticas
- no introducir complejidad innecesaria

Si puedes resolverlo refinando la implementación existente, prefiero eso antes que reconstruir la experiencia desde cero.

---

## Resultado esperado

Quiero una experiencia de transición más clara y elegante:

- una primera pantalla muy simple con Orgi, el título y el botón
- una segunda etapa donde la organización comienza de forma más viva y fluida
- una sensación de continuidad visual real antes de entrar al dashboard

El resultado debe sentirse natural, limpio, integrado con la aplicación y suficientemente pulido para una demostración del producto.
- L11: T3 reuses one original avatar, existing cards, four-phase timer and honest-demo text. Initial state will visually expose only the requested four elements; secondary copy appears only on action. Animate the existing nodes, not images or duplicated views. Existing browser test expects intro disclosure, so it must be updated to assert disclosure in the active story instead. Risk: none; no shared launcher, dashboard or storage contract changes planned.
- L12: T3 RED: `TMPDIR=/tmp/opencode node tests/orgi-transition.cjs` failed on extra button content in the initial scene (after default `/tmp` Chromium profile failed to start in this environment). GREEN: the focused test passed after refinement. `TMPDIR=/tmp/opencode node tests/orgi-dashboard.cjs`, `TMPDIR=/tmp/opencode node tests/orgi-avatar.cjs`, `TMPDIR=/tmp/opencode node tests/module-structure.cjs`, and `git diff --check` passed. Browser checks confirm intro hides cards and explanatory copy, back icon has an accessible name, portrait centered, progressive card opacity/position changes, visible active-stage demo disclosure, reduced-motion CSS, mobile intro and story widths, cancellation/replay, persistent data unchanged, contextual mail entry unchanged. Rollback T3 alone: revert its changes in `index.html`, `styles/app.css`, `scripts/app.js`, `tests/orgi-transition.cjs`, and this logbook. Risk: none; review slice T3 is independent from earlier base and avatar-refinement slices.
- L13: T3 work-unit commit `624db4e` extends the selected local feature-branch chain after `d7803fa` and `70c3267`. Native committed-only assessment against `e65e4c6`: medium, 563 changed lines, `review_due=false`, `review_due_reason=under_budget`. No native review triggered; no remote operations requested. The source/behavior unit remains reviewable separately from its two predecessors.
