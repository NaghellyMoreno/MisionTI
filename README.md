# Misión TI · Rescate Empresarial

App de la clase **Gestión de Recursos Tecnológicos**: presenta la teoría, lleva el juego, lanza preguntas sorpresa, modera la entrevista con **KOSMOS TIC** por Google Meet, hace el quiz final y calcula la nota de 0 a 5.

**Clase:** miércoles 4 de noviembre de 2026, de 1:00 a 4:00 p. m. App publicada en <https://mision-ti.vercel.app>.

| Ruta | Quién | Para qué |
|---|---|---|
| `/` | Estudiantes | Ingreso: grupo → nombre → código del grupo |
| `/equipo` | Cada estudiante, en su celular | Clase en vivo, sorpresas, Mercado, lienzo, pregunta al invitado, votaciones, quiz |
| `/control` | José, Karen, Dylber, Camila | Ingreso docente (nombre + código): cronograma, teoría, sorpresas, compras, crisis, invitado, quiz, notas |
| `/proyector` | Video beam | Sala (con QR de ingreso), teoría, ranking, crisis, sorpresas, invitado, quiz y podio |

---

## 1. Publicación

**Supabase:** proyecto nuevo → SQL Editor → ejecutar [`supabase/schema.sql`](supabase/schema.sql). Si ya tenían una versión anterior, ejecuten en orden las migraciones que falten: [`migracion-v2.sql`](supabase/migracion-v2.sql) y [`migracion-v3.sql`](supabase/migracion-v3.sql). Ninguna borra datos.

**Vercel:** variables de entorno (Settings → Environment Variables) y luego **Redeploy**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave anon / publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | clave service_role / secret (privada) |
| `STAFF_PIN` | código de 4 dígitos del equipo docente (ya configurado en Vercel y `.env.local`; `2026` solo se usa en local sin Supabase) |
| `SESSION_SECRET` | frase larga y aleatoria (32+ caracteres) |
| `GUEST_MEET_URL` | enlace de Google Meet con el invitado. Solo lo ve el panel docente (no va en el código porque `src/domain/data` llega a los celulares) |
| `APP_URL` | opcional: dirección que muestra el QR de la sala (si no, se toma de la petición) |

---

## 2. El día de la clase

**Antes (12:30 p. m.)**
- [ ] **Control → Ajustes → Reiniciar partida** (escribir `REINICIAR`): borra compras, respuestas, preguntas y asistencia; conserva los pesos de la nota.
- [ ] **Control → Ajustes → Mostrar códigos**: tengan a mano el código de cada grupo (no lo proyecten).
- [ ] Computador del video beam: ingresar como docente en el navegador, abrir `/proyector` en pantalla completa (F11) y pulsar **🔇 Activar sonido**.
- [ ] Control remoto (clicker): conectar el receptor USB y probar que ▶ y ◀ pasan las diapositivas (solo funcionan cuando el proyector está en **Teoría**). El botón de pantalla en negro es `.` o `B`; `Esc` o cualquier avance lo quita.
- [ ] **Control → Invitado → Abrir Meet** lleva al Meet con Oscar.
- [ ] Repasar el flujo por rol y etapa en [`docs/flujo-clase.html`](docs/flujo-clase.html).
- [ ] Tener a mano [`docs/guion-teoria.pdf`](docs/guion-teoria.pdf) (qué decir en cada diapositiva; también aparece en **Control → Clase**).
- [ ] 12:45 p. m.: en Control, en **"En el proyector"**, elegir **Sala**. Los estudiantes escanean el QR y su nombre se pone verde. Si el wifi falla, que usen datos móviles.

**Durante**

| Hora | Actividad | Qué hacer en `/control` |
|---|---|---|
| 12:45 | Sala de espera | Pestaña **Asistencia**: ver quién falta |
| 1:00 | Alerta Roja | ▶ en el cronograma → **Iniciar**. La teoría salta sola a su diapositiva |
| 1:10 | Fuentes y expediente KOSMOS TIC | **Clase**: avanzar diapositivas. Al cerrar: **🎯 Lanzar** |
| 1:17–2:34 | Mecánica, niveles 1 a 6 y juego | Diapositivas → sorpresa al cerrar cada nivel (el panel sugiere el bloque) → Mercado y crisis. El avance de los lienzos se ve en **Lienzos** |
| 2:34 | Pausa activa (hasta las 2:42) | Diapositiva de pausa: 60 segundos de pie |
| 2:42 | Semáforo | **Semáforo**: abrir, votar de pie con el celular, revelar |
| 2:52 | Galería | **Galería** → **Abrir votación** (los lienzos se cierran). El proyector rota los lienzos cada 15 s o muestra el que fijen en **Lienzos → Proyectar este lienzo** |
| 2:58 | Quiz final (15 min) | **Quiz**: **Iniciar quiz**. Cada estudiante responde las 12 preguntas a su ritmo, en un orden distinto. Si todos terminan antes, el proyector lo avisa. Luego **Terminar y mostrar ranking** |
| 3:13 | Notas y premiación | **Lienzos**: José califica la rúbrica → **Notas → Descargar para Excel** · proyector en **Podio** |
| 3:20 | Afinar pregunta y probar el Meet | Los grupos escriben su pregunta en **Invitado**. **Abrir Meet** y probar audio con Oscar |
| 3:30 | KOSMOS TIC en vivo (lo último, hasta las 4:00) | **Invitado**: **En pantalla** en orden (nivel 1 al 6) y **Marcar hecha**. Cierre con la última diapositiva |

**Tip para Meet:** usen *Presentar → Una pestaña* con `/proyector` para que KOSMOS TIC vea la pregunta de cada grupo.

### Cómo funciona

- **Preguntas sorpresa:** llegan a pantalla completa en el celular de los escogidos, con 45 segundos. La app escoge al azar entre los conectados, empezando por quienes menos han recibido. Si el celular pierde la señal, la respuesta se guarda y se envía al reconectar, pero solo cuenta si llega antes del límite más 3 s de margen; si llega tarde, el celular avisa que no contó. Si a alguien se le apagó el celular, en **Clase → Historial** pulsen **Anular**: no cuenta en su nota y vuelve a la fila.
- **Lienzo:** 6 casillas, una por nivel del ciclo; se guardan solas. Al abrir la Galería el lienzo se cierra y todos pueden leer los de los demás. La nota del lienzo es el promedio de los criterios de la rúbrica (1 a 5).
- **Quiz final:** 15 minutos en total y 12 preguntas en orden aleatorio por estudiante (siempre el mismo para cada uno, aunque recargue). Cada respuesta es definitiva y no se dice si fue correcta hasta el final. Pasados los 15 minutos (más 3 s de margen) no se aceptan respuestas. Ranking: más aciertos y, a igualdad, menos tiempo. **Volver a empezar** pide confirmación y borra solo las respuestas del quiz.
- **Pregunta al invitado:** en **Invitado**, **Corregir** permite pulir la redacción antes de ponerla en pantalla.
- **Asistencia:** un estudiante está "conectado" si dio señal en los últimos 45 s. Quien no tenga celular o batería puede entrar desde el de un compañero con el botón **Cambiar**.

### Nota de 0 a 5

| Componente | Peso | Cómo se calcula |
|---|---|---|
| Preguntas sorpresa (individual) | 25 % | aciertos ÷ preguntas recibidas × 5 |
| Quiz final (individual) | 30 % | aciertos ÷ 12 × 5 (las no respondidas cuentan como error) |
| Lienzo (grupo) | 30 % | promedio de la rúbrica de José |
| Manejo del presupuesto (grupo) | 15 % | de 3,0 (menor saldo) a 5,0 (mayor saldo) |

Cada componente va de 0 a 5 y la nota final es su promedio ponderado: nunca pasa de 5,0. Los aciertos se recalculan con la clave de respuestas. Los pesos se cambian en **Notas** (deben sumar 100 %). Si a alguien no le tocó sorpresa, ese componente se excluye y su peso se reparte entre los demás (la tabla lo marca con *, y el CSV trae la columna «Pesos aplicados»). Si hay datos fuera de rango, no se usan y la fila dice «revisar».

---

## 3. Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000 (sin Supabase arranca en memoria; código docente: 2026)
npm test           # reglas del juego, preguntas, asistencia, notas y guion
npm run carga -- --url https://mision-ti.vercel.app --codigos "EQ01=…,EQ02=…" --minutos 3   # prueba de carga (reinicien la partida después)
```

- **Contenido:** diapositivas en [`lessons.ts`](src/domain/data/lessons.ts), guion en [`guion.ts`](src/domain/data/guion.ts) (una prueba falla si falta alguna diapositiva), cronograma en [`agenda.ts`](src/domain/data/agenda.ts), preguntas en [`questions.ts`](src/domain/data/questions.ts) y temas de entrevista en [`guest.ts`](src/domain/data/guest.ts).
- **PDF del guion:** `node scripts/exportar-guion.mjs teoria.json` y luego `python scripts/generar-guion.py teoria.json docs/guion-teoria.pdf` (requiere `reportlab==4.2.5`).
- **Fuentes:** sobre KOSMOS TIC solo su catálogo oficial y [kosmostic.com](https://kosmostic.com), con citas textuales. `www.butic.com` no es de la empresa: no se usa.
- **Arquitectura y reglas de diseño (SOLID):** ver [`CLAUDE.md`](CLAUDE.md).
