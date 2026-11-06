# Orgi → Dashboard transition
Branch: `feature/orgi-dashboard-transition` · Strategy: ask-on-risk · Runner: `node tests/orgi-transition.cjs` and existing Node suites.
Objective: demonstrate an honest, accessible journey from Orgi's panel to the existing dashboard. Forecast: ~400 authored lines; assess slice strategy before commit.

## Specs
- S1: “en lugar de acceder inmediatamente al dashboard, debería encontrarse con una pantalla intermedia dedicada al asistente.” Enter from “Abrir centro de control”; keep direct mail-to-dashboard navigation and existing dashboard intact. Verify browser navigation.
- S2: “Orgi debe ser el protagonista visual” and “un mensaje breve que lo invite a comenzar la organización de su espacio de trabajo, acompañado de un botón principal de llamado a la acción.” Verify responsive screen, keyboard focus and return action.
- S3: “No quiero que se perciba como una pantalla de carga convencional.” Illustrate “cómo Orgi toma la información inicialmente desorganizada de OGL, la analiza, identifica lo importante y la transforma en un espacio más claro, estructurado y fácil de gestionar.” Verify sequential states, final confirmation, dashboard arrival, reduced-motion behavior and replay.
- S4: “Si la organización real de información todavía no está implementada, puedes utilizar una secuencia demostrativa claramente diferenciada de un procesamiento real. No presentes operaciones simuladas como si hubieran sido ejecutadas.” Verify explicit demo disclosure and unchanged persisted records.
- S5: “Conserva la identidad visual y la coherencia con la aplicación actual.” “Integra la transición dentro del flujo de navegación existente, sin afectar las funcionalidades actuales.” “El nombre correcto del asistente es **Orgi**.” Verify existing suites and no new dependency.

## Tasks
- T1 (S1-S5): inline; verified; commit pending. One coherent transition with focused browser tests and existing suite. No writer trigger: one coupled behavior across shared markup/styles/events.

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
