# CLAUDE.md · Misión TI

Contexto para trabajar en este proyecto desde VS Code. Respondan y escriban la interfaz **en español de Colombia**.

## Qué es
App web (Next.js 15 + TypeScript + Supabase, desplegada en Vercel) para dictar una clase de 3 horas de **Gestión de Recursos Tecnológicos**. La clase es el **martes 4 de noviembre de 2026, de 1:00 a 4:00 p. m.**, en el programa de Ingeniería de Sistemas y Computación.

- **Equipo a cargo (equipo 3):** José Castellanos (docente, director de la misión), Karen Moreno (estratega y cronometrista), Dylber Cabrera (game master) y Camila Giraldo (anfitriona y evaluación).
- **Participantes:** 27 estudiantes en 11 grupos de juego (`src/domain/data/teams.ts`). El equipo 13 se eliminó; Andrés Felipe Ríos pasó al 12. Juliana Moreno (equipo 14) juega sola el **caso exprés** "Papelería El Rincón Digital", que tiene menos carga.
- **Invitado experto:** KOSMOS TIC S.A.S. y BU-TIC (Manizales; VoIP, IP PBX, SIP Trunk, DID, SMS y campañas masivas, omnicanalidad, CRM). Se conecta por Google Meet a las 2:47 p. m.

## Las 4 fases de la clase (requisito del curso)
1. **Fuente:** tema central y origen de la información (bibliografía, normativa, empresa real, experto).
2. **Entrega:** taller gamificado: empresas ficticias en crisis, 100 TecnoCoins, Mercado, cartas de crisis y lienzo digital (en el celular; la clase no usa materiales físicos). La teoría de los 6 niveles del ciclo de vida se presenta en la app.
3. **Invitado experto:** entrevista tipo podcast; cada grupo hace una pregunta sobre su nivel del ciclo.
4. **Evaluación:** preguntas sorpresa individuales, Semáforo, Galería, quiz final individual y lienzo con rúbrica → nota de 0 a 5.

Ciclo de vida (tema del profesor): identificación y diagnóstico → análisis y planeación de la adquisición (incluye la ruta legal) → implementación y puesta en marcha → capacitación y aprovechamiento → operación y sostenibilidad → desistimiento y fin de ciclo (retiro por daño u obsolescencia).

## Reglas de diseño que deben respetarse
- **SOLID** (lo exige el curso). Dominio puro en `src/domain`, casos de uso en `src/application/usecases` (una clase por acción con `execute`), puertos pequeños en `src/application/ports.ts`, adaptadores en `src/infrastructure` (memoria y Supabase). `src/infrastructure/container.ts` es el único lugar que elige la implementación. El reloj y el azar se inyectan.
- **Errores de negocio:** se lanzan como `GameRuleError` con un mensaje para el usuario en español. `actions.ts` solo autentica y delega.
- **Seguridad:** las tablas tienen RLS sin políticas; todo pasa por el servidor con la clave service_role. La respuesta correcta de una pregunta **nunca** se envía al celular antes de contestar (ver `snapshot.ts`).
- **Tiempo real:** después de cada cambio, `notifier.notify()` envía un Broadcast de Supabase y las pantallas recargan `/api/state`. Si no llega, consultan cada 3 s.
- **Contenido:** sobre KOSMOS TIC, solo fuentes oficiales (su catálogo y kosmostic.com), con citas textuales. Para normativa, los textos oficiales. No inventar datos de la empresa. `www.butic.com` NO es de la empresa; no usarlo.
- **Diseño "Centro de control":** paleta del equipo `#3368A0` (acción), `#66A3BF`, `#C8DFDB`, `#F2EFE7` (fondo). El verde, el ámbar y el coral apagados se reservan para estados (Semáforo, crisis, alertas). Fuentes: Chakra Petch (títulos), Instrument Sans (texto), IBM Plex Mono (cifras). Bloques "marcador" oscuros (`.board`) para cifras grandes. Moderno, minimalista, nada genérico. Los tokens están en `:root` de `src/app/globals.css`.
- **Energía:** la clase es después de almorzar. Bloques de teoría de máximo 8 minutos, sonidos en el proyector, preguntas sorpresa y pausa activa.

## Mapa rápido
| Quiero cambiar… | Archivo |
|---|---|
| Cronograma y horas | `src/domain/data/agenda.ts` |
| Diapositivas de teoría | `src/domain/data/lessons.ts` |
| Preguntas sorpresa y quiz | `src/domain/data/questions.ts` |
| Temas de entrevista por grupo | `src/domain/data/guest.ts` |
| Fuentes citadas | `src/domain/data/sources.ts` |
| Grupos e integrantes | `src/domain/data/teams.ts` **y** la tabla `teams` en Supabase |
| Catálogo, casos de empresa y rutas legales | `src/domain/data/catalog.ts` |
| Cartas de crisis | `src/domain/crisis/` |
| Cálculo de la nota | `src/domain/grading.ts` |
| Casillas del lienzo y rúbrica | `src/domain/data/canvas.ts` |
| Prueba de carga | `scripts/prueba-carga.mjs` (`npm run carga`) |
| Esquema de base de datos | `supabase/schema.sql` (nuevo) y `supabase/migracion-v2.sql`, `migracion-v3.sql` (actualizar, en orden) |

## Comandos
```bash
npm install
npm run dev     # sin variables de Supabase arranca en memoria (código docente 2026)
npm test        # vitest: tests/*.test.ts
npm run build
```
Antes de dar algo por terminado: `npx tsc --noEmit`, `npm test` y `npm run build` deben pasar. Si cambian el modelo de datos, actualicen ambos adaptadores (memoria y Supabase), `schema.sql` y una migración nueva.

## Pendiente o por decidir
- Cambiar `STAFF_PIN` en Vercel: `2026` es el código de pruebas y está escrito en el repositorio.
- Correr la prueba de carga contra Vercel antes de la clase.
- Confirmar con KOSMOS TIC el nombre de quien se conecta y el enlace de Meet.
- La propuesta en PDF (fases, cronograma y materiales) se escribió para 13 grupos; la app ya usa 11.
- La integración con Supabase en vivo debe probarse en un ensayo real en el salón, con los celulares en el wifi de la universidad.
