# Misión TI · Rescate Empresarial

Tablero en vivo del juego de la clase **Gestión de Recursos Tecnológicos**.
Los 11 grupos juegan desde el celular; el equipo docente controla la partida desde un panel y el video beam muestra el proyector.

| Ruta | Quién la usa | Para qué |
|---|---|---|
| `/` | Todos | Ingreso: grupo + código de 4 dígitos, o equipo docente |
| `/equipo` | Cada grupo (celular) | Saldo, Mercado, inventario, crisis, Semáforo y Galería |
| `/control` | José, Karen, Dylber, Camila | Aprobar compras, lanzar crisis, temporizador, Semáforo, Galería, ajustes |
| `/proyector` | Video beam | Ranking, crisis, Semáforo, Galería y podio (solo lectura) |

---

## 1. Publicarla (unos 15 minutos)

### Paso 1 · Base de datos en Supabase
1. Entren a <https://supabase.com> → **New project** (plan gratuito). Guarden la contraseña que les pida.
2. Cuando termine de crearse: **SQL Editor → New query**, peguen todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y presionen **Run**.
   Esto crea las tablas, los 11 grupos con sus integrantes, 100 TC por grupo y un código aleatorio para cada grupo.
3. Vayan a **Project Settings → API Keys** y copien:
   - la **URL del proyecto** (`https://xxxx.supabase.co`, en *Project Settings → Data API*),
   - la clave **anon / publishable**,
   - la clave **service_role / secret** (¡esta es privada, nunca la publiquen!).
   > Si ven dos pestañas de claves, usen las de **Legacy API keys** (`anon` y `service_role`).

### Paso 2 · Subir el código a GitHub
```bash
git init
git add .
git commit -m "Misión TI"
git branch -M main
git remote add origin https://github.com/SU-USUARIO/mision-ti.git
git push -u origin main
```

### Paso 3 · Desplegar en Vercel
1. En <https://vercel.com/new> importen el repositorio `mision-ti`. Vercel detecta Next.js solo.
2. Antes de **Deploy**, abran **Environment Variables** y agreguen:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave anon / publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | clave service_role / secret |
| `STAFF_PIN` | código de 4 dígitos del equipo docente (ej. `2026`) |
| `SESSION_SECRET` | una frase larga y aleatoria (mínimo 32 caracteres) |

3. **Deploy**. La dirección queda como `https://mision-ti-xxxx.vercel.app`.

> Si cambian una variable después, hagan **Redeploy** para que se aplique.

---

## 2. Antes de la clase

- [ ] Hagan un **ensayo completo** con 2 o 3 celulares: compra, aprobación, una crisis, una situación del Semáforo.
- [ ] Terminado el ensayo: **Control → Ajustes → Reiniciar partida** (escriban `REINICIAR`).
- [ ] En **Control → Ajustes → Mostrar códigos**, impriman o anoten el código de cada grupo para entregarlo en el sobre.
- [ ] Generen un código QR con la dirección de la app y pónganlo en la diapositiva de la Mecánica del juego.
- [ ] Abran `/proyector` en el computador del video beam (pantalla completa con F11).

## 3. Durante la clase

| Momento | Quién | Qué hacer en `/control` |
|---|---|---|
| Inicio de cada actividad | Karen (cronometrista) | ▶ siguiente actividad e **Iniciar** el temporizador |
| Nivel 2 · Mercado | Karen | **Abrir mercado** → pestaña **Solicitudes** → Aprobar / Rechazar |
| Minuto 8 del Mercado y Niveles 3‑4 | Dylber | Pestaña **Crisis** → **Lanzar carta**. El efecto se aplica solo |
| Oportunidad inesperada | Dylber / José | Lanzar la carta y luego **Ajustes → Ajuste manual** a los grupos que convenzan |
| Juego Semáforo | Camila | Pestaña **Semáforo** → **Abrir** situación → **Revelar y pagar aciertos** |
| Galería | José | Pestaña **Galería** → **Abrir votación** → **Cerrar y revelar** |
| Cierre | José | En el proyector: botón **Podio** |

El proyector cambia solo cuando lanzan una crisis, abren el Semáforo o la Galería. También pueden elegir la pantalla con los botones **En el proyector**.

### Reglas que aplica la app
- Cada grupo empieza con **100 TC**. Las compras se cobran **solo al aprobarlas**, y las solicitudes pendientes reservan saldo.
- Cada recurso se puede tener una sola vez. Toda solicitud exige **ruta de adquisición** y **justificación**.
- Las entidades públicas (Alcaldía) deben usar una ruta de contratación estatal; si no, la **Auditoría** las castiga.
- Cada carta de crisis se juega una vez. Semáforo: **+5 TC** por acierto, pagado una sola vez por situación.
- Galería: 2 votos por grupo, nunca por el propio.

---

## 4. Probarla en su computador (opcional)

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # pruebas de las reglas del juego
```
Sin las variables de Supabase la app arranca en **modo local en memoria** (se ve el aviso "Modo local").
Código del equipo docente en local: `2026`. Códigos de los grupos en local: Control → Ajustes → Mostrar códigos.

---

## 5. Arquitectura y principios SOLID

```
src/
├─ domain/          Reglas puras del juego (sin Next.js, sin Supabase)
│  ├─ types.ts        Entidades
│  ├─ data/           Catálogo, casos, grupos, cronograma, situaciones
│  ├─ crisis/         Cartas de crisis (patrón Strategy)
│  └─ rules.ts        Políticas: saldo, ranking, compras, temporizador
├─ application/     Casos de uso + puertos (interfaces)
│  ├─ ports.ts        TeamDirectory, LedgerRepository, PurchaseRepository…
│  ├─ usecases/       RequestPurchase, ResolvePurchase, TriggerCrisis, …
│  └─ snapshot.ts     Consulta: arma la vista de cada tipo de usuario
├─ infrastructure/  Adaptadores
│  ├─ memory/         Implementación en memoria (local y pruebas)
│  ├─ supabase/       Implementación con Supabase + aviso Realtime
│  ├─ container.ts    Raíz de composición (elige la implementación)
│  └─ session.ts      Cookie de sesión firmada
├─ app/             Pantallas (Next.js App Router) y server actions
└─ ui/              Componentes y hooks compartidos
```

| Principio | Dónde se aplica |
|---|---|
| **S** · Responsabilidad única | Cada caso de uso hace una sola cosa (`RequestPurchase`, `ResolvePurchase`, `TriggerCrisis`…). `PurchasePolicy` solo valida compras; `actions.ts` solo autentica y delega. |
| **O** · Abierto/cerrado | Para agregar una crisis nueva se crea una clase que implemente `CrisisEffect` y se añade a `CRISIS_DECK`. `TriggerCrisis` no se modifica. |
| **L** · Sustitución de Liskov | `createInMemoryGame()` y `createSupabaseGame()` cumplen los mismos contratos; las pruebas usan una y producción la otra sin cambiar ningún caso de uso. |
| **I** · Segregación de interfaces | Puertos pequeños (`TeamDirectory`, `AccessCodes`, `LedgerRepository`, `VoteRepository`, `ChangeNotifier`, `Resettable`). Cada caso de uso pide solo los que usa (`Pick<GameDependencies, …>`). |
| **D** · Inversión de dependencias | El dominio y los casos de uso dependen de interfaces de `ports.ts`; `container.ts` es el único lugar que conoce Supabase. |

### Seguridad
- Las tablas tienen RLS activado **sin políticas**: el navegador no puede leer ni escribir nada directamente.
- Todas las escrituras pasan por *server actions* que verifican la sesión (grupo o equipo docente).
- La clave `service_role` solo existe en el servidor de Vercel.
- Los votos del Semáforo de otros grupos se ocultan hasta revelar.

### Tiempo real
Después de cada cambio el servidor envía un aviso por **Supabase Realtime (Broadcast)** y todas las pantallas recargan su estado.
Si ese aviso no llega, las pantallas consultan cada 3 segundos, así que el juego no se detiene.

### Personalizar
- **Grupos o integrantes:** editen la tabla `teams` en Supabase (Table Editor) y `src/domain/data/teams.ts` para el modo local.
- **Precios del catálogo:** `src/domain/data/catalog.ts`.
- **Situaciones del Semáforo:** `src/domain/data/semaforo.ts`.
- **Cronograma:** `src/domain/data/agenda.ts`.
