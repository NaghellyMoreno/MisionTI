# Misión TI · Rescate Empresarial

App de la clase **Gestión de Recursos Tecnológicos** 
Presenta la teoría, lleva el juego, lanza preguntas sorpresa individuales, modera la entrevista con **KOSMOS TIC** por Google Meet, hace el quiz final y calcula la nota de 0 a 5.

| Ruta | Quién | Para qué |
|---|---|---|
| `/` | Todos | Ingreso: grupo → nombre → código del grupo (o equipo docente) |
| `/equipo` | Cada estudiante, en su celular | Clase en vivo, preguntas sorpresa, Mercado, pregunta al invitado, votaciones, quiz |
| `/control` | José, Karen, Dylber, Camila | Asistencia, teoría, sorpresas, compras, crisis, invitado, quiz, notas |
| `/proyector` | Video beam | Sala de espera, teoría, ranking, crisis, sorpresas, invitado, quiz y podio |

---

## 1. Publicarla

### Supabase
- **Proyecto nuevo:** SQL Editor → pegar [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
- **Si ya habían ejecutado la versión anterior:** ejecuten solo [`supabase/migracion-v2.sql`](supabase/migracion-v2.sql). Actualiza los grupos y crea las tablas nuevas sin borrar nada.

### Vercel
Variables de entorno (Settings → Environment Variables) y luego **Redeploy**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave anon / publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | clave service_role / secret (privada) |
| `STAFF_PIN` | código de 4 dígitos del equipo docente |
| `SESSION_SECRET` | frase larga y aleatoria (32+ caracteres) |

Los pasos detallados para crear el proyecto y subirlo a GitHub están en la sección 7.

---

## 2. Antes de la clase (checklist)

- [ ] **Ensayo en el mismo salón** con varios celulares conectados al wifi de la universidad. Si el wifi bloquea algo, el indicador del celular pasa a "sincronizando" o "sin conexión": en ese caso, pidan usar datos móviles.
- [ ] Al terminar el ensayo: **Control → Ajustes → Reiniciar partida** (escribir `REINICIAR`). Borra compras, respuestas, preguntas y asistencia; conserva los pesos de la nota.
- [ ] **Control → Ajustes → Mostrar códigos**: un código por grupo para el sobre.
- [ ] Código QR de la dirección de la app en la primera diapositiva o en el tablero.
- [ ] `/proyector` abierto en el computador del video beam (F11) y clic en **🔇 Activar sonido**.
- [ ] Confirmar con KOSMOS TIC el enlace de Meet para las **2:47 p. m.**
- [ ] 12:45 p. m.: proyector en **Sala**. Los estudiantes van entrando y su nombre se pone verde.

## 3. Durante la clase

| Hora | Actividad | Qué hacer en `/control` |
|---|---|---|
| 12:45 | Sala de espera | Pestaña **Asistencia**: ver quién falta |
| 1:00 | Alerta Roja | ▶ en el cronograma → **Iniciar**. La teoría salta sola a su diapositiva |
| 1:10 | Fuentes y expediente KOSMOS TIC | Pestaña **Clase**: avanzar diapositivas. Al cerrar: **🎯 Lanzar** (bloque Fuentes) |
| 1:22–2:34 | Niveles 1 a 6 + juego | Diapositivas → sorpresa al cerrar cada nivel (el panel sugiere el bloque) → Mercado y crisis como antes |
| 2:34 | Pausa activa | Diapositiva de pausa: 60 segundos de pie |
| 2:42 | Afinar pregunta | Los grupos escriben su pregunta en la pestaña **Invitado** del celular |
| 2:47 | KOSMOS TIC en vivo | Pestaña **Invitado**: **En pantalla** en orden (del nivel 1 al 6) y **Marcar hecha** |
| 3:17 | Semáforo · Galería | Igual que antes |
| 3:33 | Quiz final | Pestaña **Quiz**: Iniciar → Revelar → Siguiente (12 preguntas, 20 s cada una) |
| 3:45 | Notas y premiación | Pestaña **Notas**: nota del lienzo por grupo → **Descargar para Excel** · proyector en **Podio** |

**Tip para Meet:** en Google Meet usen *Presentar → Una pestaña* con `/proyector`. Así KOSMOS TIC ve en pantalla la pregunta de cada grupo mientras la escucha.

### Preguntas sorpresa
- Llegan a pantalla completa en el celular de los escogidos, con vibración y 45 segundos.
- La app escoge **al azar entre los conectados**, empezando por quienes menos preguntas han recibido. A nadie se le repite la misma pregunta.
- El proyector muestra **los nombres** (no la pregunta) y quién ya respondió.
- **Sin señal:** si el celular pierde la conexión, la respuesta queda guardada en el celular y se envía sola al reconectar (hay 60 segundos de margen).

### Asistencia
Cada celular envía una señal cada 15 segundos. Un estudiante está "conectado" si dio señal en los últimos 45 segundos. **Si alguien no tiene celular o batería**, puede entrar desde el de un compañero con el botón **Cambiar** (cierra la sesión del otro en ese celular).

### Nota de 0 a 5
| Componente | Peso por defecto | Cómo se calcula |
|---|---|---|
| Preguntas sorpresa (individual) | 25 % | aciertos ÷ preguntas recibidas × 5 |
| Quiz final (individual) | 30 % | aciertos ÷ preguntas abiertas × 5 |
| Lienzo (grupo) | 30 % | rúbrica que pone José en **Notas** |
| Manejo del presupuesto (grupo) | 15 % | de 3,0 (menor saldo del curso) a 5,0 (mayor saldo) |

Los pesos se cambian en **Notas** (deben sumar 100 %). Si a alguien no le tocó pregunta sorpresa, ese componente se excluye y su peso se reparte entre los demás (la tabla lo marca con *). El archivo descargado abre directo en Excel.

---

## 4. Contenido y fuentes

- **Teoría:** 31 diapositivas en [`src/domain/data/lessons.ts`](src/domain/data/lessons.ts), una o más por actividad del cronograma.
- **KOSMOS TIC:** solo fuentes oficiales: el catálogo de productos y servicios de la empresa y su sitio [kosmostic.com](https://kosmostic.com). Las citas son textuales.
- **Normativa:** Ley 80 de 1993, Ley 1150 de 2007, Ley 1474 de 2011 (art. 94), Ley 1581 de 2012, Ley 1672 de 2013 y [Ley 2300 de 2023](https://normograma.mintic.gov.co/docs/pdf/ley_2300_2023.pdf).
- **Temas de entrevista:** [`src/domain/data/guest.ts`](src/domain/data/guest.ts). Cada grupo tiene un nivel distinto del ciclo de vida, así la entrevista recorre el tema completo sin repetir preguntas.
- **Preguntas sorpresa y quiz:** [`src/domain/data/questions.ts`](src/domain/data/questions.ts).

> Ojo: el catálogo indica `www.butic.com` como sitio de BU-TIC, pero esa dirección pertenece a una organización sin relación con la empresa. Por eso no se usa como fuente.

---

## 5. Probar en su computador

```bash
npm install
npm run dev        # http://localhost:3000 (sin Supabase arranca en memoria)
npm test           # 25 pruebas de reglas del juego, preguntas, asistencia y notas
```
Código docente en local: `2026`. Códigos de grupos en local: Control → Ajustes → Mostrar códigos.

---

## 6. Arquitectura y principios SOLID

```
src/
├─ domain/          Reglas puras (sin Next.js ni Supabase)
│  ├─ data/           Contenido: teoría, preguntas, invitado, cronograma, fuentes, grupos
│  ├─ crisis/         Cartas de crisis (patrón Strategy)
│  ├─ rules.ts        Saldos, ranking, compras, temporizador
│  ├─ students.ts     Integrantes y asistencia
│  ├─ selection.ts    Selección justa al azar y puntaje del quiz
│  └─ grading.ts      Política de la nota 0–5
├─ application/     Casos de uso, puertos (interfaces) y consultas
│  ├─ usecases/       Un caso de uso por acción (LaunchPop, AnswerQuiz, SaveGuestQuestion…)
│  ├─ snapshot.ts     Vista de cada usuario (oculta respuestas antes de tiempo)
│  └─ grades.ts       Cálculo de notas del curso
├─ infrastructure/  Adaptadores: memoria, Supabase, sesión, raíz de composición
├─ app/             Pantallas y server actions (Next.js App Router)
└─ ui/              Componentes compartidos (diapositivas, temporizador, sincronización)
```

| Principio | Dónde se ve |
|---|---|
| **S** · Responsabilidad única | Cada caso de uso hace una sola cosa; `gradeStudent` solo califica; `pickFairly` solo escoge; `actions.ts` solo autentica y delega. |
| **O** · Abierto/cerrado | Nuevas cartas de crisis implementan `CrisisEffect`; nuevas diapositivas o preguntas se agregan como datos sin tocar la lógica. |
| **L** · Sustitución | Las implementaciones en memoria y en Supabase cumplen los mismos contratos; las pruebas usan una y producción la otra. |
| **I** · Segregación de interfaces | Puertos pequeños (`PresenceRepository`, `AnswerRepository`, `GuestQuestionRepository`…); cada caso de uso pide solo los que usa. |
| **D** · Inversión de dependencias | Dominio y casos de uso dependen de `ports.ts`; solo `container.ts` conoce Supabase. Reloj y azar se inyectan para poder probarlos. |

**Seguridad:** RLS activado sin políticas (el navegador no lee ni escribe la base directamente), sesiones firmadas, y la respuesta correcta nunca viaja al celular antes de que el estudiante conteste.

---

## 7. Crear desde cero (Supabase + GitHub + Vercel)

1. <https://supabase.com> → **New project**. Al terminar: **SQL Editor** → `schema.sql` → **Run**. Copien la URL y las claves (Project Settings → API Keys; si hay dos pestañas, usen **Legacy API keys**).
2. Suban el código:
   ```bash
   git init && git add . && git commit -m "Misión TI"
   git branch -M main
   git remote add origin https://github.com/SU-USUARIO/mision-ti.git
   git push -u origin main
   ```
3. <https://vercel.com/new> → importar el repositorio → agregar las 5 variables → **Deploy**.
