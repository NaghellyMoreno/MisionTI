/**
 * Guion para quien presenta: qué decir en cada diapositiva de `lessons.ts`.
 * Solo reorganiza lo que ya dicen las diapositivas y sus fuentes; no agrega datos
 * de KOSMOS TIC que no estén en su catálogo o en kosmostic.com.
 * Se muestra en el panel (pestaña Clase) y alimenta el PDF de estudio (`scripts/generar-guion.py`).
 */
export const GUION: Record<string, string[]> = {
  alerta: [
    "Lean la frase de la portada despacio, de pie y mirando al grupo: «Una empresa puede tener la mejor tecnología… y aun así fracasar».",
    "Pregunten: «¿Alguien ha visto un computador, un programa o un equipo guardado y sin usar en una empresa?». Dos respuestas rápidas bastan.",
    "Cierren con la misión del día: ustedes son una firma consultora, tienen 100 TecnoCoins, una empresa en crisis y tres horas.",
  ],
  "que-es": [
    "Definan el tema en una frase: gestionar recursos tecnológicos es acompañar la tecnología durante toda su vida en la organización, desde antes de comprarla hasta que se retira.",
    "Recorran los 6 niveles del ciclo de vida sin explicarlos todavía: solo nómbrenlos. Son el mapa de toda la clase.",
    "Anuncien que cada nivel tiene su bloque, su pregunta sorpresa y su casilla en el lienzo del celular.",
    "Fuentes de respaldo: ISO/IEC 19770-1, ISO 55000 y el MRAE v3.0 de MinTIC.",
  ],
  fuentes: [
    "Expliquen que nada de lo que verán hoy sale de la nada: hay cuatro tipos de fuente.",
    "Bibliografía: ISO/IEC 19770-1 (activos de TI), ISO 55000 (gestión de activos), ITIL 4, COBIT 2019 y NIST SP 800-88 (borrado seguro).",
    "Guía oficial colombiana: el Marco de Referencia de Arquitectura Empresarial v3.0 de MinTIC (2023). Normativa: Leyes 80 de 1993, 1150 de 2007, 1581 de 2012, 1672 de 2013 y 2300 de 2023.",
    "Empresa real y experto: el catálogo oficial y el sitio de KOSMOS TIC, y su conexión en vivo a las 2:47 p. m.",
    "Al cerrar este bloque, lancen la pregunta sorpresa del banco «Fuentes».",
  ],
  expediente: [
    "Presenten a la empresa invitada solo con lo que dice su propia información: sede en Manizales, más de 15 años en telecomunicaciones.",
    "Se especializa en soluciones VoIP para empresas, call centers, contact centers y pymes; con BU-TIC asesora en CRM y estrategia comercial.",
    "Lean la misión textual de kosmostic.com: «Ser el aliado tecnológico que garantiza que tu empresa nunca deje de comunicarse».",
    "No agreguen cifras ni clientes que no estén en el catálogo.",
  ],
  "mision-entrevista": [
    "Expliquen la misión secreta: cada grupo tiene un tema asignado en la pestaña Invitado del celular.",
    "Durante la clase van a salir pistas con el ícono 🔎 en las diapositivas de KOSMOS TIC; esa pista les sirve para su pregunta.",
    "Fecha límite: escribir la pregunta antes de las 2:47 p. m., cuando se conecta KOSMOS TIC.",
  ],
  juego: [
    "Explicar la mecánica en menos de 5 minutos: cada grupo recibe una empresa en crisis y 100 TecnoCoins.",
    "Compran en el Mercado desde el celular, eligiendo recurso, ruta legal y escribiendo por qué lo necesitan.",
    "Las cartas de crisis premian o castigan las decisiones.",
    "Adviertan con una sonrisa: la app puede escoger a cualquiera para una pregunta sorpresa individual, así que todos deben estar atentos.",
  ],
  nivel1: [
    "Idea central: antes de comprar nada, ¿qué problema del negocio queremos resolver?",
    "Cuatro preguntas del diagnóstico: cómo es la situación actual (inventario de lo que hay), qué necesidades específicas cuestan dinero, tiempo o clientes, qué oportunidades tecnológicas se pueden aprovechar y qué retos pueden frenar el cambio.",
    "Lean la cita del MRAE: la situación actual es la «línea base», la forma como opera hoy la organización.",
    "Ejemplo corto para el salón: una empresa que compra equipos nuevos sin saber qué le falla hoy, gasta sin resolver el problema.",
  ],
  "nivel1-kosmos": [
    "Conecten la teoría con la empresa real: el método de KOSMOS TIC en estrategias de servicio al cliente empieza por un diagnóstico.",
    "Lean la cita textual: «Diagnóstico Integral: Analizamos tus procesos actuales de atención para identificar oportunidades de mejora».",
    "Después vienen diseño de estrategia, implementación y medición de resultados: es decir, el diagnóstico es el primer paso de un ciclo.",
    "Esta diapositiva es pista para el grupo EQ01.",
    "Al cerrar el bloque, lancen la pregunta sorpresa del banco «Nivel 1».",
  ],
  lienzo1: [
    "Pasen de escuchar a hacer: abran la pestaña Lienzo del celular, casilla 1. Se guarda sola.",
    "Regla de trabajo: una persona dicta y otra escribe, y rotan en cada casilla.",
    "Qué deben dejar escrito: la situación actual, tres necesidades específicas, una oportunidad tecnológica y el reto principal.",
    "Tiempo: 8 minutos. Recorran los grupos y revisen el avance en la pestaña Lienzos del panel.",
  ],
  nivel2: [
    "Idea central: decidir qué adquirir y con qué método, antes de gastar.",
    "Distingan recursos tangibles (equipos, red) de intangibles (licencias, servicios, conocimiento).",
    "Métodos: compra, leasing, suscripción, desarrollo o donación.",
    "Costo total de propiedad: comprar es solo el comienzo; también cuestan la operación, el mantenimiento y el retiro.",
    "Lean la cita del MRAE: dar prioridad a adquisiciones como servicio o por demanda y minimizar la compra de hardware.",
  ],
  "ruta-legal": [
    "Pregunta guía: ¿todas las empresas compran igual? No.",
    "Empresa privada: orden de compra o contrato entre particulares.",
    "Entidad pública: contratación estatal (Ley 80 de 1993 y Ley 1150 de 2007): licitación pública, selección abreviada, concurso de méritos o contratación directa.",
    "Compras pequeñas del Estado: mínima cuantía (Ley 1474 de 2011, art. 94).",
    "Conexión con el juego: al comprar en el Mercado, la ruta legal debe corresponder al tipo de empresa. Una entidad pública no puede usar una orden de compra privada.",
  ],
  "nivel2-kosmos": [
    "Lean la cita del catálogo: sistemas en la nube que crecen con el negocio, sin grandes inversiones iniciales en infraestructura.",
    "Relacionen con la teoría: suscribirse a un servicio en lugar de comprar servidores es una decisión del nivel 2.",
    "Su IP PBX es una central telefónica que opera en la nube.",
    "Pista para los grupos EQ02 y EQ14.",
    "Al cerrar el bloque, lancen la pregunta sorpresa del banco «Nivel 2».",
  ],
  ley2300: [
    "Presenten la ley por su apodo, «Dejen de fregar», y explíquenla: KOSMOS TIC vende SMS masivos y campañas de voz y de email, y esta ley dice cuándo se pueden usar con fines comerciales.",
    "Aplica a SMS, mensajería por aplicaciones o web, correos electrónicos y llamadas.",
    "Horarios: lunes a viernes de 7:00 a. m. a 7:00 p. m.; sábados de 8:00 a. m. a 3:00 p. m.",
    "Nunca domingos ni festivos, y no más de un contacto al día.",
    "Pista para el grupo EQ06.",
  ],
  mercado: [
    "Anuncien que el Mercado está abierto (el panel lo abre).",
    "Cada compra necesita: el recurso, la ruta legal y una justificación escrita. El equipo docente aprueba o rechaza.",
    "Recuerden que el presupuesto no alcanza para todo: prioricen según su diagnóstico.",
    "Avisen que vienen crisis. Al terminar, casilla 2 del lienzo: qué compraron y por qué ruta.",
    "Karen y Dylber lanzan una carta de crisis hacia el minuto 8 del bloque.",
  ],
  nivel3: [
    "Idea central: un recurso comprado todavía no sirve; hay que ponerlo a funcionar.",
    "Ubicación física (sede, oficina, centro de datos, puesto de trabajo) y ubicación lógica (red, nube, segmentos, permisos).",
    "Configurar, instalar y probar antes de entregarlo a los usuarios.",
    "Lean la cita del MRAE: durante la implementación y el paso a producción se debe garantizar la estabilidad de la operación de TI.",
  ],
  "nivel3-kosmos": [
    "Muestren cómo la tecnología puede no tener un lugar físico fijo: el número virtual DID (Direct Inward Dialing) es un número sin línea física específica que recibe llamadas a través de internet.",
    "Omnicanalidad: WhatsApp, chat web, correo y redes en una sola plataforma.",
    "Lean la frase del catálogo sobre conectar sus soluciones con los sistemas existentes del cliente.",
    "Pista para los grupos EQ04 y EQ05.",
  ],
  nivel4: [
    "Idea central: el recurso solo vale si la gente lo usa bien.",
    "Tres preguntas: a quién (usuarios finales, administradores, soporte), qué temas (lo que cada rol necesita) y cómo sacarle el máximo partido (formación por roles, multiplicadores internos y medir el uso real).",
    "Gestión del cambio cada vez que se adquiere o despliega una solución nueva.",
    "Lean la cita del MRAE sobre uso y apropiación de TI: movilizar a los grupos de interés para impulsar la adopción.",
  ],
  "nivel4-kosmos": [
    "Lean la cita del catálogo: «Capacitación Especializada: Formamos a tu equipo con programas personalizados para maximizar el uso de las herramientas tecnológicas».",
    "Cuenten el testimonio del catálogo: un cliente dice que el equipo «no solo configuró el sistema, sino que nos enseñó a aprovecharlo al máximo».",
    "Mensaje: configurar no basta, hay que enseñar.",
    "Pista para el grupo EQ07.",
  ],
  lienzo2: [
    "Pestaña Lienzo del celular, casillas 3 y 4.",
    "Casilla 3: dónde queda cada recurso, en lo físico o en lo lógico.",
    "Casilla 4: a quién capacitar, en qué y cómo.",
    "Segunda carta de crisis hacia la mitad del bloque (10 minutos).",
    "Al cerrar el bloque de niveles 3 y 4, lancen la pregunta sorpresa «Niveles 3 y 4».",
  ],
  nivel5: [
    "Idea central: la mayor parte de la vida de un recurso transcurre aquí, operando.",
    "Soporte técnico: una mesa de servicio como único punto de contacto, con soporte de primer, segundo y tercer nivel.",
    "Mantenimiento: preventivo (antes de que falle), correctivo (cuando falla) y evolutivo (para mejorar).",
    "Administración: inventario, licencias, contratos con acuerdos de nivel de servicio (ANS) e indicadores durante toda su estadía.",
    "Lean la cita del MRAE: plan de mantenimiento preventivo y evolutivo sobre toda la infraestructura y los servicios tecnológicos.",
  ],
  "nivel5-kosmos": [
    "Lean la cita del catálogo: acompañamiento técnico permanente con actualizaciones automáticas y mantenimiento incluido.",
    "El catálogo anuncia soporte 24/7 y miden KPIs: tiempos de respuesta, satisfacción de clientes y NPS.",
    "Conecten con la teoría: medir es lo que permite sostener la operación.",
    "Pista para los grupos EQ09 y EQ10.",
  ],
  nivel6: [
    "Idea central: todo recurso termina; la pregunta es cómo retirarlo bien.",
    "Dos motivos de retiro. Por daño: no funciona y repararlo no es rentable. Por obsolescencia: funciona, pero ya no le sirve a la organización (sin soporte del fabricante, incompatible o ineficiente).",
    "Antes de retirarlo: borrado seguro de los medios para que recuperar los datos sea inviable (NIST SP 800-88) y protección de datos personales (Ley 1581 de 2012).",
    "Después: disposición responsable como RAEE, residuos de aparatos eléctricos y electrónicos (Ley 1672 de 2013).",
    "Lean la cita del MRAE sobre la correcta disposición de residuos tecnológicos.",
    "Al cerrar los niveles 5 y 6, lancen la pregunta sorpresa «Niveles 5 y 6».",
  ],
  "nivel6-kosmos": [
    "Lean la cita del catálogo sobre SIP Trunk: facilita el envío y recepción de llamadas vía IP, eliminando las líneas físicas y usando internet como medio de conexión.",
    "Pregunta para el salón: ¿qué pasa con las centrales telefónicas tradicionales cuando una empresa migra a IP?",
    "El catálogo promete «protección de datos con estándares internacionales»: conecten con el borrado seguro y la Ley 1581.",
    "Pista para los grupos EQ11 y EQ12.",
  ],
  lienzo3: [
    "Pestaña Lienzo del celular, casillas 5 y 6.",
    "Casilla 5: quién da soporte y cada cuánto se hace mantenimiento.",
    "Casilla 6: cuándo darían de baja su recurso principal, por daño o por obsolescencia.",
    "Avisen que al abrir la Galería el lienzo se cierra, así que terminen a tiempo.",
  ],
  pausa: [
    "Pausa activa de 60 segundos con todos de pie, antes de soltar el descanso.",
    "Brazos arriba y estiren; giren el cuello despacio; choquen la mano con alguien de otro grupo.",
    "Anuncien la hora de regreso y que el siguiente bloque es la entrevista con KOSMOS TIC.",
  ],
  afinar: [
    "Últimos 5 minutos antes de la conexión.",
    "Revisen la pista del tema en la pestaña Invitado del celular.",
    "Una sola pregunta de máximo 30 segundos, conectada con la empresa del juego, para que sea más interesante.",
    "Camila puede corregir la redacción desde el panel antes de ponerla en pantalla.",
  ],
  "en-vivo": [
    "Entrevista tipo podcast por Google Meet, a las 2:47 p. m.",
    "Las preguntas van en orden del ciclo de vida: del diagnóstico al fin de ciclo.",
    "Presenten al invitado, den la palabra y marquen cada pregunta como hecha en el panel (pestaña Invitado).",
    "Si lo desean, compartan la pestaña del proyector por Meet para que KOSMOS TIC vea la pregunta en pantalla.",
  ],
  semaforo: [
    "Fase 4, evaluación. Juego de pie: cada grupo vota y levanta el celular con su color.",
    "Verde: mantener. Amarillo: soporte o mantenimiento. Rojo: dar de baja (¿por daño o por obsolescencia?).",
    "Se revela la respuesta con su explicación y se premia a los grupos que acertaron.",
  ],
  galeria: [
    "El proyector muestra cada lienzo; en el celular pueden leerlos todos.",
    "Cuando aparezca su lienzo, el vocero lo defiende de pie en 20 segundos.",
    "Cada grupo vota por los 2 mejores, sin contar el propio.",
    "José califica la rúbrica de 6 criterios mientras avanza la Galería.",
  ],
  quiz: [
    "Quiz final individual: 12 preguntas en el celular, 20 segundos cada una.",
    "Acertar rápido da más puntos.",
    "Flujo en el panel: Iniciar, Revelar, Siguiente.",
  ],
  cierre: [
    "Lean la frase final: la tecnología no se compra, se gestiona de principio a fin.",
    "Pregunta de cierre: ¿qué cambiarían de su lienzo después de escuchar a KOSMOS TIC?",
    "Pasen a las notas, el podio y la premiación. Agradezcan a KOSMOS TIC.",
  ],
};
