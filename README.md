# Misión TI · Rescate Empresarial

App de la clase **Gestión de Recursos Tecnológicos** 
Presenta la teoría, lleva el juego, lanza preguntas sorpresa individuales, modera la entrevista con **KOSMOS TIC** por Google Meet, hace el quiz final y calcula la nota de 0 a 5.

| Ruta | Quién | Para qué |
|---|---|---|
| `/` | Estudiantes | Ingreso: grupo → nombre → código del grupo |
| `/equipo` | Cada estudiante, en su celular | Clase en vivo, preguntas sorpresa, Mercado, pregunta al invitado, votaciones, quiz |
| `/control` | José, Karen, Dylber, Camila | Ingreso docente (nombre + código), asistencia, teoría, sorpresas, compras, crisis, invitado, quiz, notas |
| `/proyector` | Video beam | Sala de espera, teoría, ranking, crisis, sorpresas, invitado, quiz y podio |

---

## 1. Publicarla

### Supabase
- **Proyecto nuevo:** SQL Editor → pegar [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
- **Si ya habían ejecutado una versión anterior:** ejecuten las migraciones que les falten, en orden: [`migracion-v2.sql`](supabase/migracion-v2.sql) (grupos, asistencia, respuestas, invitado) y [`migracion-v3.sql`](supabase/migracion-v3.sql) (lienzo digital y preguntas anuladas). Ninguna borra datos.

### Vercel
Variables de entorno (Settings → Environment Variables) y luego **Redeploy**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave anon / publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | clave service_role / secret (privada) |
| `STAFF_PIN` | código de 4 dígitos del equipo docente. **No usen 2026**: es el de pruebas y aparece en este repositorio |
| `SESSION_SECRET` | frase larga y aleatoria (32+ caracteres) |
| `APP_URL` | opcional: la dirección que muestra el QR de la sala (si no, se toma de la petición) |

Los pasos detallados para crear el proyecto y subirlo a GitHub están en la sección 7.

---

## 2. Antes de la clase (checklist)

- [ ] **Prueba de carga** (sección 2.1) contra la dirección de Vercel.
- [ ] **Ensayo en el mismo salón** con varios celulares conectados al wifi de la universidad. Si el wifi bloquea algo, el indicador del celular pasa a "sincronizando" o "sin conexión": en ese caso, pidan usar datos móviles.
- [ ] Al terminar el ensayo: **Control → Ajustes → Reiniciar partida** (escribir `REINICIAR`). Borra compras, respuestas, preguntas y asistencia; conserva los pesos de la nota.
- [ ] **Control → Ajustes → Mostrar códigos**: tengan a mano el código de cada grupo para decírselo al entrar (no lo proyecten).
- [ ] El QR de ingreso ya aparece en la pantalla **Sala** del proyector: no hay que imprimir nada.
- [ ] `/proyector` abierto en el computador del video beam (F11) y clic en **🔇 Activar sonido**.
- [ ] **Control remoto (clicker USB):** conectar el receptor USB al computador del video beam. En ese mismo navegador, ingresar como equipo docente (pantalla de inicio) y abrir `/proyector`. Probar que ▶ pasa la diapositiva y ◀ la devuelve (solo funciona cuando el proyector está en **Teoría**). El botón de pantalla en negro (`.` o `B`) oscurece el proyector; `Esc` o cualquier avance lo restablece.
- [ ] Imprimir o tener abierto `docs/guion-teoria.pdf` (qué decir en cada diapositiva). El mismo guion aparece en **Control → Clase**, debajo de la diapositiva en pantalla.
- [ ] Poner la variable `GUEST_MEET_URL` en Vercel (enlace de Meet con Oscar) y confirmar con KOSMOS TIC la conexión de las **3:30 p. m.** El botón **Abrir Meet** aparece en Control → Invitado.
- [ ] 12:45 p. m.: proyector en **Sala**. Los estudiantes van entrando y su nombre se pone verde.

### 2.1 Prueba de carga (¿se va a caer?)

Simula los 27 celulares durante unos minutos: cada uno entra, envía su señal de asistencia y pide el estado de la clase cada 3 segundos (el peor caso, cuando falla el canal en vivo).

1. **Control → Ajustes → Mostrar códigos → Copiar para la prueba de carga.**
2. Desde la carpeta del proyecto:
   ```bash
   npm run carga -- --url https://su-app.vercel.app --codigos "EQ01=1234,EQ02=5678,…" --minutos 3
   ```
3. Al final imprime una tabla con tiempos y errores, y un veredicto: **aguanta** si el 95 % de las respuestas tarda menos de 1,5 s y hay menos de 1 % de errores.
4. **Reinicien la partida** después, para borrar la asistencia de prueba.

Esta prueba mide el servidor y la base de datos. El wifi del salón solo se prueba en el ensayo con celulares reales.

## 3. Durante la clase

**Sin materiales:** el lienzo, la Galería, el Semáforo, el quiz, los TecnoCoins y las crisis están en la app. Solo se necesitan el proyector con sonido, un computador para el panel y los celulares.

| Hora | Actividad | Qué hacer en `/control` |
|---|---|---|
| 12:45 | Sala de espera | Pestaña **Asistencia**: ver quién falta |
| 1:00 | Alerta Roja (sin video: se abre con la frase de la portada) | ▶ en el cronograma → **Iniciar**. La teoría salta sola a su diapositiva |
| 1:10 | Fuentes y expediente KOSMOS TIC | Pestaña **Clase**: avanzar diapositivas. Al cerrar: **🎯 Lanzar** (bloque Fuentes) |
| 1:22–2:42 | Niveles 1 a 6 + juego | Diapositivas → sorpresa al cerrar cada nivel (el panel sugiere el bloque) → Mercado y crisis. Los grupos llenan su **Lienzo** en el celular; el avance se ve en la pestaña **Lienzos** |
| 2:34 | Pausa activa (hasta las 2:42) | Diapositiva de pausa: 60 segundos de pie |
| 2:42 | Semáforo | Pestaña **Semáforo**: abrir, votar de pie con el celular, revelar |
| 2:52 | Galería | Pestaña **Galería** → **Abrir votación** (los lienzos se cierran). El proyector rota los lienzos cada 15 s o muestra el que fijen en **Lienzos → Proyectar este lienzo**; el vocero lo defiende en 20 s |
| 2:58 | Quiz final | Pestaña **Quiz**: Iniciar → Revelar → Siguiente (12 preguntas, 20 s cada una) |
| 3:10 | Notas y premiación | Pestaña **Lienzos**: José califica la rúbrica (puede hacerlo durante la Galería) → **Notas → Descargar para Excel** · proyector en **Podio** |
| 3:20 | Afinar pregunta y probar el Meet | Los grupos escriben su pregunta en la pestaña **Invitado** del celular. En **Control → Invitado**, **Abrir Meet** y probar audio con Oscar |
| 3:30 | KOSMOS TIC en vivo (lo último de la clase) | Pestaña **Invitado**: **En pantalla** en orden (del nivel 1 al 6) y **Marcar hecha**. Al final, diapositiva de cierre y despedida a las 4:00 p. m. |

**Tip para Meet:** en Google Meet usen *Presentar → Una pestaña* con `/proyector`. Así KOSMOS TIC ve en pantalla la pregunta de cada grupo mientras la escucha.

### Preguntas sorpresa
- Llegan a pantalla completa en el celular de los escogidos, con vibración y 45 segundos.
- La app escoge **al azar entre los conectados**, empezando por quienes menos preguntas han recibido. A nadie se le repite la misma pregunta.
- El proyector muestra **los nombres** (no la pregunta) y quién ya respondió.
- **Sin señal:** si el celular pierde la conexión, la respuesta queda guardada en el celular y se envía sola al reconectar (hay 60 segundos de margen).
- **Anular:** si a alguien se le apagó el celular, en **Clase → Historial** pulsen **Anular**. Esa pregunta no cuenta en su nota y el estudiante vuelve a la fila para otra.

### Lienzo digital
- Pestaña **Lienzo** del celular: 6 casillas, una por nivel del ciclo. Se guarda solo mientras escriben; cada casilla se guarda por separado, así dos integrantes no se pisan.
- La casilla de la actividad en curso se resalta con "Ahora".
- Cuando abre la Galería, el lienzo se cierra para que todos voten sobre la misma versión, y todos los grupos pueden leer los lienzos de los demás.
- **Rúbrica** (pestaña **Lienzos**): 6 criterios de 1 a 5; la nota del lienzo es el promedio de los criterios calificados.

### Pregunta al invitado
En **Invitado**, **Corregir** permite pulir la redacción de la pregunta de un grupo antes de ponerla en pantalla.

### Asistencia
Cada celular envía una señal cada 15 segundos. Un estudiante está "conectado" si dio señal en los últimos 45 segundos. **Si alguien no tiene celular o batería**, puede entrar desde el de un compañero con el botón **Cambiar** (cierra la sesión del otro en ese celular).

### Nota de 0 a 5
| Componente | Peso por defecto | Cómo se calcula |
|---|---|---|
| Preguntas sorpresa (individual) | 25 % | aciertos ÷ preguntas recibidas × 5 |
| Quiz final (individual) | 30 % | aciertos ÷ preguntas abiertas × 5 |
| Lienzo (grupo) | 30 % | promedio de la rúbrica que pone José en **Lienzos** |
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

### Teoría con el control remoto
- El clicker envía teclas: **PageDown / → / ↓** avanzan, **PageUp / ← / ↑** retroceden (`src/app/proyector/usePresenterKeys.ts`). El botón del puntero láser no envía teclas.
- Requiere sesión docente en el navegador del proyector (la acción `controlSlides` exige `requireStaff`). Si no la hay, el proyector muestra un aviso al pulsar.
- Si cambian las diapositivas, actualicen también `src/domain/data/guion.ts` (una prueba falla si falta alguna) y regeneren el PDF con `scripts/exportar-guion.mjs` y `scripts/generar-guion.py` (requiere `reportlab==4.2.5`).

### Conexión con el invitado (Oscar, KOSMOS TIC)
- Es la **última actividad**: de 3:30 a 4:00 p. m. Las notas, el podio y el quiz se hacen antes.
- El enlace de Meet vive en la variable de entorno `GUEST_MEET_URL` (Vercel y `.env.local`). No está en el código porque `src/domain/data` llega a los celulares; solo el panel docente lo recibe.
