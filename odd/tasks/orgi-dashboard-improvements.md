# Orgi Dashboard Improvements
Objective: Simplify the existing academic dashboard while preserving its sample data, local persistence, and demonstration boundaries.
Branch: `feature/dashboard-improvements` · Delivery: ask-on-risk · Runner: Node syntax/static checks plus browser interaction checks where available · Forecast: approximately 500 authored changed lines.

## Specs
S1. Home must be titled "Mi espacio académico", show the subtitle "Encuentra tus comunicaciones y organiza lo importante", a visible search entry point, exactly three compact counts (unreviewed communications, student-marked relevance, active commitments), three to five recent/unreviewed communications, and five compact category links. Do not frame unreviewed messages as urgent or requiring attention.
S2. Communication search must cover available subject, sender, available body/preview keywords, and category; combinable category, review-state, and student-relevance filters must be resettable and retain date sorting. The list must remain compact and scannable.
S3. Details must preserve navigation context and show available subject, sender, date, proposed category, available content or "Contenido no disponible en esta muestra", an evidence-based possible action when present, and the original reference when available. Clearly distinguish proposals from student-confirmed actions.
S4. Review state, student relevance, and linked commitments are independent. The student can mark reviewed and toggle relevance independently; neither state creates a commitment. Persist new relevance compatibly with existing browser data.
S5. Commitments are created only by explicit student confirmation, with editable title, description, optional date, and source communication reference. Support viewing, editing, completing, and confirmed deletion; keep an approachable empty state and existing local persistence.
S6. Keep the existing dark navy/cyan identity and compact navigation, improve focus/contrast and responsive layouts without horizontal overflow or clipped controls, provide understandable empty/error states, and label sample data discreetly as "Modo demostración · Datos de ejemplo". Do not invent source content, deadlines, obligations, urgency, or AI behavior.
S7. Preserve existing working behavior and data; do not add dependencies or real mail/AI integrations. Acceptance covers searching/filtering, details, independently persisted states, voluntary commitment lifecycle, accurate counts, desktop/mobile usability, and explicit incomplete/inferred-data disclosure. These are prototype criteria, not user-efficacy evidence.

## Tasks
- T1 [S1,S6] inline; complete; home hierarchy, compact recent rows, three counts, category links and demo disclosure; browser smoke RED (5 summary cards vs 3 required) then GREEN (home smoke passed); commit `3286ebb`, native assessment medium/under_budget.
- T2 [S2,S3,S6] inline; complete; category/body-aware search, compact communication rows and transparent details; Chromium smoke and existing avatar suite passed; commit `f3c4d93`, native assessment medium/under_budget.
- T3 [S4,S5,S7] inline; complete; independent review/relevance state, commitment create/edit/complete/delete, compatible local persistence and legacy-state compatibility; Chromium interaction/persistence probes passed; commit `868ddd8`, native assessment medium/under_budget.
- T4 [S6,S7] inline; complete; responsive overflow fix, reduced-motion behavior, and readable empty/error states; Chromium desktop/mobile and fetch-error probes passed; commit `868ddd8`, native assessment medium/under_budget.

## Log
L1 (2026-11-04): User request, preserved verbatim:

# Prompt de desarrollo — Mejoras UX/UI y funcionales de Orgi

## 1. Contexto del proyecto

Estoy desarrollando **Orgi**, un prototipo de Dashboard académico dirigido a estudiantes de la Universidad EAN.

La problemática que buscamos abordar es la dificultad que algunos estudiantes experimentan para localizar y atender oportunamente información académica relevante que reciben por correo institucional.

Nuestra investigación exploratoria encontró indicios de dificultades para encontrar comunicaciones importantes y casos de estudiantes que reportaron enterarse tarde de información. Sin embargo, no hemos demostrado que el volumen de correos sea la causa ni que la automatización mediante IA sea necesariamente la mejor solución.

Por eso, el objetivo de Orgi no es sustituir Outlook ni desarrollar un gestor de correo complejo, sino proporcionar una experiencia más clara y sencilla para consultar y organizar información académica.

**Propuesta de valor:**

"Encuentra la información académica que necesitas y organiza las acciones que decidas realizar".

## 2. Objetivo de esta iteración

Quiero que analices el código y la interfaz actual de Orgi e implementes mejoras que permitan:

1. Encontrar comunicaciones académicas de forma rápida y sencilla.
2. Visualizar la información recibida de manera organizada y comprensible.
3. Orientar al estudiante sobre qué información contiene cada comunicación.
4. Facilitar la identificación de mensajes que el propio estudiante considera relevantes.
5. Permitir dar seguimiento a compromisos derivados de los correos, solamente cuando el estudiante decida crearlos.
6. Reducir el esfuerzo de navegación y la cantidad de elementos innecesarios en pantalla.

**Principio central: simplicidad antes que complejidad.**

No quiero un Dashboard saturado de métricas, tarjetas, gráficos, notificaciones o funcionalidades de inteligencia artificial que no aporten valor claro.

## 3. Diseño visual y experiencia de usuario

Conserva la identidad visual actual:

- Tema oscuro.
- Paleta azul marino con detalles en cian.
- Diseño limpio y profesional.
- Barra lateral de navegación.
- Tipografía legible.
- Componentes consistentes.
- Bordes suaves y espaciado equilibrado.

Mejora los siguientes aspectos:

- Jerarquía visual: distinguir claramente qué información es principal y cuál es secundaria.
- Reducir texto explicativo repetitivo dentro de las tarjetas.
- Evitar tarjetas demasiado grandes para la información que muestran.
- Utilizar colores con significado consistente.
- Mantener suficiente contraste y estados de foco visibles.
- Diseñar una experiencia adaptable a pantallas de escritorio y móviles.
- Evitar desplazamiento horizontal y controles recortados.
- Presentar mensajes vacíos y estados de error comprensibles.

La interfaz debe resultar fácil de comprender incluso para estudiantes que no tengan experiencia utilizando Dashboards.

## 4. Pantalla de inicio — Mi espacio académico

Quiero simplificar la pantalla de inicio.

Debe responder rápidamente a tres preguntas:

- ¿Qué comunicaciones tengo por revisar?
- ¿Dónde puedo encontrar la información que necesito?
- ¿Qué compromisos decidí registrar?

### Estructura propuesta

**A. Encabezado**

Título: "Mi espacio académico".

Subtítulo: "Encuentra tus comunicaciones y organiza lo importante".

Incluir un buscador visible que permita iniciar una búsqueda desde la pantalla principal.

**B. Resumen compacto**

Mostrar únicamente tres indicadores:

- Comunicaciones sin revisar.
- Comunicaciones marcadas como relevantes por el estudiante.
- Compromisos activos.

Evitar que los indicadores ocupen demasiado espacio.

No utilizar expresiones como "urgente" o "requiere tu atención" simplemente porque un mensaje todavía no haya sido revisado.

**C. Comunicaciones recientes o por revisar**

Mostrar una lista breve de comunicaciones, preferiblemente entre tres y cinco.

Cada elemento debe presentar:

- Asunto.
- Remitente.
- Fecha.
- Categoría propuesta.
- Estado de revisión.

Permitir abrir el detalle desde la tarjeta o fila.

**D. Acceso a categorías**

Conservar las categorías existentes:

- Académicos.
- Institucionales.
- Administrativos.
- Bienestar.
- Oportunidades.

Mostrarlas como accesos compactos, preferiblemente debajo de las comunicaciones o en una sección secundaria.

Las categorías deben funcionar como ayudas para explorar, no como una clasificación infalible.

## 5. Pantalla de comunicaciones — Funcionalidad principal

Esta debe ser la sección central de Orgi.

### A. Mejorar el buscador

Permitir buscar utilizando los campos realmente disponibles en los datos:

- Asunto.
- Remitente.
- Palabras clave del contenido, únicamente si se dispone de dicho contenido.
- Categoría.

La búsqueda debe ser rápida y actualizar los resultados de forma intuitiva.

### B. Simplificar los filtros

Incluir filtros por:

- Categoría.
- Estado de revisión.
- Relevancia marcada por el usuario.

Conservar ordenamiento por fecha.

Los filtros deben poder combinarse y reiniciarse fácilmente.

No añadir opciones que compliquen innecesariamente la navegación.

### C. Mejorar la presentación de comunicaciones

Cada comunicación debe visualizarse de manera compacta, facilitando su lectura rápida.

Mostrar:

- Asunto destacado.
- Remitente.
- Fecha.
- Categoría.
- Estado de revisión.
- Indicador de relevancia, cuando corresponda.

Evitar mostrar demasiadas etiquetas y descripciones simultáneamente.

Priorizar una lista escaneable antes que tarjetas grandes.

### D. Vista de detalle

Al seleccionar una comunicación, abrir una vista de detalle clara, mediante un panel lateral o una página dedicada, según lo que mejor se adapte a la arquitectura actual.

Mostrar:

- Asunto completo.
- Remitente.
- Fecha.
- Categoría propuesta.
- Contenido disponible.
- Posible acción sugerida, si existe información suficiente para proponerla.
- Referencia o acceso al mensaje original, cuando esté disponible.

Permitir estas acciones:

1. Marcar como revisado.
2. Marcar o desmarcar como relevante.
3. Convertir en compromiso.

Es fundamental diferenciar una acción sugerida por el sistema de una acción confirmada por el estudiante.

No inventar fechas límite, obligaciones o instrucciones que no estén presentes en los datos.

## 6. Estados de las comunicaciones

Separar tres conceptos:

**Estado de revisión**

- Sin revisar.
- Revisado.

**Relevancia**

- Sin marcar.
- Relevante para el estudiante.

**Compromiso**

- Sin tarea asociada.
- Con tarea asociada.

Estos conceptos no deben mezclarse.

Por ejemplo, una comunicación puede estar revisada y marcada como relevante sin que exista una tarea asociada.

La relevancia debe depender de la decisión del estudiante, no de una clasificación automática presentada como definitiva.

## 7. Pantalla Mis compromisos

Mantener esta sección sencilla.

Su propósito es permitir que el estudiante recuerde acciones que decidió realizar después de revisar una comunicación.

### Crear compromiso

Al seleccionar "Convertir en compromiso":

- Proponer un título editable.
- Permitir agregar una descripción.
- Permitir establecer una fecha opcional.
- Conservar la referencia a la comunicación original.
- Solicitar confirmación antes de guardar.

No crear compromisos automáticamente.

### Visualización

Mostrar los compromisos mediante una lista sencilla con:

- Título.
- Comunicación relacionada.
- Fecha, cuando exista.
- Estado: pendiente o completado.

Permitir editar, completar y eliminar compromisos con confirmación cuando corresponda.

Mantener un estado vacío amigable que explique cómo crear el primer compromiso.

## 8. Transparencia y límites de la información

Actualmente trabajamos con una muestra local de comunicaciones y algunos datos son parciales.

Es necesario mantener esa transparencia, pero sin mostrar advertencias extensas que dominen visualmente la interfaz.

Implementar un aviso discreto y accesible, por ejemplo:

"Modo demostración · Datos de ejemplo".

Al abrir más información, explicar que:

- Los mensajes pueden ser ficticios o parciales.
- Las categorías pueden ser propuestas.
- No todas las comunicaciones incluyen cuerpo completo.
- Las acciones sugeridas no representan obligaciones confirmadas.

Si el contenido original no está disponible, indicar "Contenido no disponible en esta muestra".

No fabricar resúmenes, fechas, remitentes, urgencias o compromisos.

## 9. Restricciones técnicas

Antes de modificar el proyecto, inspecciona la arquitectura y los componentes existentes.

- Reutiliza componentes y estilos actuales siempre que sea razonable.
- No reconstruyas la aplicación desde cero.
- No añadas dependencias innecesarias.
- Conserva las funcionalidades que ya funcionan.
- Mantén la persistencia local existente, si está implementada.
- No incorpores integraciones reales con Outlook, Microsoft Graph o ChatGPT en esta iteración.
- No introduzcas nuevas funciones automáticas de IA sin necesidad.
- Mantén el prototipo funcional sin conexión al correo real.
- No sustituyas datos existentes por información fabricada.
- Evita cambios destructivos en el código o en la estructura de datos.

Si se necesitan nuevos campos para relevancia o compromisos, intégralos de manera compatible con los datos existentes.

## 10. Prioridades de implementación

### Prioridad alta — MVP esencial

1. Simplificar la pantalla de inicio.
2. Mejorar la búsqueda y filtros.
3. Implementar o mejorar el detalle de una comunicación.
4. Separar revisión, relevancia y compromisos.
5. Mejorar la legibilidad y consistencia visual.

### Prioridad media

6. Mejorar la creación y gestión de compromisos.
7. Refinar navegación responsive y estados vacíos.
8. Reducir información repetida o innecesaria.

### Fuera del alcance actual

- Clasificación automática avanzada mediante IA.
- Análisis semántico de correos.
- Extracción automática de fechas límite.
- Alertas inteligentes de urgencia.
- Integración real con cuentas institucionales.
- Gráficos estadísticos complejos.
- Funcionalidades adicionales que no respondan directamente a las necesidades identificadas.

## 11. Criterios de aceptación

Considera terminada esta iteración cuando:

- El estudiante pueda localizar una comunicación de ejemplo mediante búsqueda o filtros.
- Pueda consultar sus detalles sin perder el contexto de navegación.
- Pueda distinguir claramente los mensajes sin revisar de los mensajes marcados como relevantes.
- Pueda crear un compromiso voluntariamente desde una comunicación.
- Pueda consultar y completar sus compromisos.
- Los contadores reflejen correctamente los estados registrados.
- La interfaz funcione adecuadamente en escritorio y móvil.
- Los datos incompletos o inferidos estén identificados.
- No se hayan introducido funcionalidades innecesarias ni regresiones conocidas.

Estos son criterios de funcionamiento del prototipo, no pruebas de que ya sea eficaz para los estudiantes. Esa eficacia se evaluará posteriormente con usuarios.

## 12. Forma de trabajo solicitada

Primero revisa el proyecto y determina qué funcionalidades ya existen, cuáles requieren mejoras y cuáles faltan.

Después:

1. Presenta un diagnóstico breve de los componentes afectados.
2. Implementa las mejoras priorizadas sobre el código existente.
3. Conserva la identidad visual de Orgi.
4. Verifica navegación, búsqueda, filtros, actualización de estados y persistencia.
5. Comprueba los estados vacíos, errores y diseño responsive.
6. Resume los archivos modificados y los cambios realizados.
7. Indica cualquier limitación pendiente y las pruebas que efectivamente ejecutaste.

No afirmes haber verificado una funcionalidad sin haberla probado.

## Resultado esperado

Quiero un prototipo de Orgi más simple, coherente y centrado en el estudiante.

La experiencia principal debe ser:

**Buscar → Encontrar → Comprender → Decidir → Dar seguimiento, si es necesario.**

El resultado debe parecer un espacio académico de consulta y orientación, no un sistema complejo de administración de correo.

**Recuerda: el propósito es hacer más fácil encontrar y comprender información académica relevante, no incorporar la mayor cantidad posible de funcionalidades.**

L2: The existing app is a single-file HTML/CSS/JS prototype. It already has local sample data, category and proposed-attention filtering, date sorting, a details drawer, and locally persisted task and decision data. Existing decision values incorrectly conflate reviewed and relevance (`relevante`/`no_relevante`); the home has five summary cards and uses an attention-oriented heading; home search does not match body/category and filters do not separate relevance from review. No package manifest or dedicated test runner is tracked. Preserve historical task document `odd/tasks/academic-command-center-ui.md`; this feature is separate.
L3: Added a Chromium/CDP smoke harness without third-party dependencies. The initial home probe failed on the existing five indicators, then passed after the compact three-indicator home and disclosure implementation. T1 commit `3286ebb` changed 565 lines across 3 paths and received medium/under_budget native assessment against `7051e2e`; no review START was due.
L4: Search now matches available subject, sender, explicitly available body, and category; list rows are more compact and distinguish proposed category, review, relevance, and linked commitment. Details show exact unavailable-content disclosure, origin metadata, and only a valid HTTP(S) original link. The category-search probe failed before the implementation, then the full Chromium/CDP smoke passed; `tests/orgi-avatar.cjs`, inline JS syntax, and `git diff --check` passed. The browser smoke currently verifies desktop overflow only; mobile and state/persistence flows remain pending.
L5: State actions now independently persist review strings in the existing `academic-followup.decisions.v1` shape and relevance IDs under `academic-followup.relevance.v1`; missing new-key data falls back to the existing `relevante`/`no_relevante` values without rewriting the old data during load. Commitments require a confirmation, retain the source ID, allow editing/completion/confirmed deletion, and remain persisted across reload. The expanded Chromium/CDP scenario covers category and available-body search, combined filters, independent state, commitment lifecycle, legacy state loading, fetch errors, and 390px viewport overflow. Initial state-button RED and mobile overflow RED both reproduced before their respective fixes; all browser probes pass. `tests/orgi-avatar.cjs`, syntax checks, and `git diff --check` pass. Risk: none (existing decision value strings remain compatible; the new relevance key stores additive user choices, with regression probes).
L6: Commit `868ddd8` completes T3 and T4. Native committed-range assessment against `7051e2e` returned medium/executable_change with `review_due=false`, `under_budget`; no review START was due. Final Risk: none (no existing stored format was replaced; relevance is an additive key and old values remain readable).
