#!/usr/bin/env python3
"""Genera docs/guia-fases-estudiantes.pdf: las 4 fases de la clase explicadas para los estudiantes.

No incluye respuestas del quiz, del Semáforo ni de las preguntas sorpresa, ni códigos de acceso.

    python3 -m venv .venv-pdf && .venv-pdf/bin/pip install "reportlab==4.2.5"
    .venv-pdf/bin/python scripts/generar-guia-fases.py docs/guia-fases-estudiantes.pdf
"""
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

FONT_DIR = "/System/Library/Fonts/Supplemental/"
pdfmetrics.registerFont(TTFont("Body", FONT_DIR + "Trebuchet MS.ttf"))
pdfmetrics.registerFont(TTFont("Body-Bold", FONT_DIR + "Trebuchet MS Bold.ttf"))
pdfmetrics.registerFont(TTFont("Body-Italic", FONT_DIR + "Trebuchet MS Italic.ttf"))
pdfmetrics.registerFont(TTFont("Body-BoldItalic", FONT_DIR + "Trebuchet MS Bold Italic.ttf"))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic", boldItalic="Body-BoldItalic")

BLUE = colors.HexColor("#3368A0")
SKY = colors.HexColor("#66A3BF")
MIST = colors.HexColor("#C8DFDB")
CREAM = colors.HexColor("#F2EFE7")
INK = colors.HexColor("#1B2733")
MUTED = colors.HexColor("#5B6770")
CORAL = colors.HexColor("#B5523B")
AMBER = colors.HexColor("#B7791F")
GREEN = colors.HexColor("#2F7A5C")
WHITE = colors.white

# Color de cada fase (los mismos tonos que usa la app).
PHASE = {1: SKY, 2: BLUE, 3: AMBER, 4: CORAL}

TITLE = "Misión TI · Las fases de la clase · guía para estudiantes"
MARGIN = 1.6 * cm
WIDTH = A4[0] - 2 * MARGIN


def style(name, **kw):
    base = dict(fontName="Body", fontSize=9.6, leading=13.6, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "kicker": style("kicker", fontName="Body-Bold", fontSize=8.5, textColor=BLUE),
    "title": style("title", fontName="Body-Bold", fontSize=26, leading=32, spaceBefore=4, spaceAfter=4),
    "sub": style("sub", textColor=MUTED, fontSize=10),
    "h1": style("h1", fontName="Body-Bold", fontSize=15, leading=20, spaceBefore=12, spaceAfter=4),
    "h2": style("h2", fontName="Body-Bold", fontSize=11.5, leading=15, spaceBefore=10, spaceAfter=3, textColor=BLUE),
    "lead": style("lead", textColor=MUTED, spaceAfter=6),
    "body": style("body", spaceAfter=4),
    "bullet": style("bullet", leftIndent=12, bulletIndent=2, spaceAfter=2),
    "label": style("label", fontName="Body-Bold", textColor=BLUE),
    "small": style("small", fontSize=8.5, leading=11.5, textColor=MUTED),
    "cell": style("cell", fontSize=8.5, leading=11.2),
    "cellb": style("cellb", fontSize=8.5, leading=11.2, fontName="Body-Bold"),
    "head": style("head", fontSize=8.5, leading=11, fontName="Body-Bold", textColor=BLUE),
    "bandNum": style("bandNum", fontName="Body-Bold", fontSize=26, leading=28, textColor=WHITE),
    "bandL": style("bandL", fontName="Body-Bold", fontSize=16, leading=19, textColor=WHITE),
    "bandS": style("bandS", fontSize=9, leading=12, textColor=WHITE),
    "quote": style("quote", fontName="Body-Italic", textColor=colors.HexColor("#44515E"), leftIndent=10),
    "cite": style("cite", fontSize=8, textColor=MUTED, leftIndent=10, spaceAfter=6),
}
P = lambda t, s="body": Paragraph(t, S[s])


def bullets(items):
    return [Paragraph(t, S["bullet"], bulletText="•") for t in items]


def table(headers, rows, widths, bold_first=True):
    data = [[P(h, "head") for h in headers]]
    for r in rows:
        data.append([P(c, "cellb" if (i == 0 and bold_first) else "cell") for i, c in enumerate(r)])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), MIST),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#FAF8F3")]),
        ("BOX", (0, 0), (-1, -1), 0.6, MIST),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, MIST),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def band(num, name, when, color):
    t = Table([[P(str(num), "bandNum"), [P(name, "bandL"), P(when, "bandS")]]], colWidths=[1.5 * cm, WIDTH - 1.5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (0, 0), 14),
    ]))
    return t


def facts(rows):
    """Bloque «De un vistazo»: etiqueta en azul y texto."""
    data = [[P(k, "label"), P(v, "cell")] for k, v in rows]
    t = Table(data, colWidths=[3.4 * cm, WIDTH - 3.4 * cm - 16])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    box = Table([[t]], colWidths=[WIDTH])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.8, MIST),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return box


def note(text, color=BLUE):
    t = Table([[P(text, "body")]], colWidths=[WIDTH])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E6F0EE")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def quote(text, cite):
    return [P(f"“{text}”", "quote"), P(cite, "cite")]


def page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setFont("Body", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 1.2 * cm, TITLE)
    canvas.drawRightString(A4[0] - MARGIN, 1.2 * cm, f"Página {doc.page}")
    canvas.restoreState()


def timeline():
    """Barra con la duración real de cada fase en las 3 horas."""
    parts = [("Fuente", 17, PHASE[1]), ("Entrega", 77, PHASE[2]), ("Pausa", 8, MUTED), ("Evaluación", 38, PHASE[4]), ("Invitado", 40, PHASE[3])]
    total = sum(p[1] for p in parts)
    widths = [WIDTH * p[1] / total for p in parts]
    cells = [[Paragraph(f"<b>{n}</b><br/>{m} min" if m > 10 else "", style("tl", fontSize=8, leading=10, textColor=WHITE)) for n, m, _ in parts]]
    t = Table(cells, colWidths=widths, rowHeights=[1.05 * cm])
    st = [("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 2)]
    for i, (_, _, c) in enumerate(parts):
        st.append(("BACKGROUND", (i, 0), (i, 0), c))
    t.setStyle(TableStyle(st))
    return [t, Spacer(1, 3), P("1:00 a 1:17 p. m. Fuente · 1:17 a 2:34 Entrega · 2:34 a 2:42 Pausa · 2:42 a 3:20 Evaluación · 3:20 a 4:00 p. m. Invitado", "small")]


def story():
    s = []
    # ---------- Portada ----------
    s += [
        P("MISIÓN TI · GESTIÓN DE RECURSOS TECNOLÓGICOS", "kicker"),
        P("Las fases de la clase", "title"),
        P("Guía para estudiantes · miércoles 4 de noviembre de 2026 · 1:00 a 4:00 p. m. · Ingeniería de Sistemas y Computación", "sub"),
        Spacer(1, 12),
        P("Una empresa puede tener la mejor tecnología… y aun así fracasar. Hoy su grupo es una <b>firma consultora</b> que debe "
          "rescatar una empresa en crisis con <b>100 TecnoCoins</b>. El tema es el <b>ciclo de vida de los recursos tecnológicos</b>: "
          "cómo una organización identifica lo que necesita, lo adquiere, lo pone en marcha, enseña a usarlo, lo mantiene y, al "
          "final, lo retira. La clase tiene <b>cuatro fases</b>, y esta guía explica qué pasa en cada una, para qué sirve y qué "
          "tienen que hacer ustedes."),
        P("1. Las cuatro fases de un vistazo", "h1"),
        table(["Fase", "Qué es", "Para qué sirve", "Cuándo"], [
            ["1 · Fuente", "Presentación del tema y de dónde sale la información.", "Saber qué vamos a aprender y en qué fuentes confiar.", "1:00 – 1:17 p. m."],
            ["2 · Entrega", "Taller gamificado: empresa en crisis, Mercado, cartas de crisis y lienzo. Teoría de los 6 niveles.", "Aprender el ciclo de vida aplicándolo a un caso.", "1:17 – 2:34 p. m."],
            ["3 · Invitado experto", "Entrevista en vivo con Oscar, de KOSMOS TIC.", "Contrastar lo aprendido con una empresa real.", "3:20 – 4:00 p. m."],
            ["4 · Evaluación", "Preguntas sorpresa, Semáforo, Galería, quiz y rúbrica del lienzo.", "Comprobar lo aprendido y calcular la nota de 0 a 5.", "2:42 – 3:20 p. m. (y sorpresas durante toda la clase)"],
        ], [2.6 * cm, 5.6 * cm, 5.0 * cm, WIDTH - 13.2 * cm]),
        Spacer(1, 6),
        note("<b>¿Por qué la fase 3 va de última?</b> La conexión con el invitado cierra la clase y termina a las 4:00 p. m., "
             "así que la evaluación (fase 4) se hace antes, de 2:42 a 3:20 p. m. Entre la fase 2 y la 4 hay una pausa activa de 8 minutos."),
        Spacer(1, 8),
        *timeline(),
        P("2. Antes de empezar", "h1"),
        *bullets([
            "<b>Qué necesitan:</b> su celular o computador con batería e internet. La clase no usa papel.",
            "<b>Cómo entrar:</b> desde el celular escaneen el QR del proyector; desde el computador escriban la dirección que aparece junto al QR. "
            "Elijan su grupo, su nombre y escriban el código del grupo que les entrega el equipo docente.",
            "<b>Cada quien con su nombre:</b> hay preguntas individuales que cuentan en la nota. Si a alguien se le acaba la batería, "
            "entra desde el equipo de un compañero con el botón <b>Cambiar</b>.",
            "<b>Equipo a cargo:</b> José Castellanos (director de la misión), Karen Moreno (estratega y cronometrista), "
            "Dylber Cabrera (game master) y Camila Giraldo (anfitriona y evaluación).",
        ]),
        PageBreak(),
    ]

    # ---------- Fase 1 ----------
    s += [
        band(1, "Fase 1 · Fuente", "1:00 – 1:17 p. m. · 17 minutos · lidera José", PHASE[1]),
        Spacer(1, 8),
        P("<b>Qué es.</b> Es la apertura. Se presenta el tema central de la clase y, sobre todo, <b>de dónde sale la información</b> "
          "que van a usar. En gestión de tecnología no basta con saber qué hacer: hay que poder decir en qué norma, guía o fuente se apoya cada decisión."),
        P("<b>Para qué sirve.</b> Para que sepan qué van a aprender, reconozcan qué fuentes son confiables y conozcan a la empresa real que se conectará al final."),
        P("Qué pasa en esta fase", "h2"),
        *bullets([
            "<b>1:00 · Alerta Roja (10 min):</b> arranca la misión con la frase de portada y se presenta el ciclo de vida en seis niveles.",
            "<b>1:10 · Fuentes y expediente KOSMOS TIC (7 min):</b> se muestran las cuatro fuentes de la clase, se presenta la empresa invitada y cada grupo recibe su «misión secreta»: un tema para preguntarle al invitado.",
        ]),
        P("Las cuatro fuentes", "h2"),
        table(["Fuente", "Cuáles"], [
            ["Bibliografía", "ISO/IEC 19770-1 (gestión de activos de TI), ISO 55000 (gestión de activos), ITIL 4, COBIT 2019 y NIST SP 800-88 (borrado seguro)."],
            ["Guía oficial colombiana", "Marco de Referencia de Arquitectura Empresarial (MRAE) v3.0 de MinTIC, 2023."],
            ["Normativa", "Ley 80 de 1993 y Ley 1150 de 2007 (contratación estatal), Ley 1581 de 2012 (datos personales), Ley 1672 de 2013 (residuos electrónicos) y Ley 2300 de 2023 (contacto comercial)."],
            ["Empresa real y experto", "Catálogo oficial y sitio web de KOSMOS TIC (kosmostic.com), y Oscar Fernando Giraldo Prada, en vivo a las 3:30 p. m."],
        ], [3.6 * cm, WIDTH - 3.6 * cm]),
        P("<b>Clave:</b> una fuente oficial la publica la propia organización o la autoridad que dicta la norma.", "small"),
        P("La empresa invitada: KOSMOS TIC", "h2"),
        P("Empresa colombiana con sede en Manizales y más de 15 años en telecomunicaciones. Se especializa en soluciones VoIP para "
          "empresas, call centers, contact centers y pymes, y con BU-TIC asesora en CRM y estrategia comercial."),
        *quote("Ser el aliado tecnológico que garantiza que tu empresa nunca deje de comunicarse.", "Misión publicada en kosmostic.com"),
        P("Sus servicios (conviene conocerlos para la entrevista)", "h2"),
        table(["Servicio", "Qué es"], [
            ["VoIP", "Llamadas de voz por internet."],
            ["IP PBX", "Central telefónica que opera en la nube y gestiona llamadas por red IP."],
            ["SIP Trunk", "Conecta la central de la empresa a internet con el protocolo SIP y elimina las líneas físicas."],
            ["Número virtual DID", "Número telefónico sin línea física específica que recibe llamadas de cualquier país por internet."],
            ["SMS y campañas masivas", "Mensajes de texto, voz o correo a muchos destinatarios a la vez."],
            ["Omnicanalidad", "WhatsApp, chat web, correo y redes en una sola plataforma, con una experiencia coherente."],
            ["CRM", "Sistema para gestionar la relación con los clientes."],
        ], [3.8 * cm, WIDTH - 3.8 * cm]),
        P("Qué hacen ustedes", "h2"),
        *bullets([
            "Entren a la app y verifiquen que su nombre aparezca en verde en la sala de espera.",
            "Revisen la pestaña <b>Invitado</b>: ahí está el tema de su grupo para la entrevista.",
            "Estén atentos: al cerrar el bloque puede llegar la <b>primera pregunta sorpresa</b>.",
        ]),
        PageBreak(),
    ]

    # ---------- Fase 2 ----------
    s += [
        band(2, "Fase 2 · Entrega", "1:17 – 2:34 p. m. · 77 minutos · lideran Dylber, Karen y Camila", PHASE[2]),
        Spacer(1, 8),
        P("<b>Qué es.</b> Es el corazón de la clase: un <b>taller gamificado</b>. Cada grupo rescata una empresa ficticia en crisis "
          "aplicando, nivel por nivel, el ciclo de vida de los recursos tecnológicos. La teoría llega en bloques cortos de máximo "
          "8 minutos y, después de cada bloque, la aplican en su empresa."),
        P("<b>Para qué sirve.</b> Para aprender haciendo: tomar decisiones con presupuesto limitado, justificarlas y ver sus consecuencias."),
        P("Cómo funciona el juego", "h2"),
        *bullets([
            "<b>100 TecnoCoins (TC)</b> por grupo. El presupuesto no alcanza para todo: hay que priorizar según el diagnóstico.",
            "<b>Mercado Tecnológico:</b> abre durante el nivel 2. Eligen el recurso, la ruta legal y escriben por qué lo necesita su empresa (mínimo 15 caracteres). "
            "La compra queda en revisión hasta que el equipo docente la aprueba; si la rechazan, los TC vuelven.",
            "<b>Cartas de crisis:</b> llegan dos durante la fase (en el minuto 8 del Mercado y en el bloque de capacitación). Premian o "
            "castigan las decisiones que tomaron. No se anuncian antes: la mejor defensa es pensar en todo el ciclo de vida.",
            "<b>Lienzo digital:</b> 6 casillas, una por nivel, en la pestaña <b>Lienzo</b>. Se guarda solo; uno dicta, otro escribe, y rotan.",
        ]),
        P("Bloques de la fase", "h2"),
        table(["Hora", "Bloque", "Qué hacen"], [
            ["1:17", "Mecánica del juego (5 min)", "Conocen las reglas, su empresa y el catálogo."],
            ["1:22", "Nivel 1 · Identificación y diagnóstico (8 min)", "Teoría. Al cerrar, posible pregunta sorpresa."],
            ["1:30", "Diagnóstico en el lienzo (8 min)", "Casilla 1 del lienzo."],
            ["1:38", "Nivel 2 · Análisis y adquisición (8 min)", "Teoría y ruta legal. Posible pregunta sorpresa."],
            ["1:46", "Mercado Tecnológico (15 min)", "Compran y llenan la casilla 2. Primera carta de crisis."],
            ["2:01", "Niveles 3 y 4 · Implementación y capacitación (8 min)", "Teoría. Posible pregunta sorpresa."],
            ["2:09", "Ubicación y plan de capacitación (10 min)", "Casillas 3 y 4. Segunda carta de crisis."],
            ["2:19", "Niveles 5 y 6 · Operación y fin de ciclo (8 min)", "Teoría. Posible pregunta sorpresa."],
            ["2:27", "Soporte, mantenimiento y criterio de baja (7 min)", "Casillas 5 y 6. Después el lienzo se cierra."],
        ], [1.3 * cm, 7.0 * cm, WIDTH - 8.3 * cm]),
        CondPageBreak(6 * cm),
        P("La teoría: los seis niveles del ciclo de vida", "h2"),
    ]
    levels = [
        ("Nivel 1 · Identificación y diagnóstico", "Antes de comprar nada: ¿qué problema del negocio queremos resolver?", [
            "<b>Situación actual:</b> inventario de lo que hay y cómo funciona.",
            "<b>Necesidades específicas:</b> lo que hoy le cuesta dinero, tiempo o clientes.",
            "<b>Oportunidades tecnológicas:</b> lo que se puede aprovechar.",
            "<b>Retos de la organización:</b> lo que puede frenar el cambio.",
        ], "Casilla 1: situación actual, tres necesidades, una oportunidad y el reto principal."),
        ("Nivel 2 · Análisis y planeación de la adquisición", "Qué adquirir, con qué método y por qué ruta legal.", [
            "Recursos <b>tangibles</b> (equipos, red) e <b>intangibles</b> (licencias, servicios, conocimiento).",
            "Métodos: compra, leasing, suscripción, desarrollo o donación.",
            "<b>Costo total de propiedad:</b> también cuestan la operación, el mantenimiento y el retiro.",
            "<b>Ruta legal:</b> la empresa privada compra con orden de compra; la entidad pública sigue la contratación estatal "
            "(Ley 80 de 1993 y Ley 1150 de 2007), y las compras pequeñas van por mínima cuantía (Ley 1474 de 2011, art. 94).",
            "<b>Ley 2300 de 2023:</b> el contacto comercial por SMS, mensajería, correo o llamada tiene horarios y límites.",
        ], "Casilla 2: qué compraron, con qué método y por qué ruta legal. ¿Por qué esos y no otros?"),
        ("Nivel 3 · Implementación y puesta en marcha", "Dónde queda cada recurso y cómo se pone a funcionar.", [
            "<b>Ubicación física:</b> sede, oficina, centro de datos, puesto de trabajo.",
            "<b>Ubicación lógica:</b> red, nube, segmentos, permisos.",
            "Configurar, instalar y probar antes de entregarlo a los usuarios.",
        ], "Casilla 3: la ubicación física o lógica de cada recurso."),
        ("Nivel 4 · Capacitación y aprovechamiento", "Una tecnología que nadie sabe usar es una inversión perdida.", [
            "<b>¿A quién?</b> Usuarios finales, administradores y personal de soporte.",
            "<b>¿Qué temas?</b> Lo que cada rol necesita para hacer su trabajo.",
            "<b>¿Cómo?</b> Formación por roles, multiplicadores internos y medición del uso real.",
            "Gestión del cambio cada vez que llega una solución nueva.",
        ], "Casilla 4: a quién capacitan, en qué temas y cómo se aseguran de que la inversión sí se use."),
        ("Nivel 5 · Operación y sostenibilidad", "Mantener el recurso funcionando durante toda su vida útil.", [
            "<b>Soporte técnico:</b> una mesa de servicio como único punto de contacto, con soporte de primer, segundo y tercer nivel.",
            "<b>Mantenimiento</b> preventivo (antes de que falle), correctivo (cuando falla) y evolutivo (para mejorar).",
            "<b>Administración:</b> inventario, licencias, contratos con acuerdos de nivel de servicio (ANS) e indicadores.",
        ], "Casilla 5: quién da soporte, cada cuánto hay mantenimiento y qué indicador revisarían."),
        ("Nivel 6 · Desistimiento y fin de ciclo", "Todo recurso termina; la pregunta es cómo retirarlo bien.", [
            "<b>Retiro por daño:</b> no funciona y repararlo no es rentable.",
            "<b>Retiro por obsolescencia:</b> funciona, pero ya no le sirve a la organización.",
            "<b>Antes:</b> borrado seguro de los datos (NIST SP 800-88) y protección de datos personales (Ley 1581 de 2012).",
            "<b>Después:</b> disposición responsable como residuo electrónico, RAEE (Ley 1672 de 2013).",
        ], "Casilla 6: cuándo darían de baja su recurso principal, por daño u obsolescencia, y qué hacen con los datos y el equipo."),
    ]
    for name, idea, pts, casilla in levels:
        s.append(KeepTogether([P(name, "label"), P(idea, "lead"), *bullets(pts),
                               P(f"<font color='#3368A0'><b>En el lienzo:</b></font> {casilla}", "small"), Spacer(1, 6)]))
    s += [
        note("<b>Clave de la fase:</b> la tecnología se elige por el problema del negocio, no por la moda. Un recurso sin soporte, "
             "sin respaldo o sin capacitación es un riesgo, por bueno que sea."),
        Spacer(1, 8),
        KeepTogether([
            band("·", "Pausa activa", "2:34 – 2:42 p. m. · 8 minutos", MUTED),
            Spacer(1, 6),
            P("Sesenta segundos de estiramiento guiado (brazos arriba, girar el cuello, chocar la mano con alguien de otro grupo) y luego descanso. "
              "La clase es después de almorzar: esta pausa es para volver con energía a la evaluación."),
        ]),
        PageBreak(),
    ]

    # ---------- Fase 4 (va antes que la 3 en el horario) ----------
    s += [
        band(4, "Fase 4 · Evaluación", "2:42 – 3:20 p. m. · 38 minutos · lideran Camila y José · y preguntas sorpresa durante toda la clase", PHASE[4]),
        Spacer(1, 8),
        P("<b>Qué es.</b> Es la fase en que se comprueba lo aprendido. Tiene una parte <b>individual</b> (preguntas sorpresa y quiz) y "
          "una parte <b>de grupo</b> (Semáforo, Galería y lienzo). Con todo eso la app calcula una <b>nota de 0 a 5</b> para cada estudiante."),
        P("<b>Para qué sirve.</b> Para saber si cada uno entendió el ciclo de vida, no solo el grupo."),
        P("Actividades", "h2"),
        table(["Hora", "Actividad", "Cómo funciona", "Tipo"], [
            ["Toda la clase", "Preguntas sorpresa", "La app escoge a un estudiante al cerrar un bloque de teoría. La pregunta aparece en pantalla completa y hay 45 segundos para responder, sin ayuda.", "Individual"],
            ["2:42", "Juego Semáforo (10 min)", "Se proyecta una situación y cada grupo vota de pie: <b>verde</b> (mantener), <b>amarillo</b> (soporte o mantenimiento) o <b>rojo</b> (dar de baja, por daño u obsolescencia). Acertar suma 5 TC.", "Grupo"],
            ["2:52", "Galería (6 min)", "El proyector muestra cada lienzo y el vocero lo defiende de pie en 20 segundos. Cada grupo vota por los 2 mejores, sin contar el propio.", "Grupo"],
            ["2:58", "Quiz final (15 min)", "12 preguntas en el celular o computador, en un orden distinto para cada uno. Cada respuesta es definitiva. Gana quien más acierta y, si hay empate, en menos tiempo.", "Individual"],
            ["3:13", "Notas y premiación (7 min)", "Se muestran los resultados y el Podio con el mejor manejo del presupuesto.", "—"],
        ], [2.0 * cm, 3.3 * cm, WIDTH - 7.3 * cm, 2.0 * cm]),
        P("Cómo se calcula la nota", "h2"),
        table(["Componente", "Peso", "Cálculo"], [
            ["Preguntas sorpresa (individual)", "25 %", "Aciertos sobre las preguntas que les llegaron, de 0 a 5."],
            ["Quiz final (individual)", "30 %", "Aciertos sobre las 12 preguntas. Las que no se respondan cuentan como error."],
            ["Lienzo con rúbrica (grupo)", "30 %", "Promedio de seis criterios calificados de 1 a 5."],
            ["Manejo del presupuesto (grupo)", "15 %", "3,0 para el grupo con menos TC al final y 5,0 para el que más tenga."],
        ], [5.2 * cm, 1.6 * cm, WIDTH - 6.8 * cm]),
        Spacer(1, 4),
        P("Si a alguien no le llega ninguna pregunta sorpresa, ese peso se reparte entre los demás componentes: nadie pierde nota por algo que no dependía de él o de ella.", "small"),
        P("Rúbrica del lienzo", "h2"),
        table(["Criterio", "Excelente (5)", "Deficiente (1)"], [
            ["Diagnóstico", "Situación, necesidades, oportunidad y reto claros", "Genérico o ausente"],
            ["Adquisición y ruta legal", "Compras que responden al diagnóstico, con método y ruta justificados", "Compras sin relación con el diagnóstico"],
            ["Implementación", "Ubicación física o lógica clara y viable", "No se define"],
            ["Capacitación", "A quién, qué y cómo, con estrategia de aprovechamiento", "No se contempla"],
            ["Operación y fin de ciclo", "Soporte, mantenimiento y criterio de baja claros", "No se contempla"],
            ["Presupuesto y crisis", "Prioriza con criterio y responde bien a las crisis", "Presupuesto mal gestionado"],
        ], [4.0 * cm, 7.4 * cm, WIDTH - 11.4 * cm]),
        Spacer(1, 6),
        note("<b>Clave de la fase:</b> se evalúa lo mismo que practicaron en la fase 2; si el lienzo quedó bien, el quiz es repaso.", CORAL),
        PageBreak(),
    ]

    # ---------- Fase 3 ----------
    s += [
        band(3, "Fase 3 · Invitado experto", "3:20 – 4:00 p. m. · 40 minutos · lideran Camila y José · cierre de la clase", PHASE[3]),
        Spacer(1, 8),
        P("<b>Qué es.</b> Una <b>entrevista tipo podcast</b> por Google Meet con <b>Oscar Fernando Giraldo Prada</b>, de KOSMOS TIC "
          "S.A.S. y BU-TIC (Manizales). Cada grupo le hace una pregunta sobre su nivel del ciclo de vida."),
        P("<b>Para qué sirve.</b> Para contrastar lo que trabajaron en el juego con la experiencia de una empresa real del sector "
          "TIC: cómo diagnostica, qué recomienda adquirir, cómo implementa, capacita, da soporte y retira tecnología."),
        P("Qué pasa en esta fase", "h2"),
        *bullets([
            "<b>3:20 · Afinen su pregunta (10 min):</b> revisan la pista de su tema en la pestaña <b>Invitado</b> y escriben una sola pregunta. Mientras tanto, el equipo docente prueba la conexión.",
            "<b>3:30 · Conexión en vivo (30 min):</b> cada grupo hace su pregunta en su turno, del nivel 1 al 6. La pregunta aparece en el proyector y la conexión termina a las 4:00 p. m.",
        ]),
        P("Orden de la entrevista", "h2"),
        table(["Turno", "Grupo", "Nivel", "Tema"], [
            ["1", "01", "1 · Diagnóstico", "Cómo hacen el diagnóstico integral de un cliente"],
            ["2", "02", "2 · Adquisición", "Suscripción en la nube frente a comprar infraestructura propia"],
            ["3", "06", "2 · Ruta legal", "Cómo cumplen la Ley 2300 de 2023 en SMS y campañas masivas"],
            ["4", "04", "3 · Implementación", "Números virtuales DID para atender clientes de otros países"],
            ["5", "05", "3 · Implementación", "Integrar WhatsApp, chat web, correo y redes en una sola plataforma"],
            ["6", "07", "4 · Capacitación", "Cómo capacitan a los equipos para que sí usen el CRM"],
            ["7", "09", "5 · Operación", "Cómo sostienen un soporte 24/7"],
            ["8", "10", "5 · Sostenibilidad", "Qué indicadores miden para saber si una solución funciona"],
            ["9", "12", "5 · Seguridad", "Cómo protegen los datos de los clientes de sus clientes"],
            ["10", "11", "6 · Fin de ciclo", "Qué pasa con las centrales y líneas físicas cuando una empresa migra a IP"],
            ["11", "14", "6 · Pymes", "Qué le recomendarían a un negocio de una sola persona"],
        ], [1.3 * cm, 1.4 * cm, 3.4 * cm, WIDTH - 6.1 * cm], bold_first=False),
        P("Cómo hacer una buena pregunta", "h2"),
        *bullets([
            "<b>Una sola pregunta</b>, que se pueda hacer en <b>máximo 30 segundos</b>.",
            "Usen la <b>pista</b> de su tema: es una cita del catálogo de KOSMOS TIC o de la norma.",
            "Conéctenla con <b>la empresa de su juego</b>. Por ejemplo: «Para un colegio rural con poco presupuesto, ¿cuándo conviene más…?».",
            "Pregunten por <b>cómo lo hacen</b> y no solo por qué venden: lo interesante es la experiencia.",
        ]),
        Spacer(1, 4),
        note("<b>Cierre de la clase:</b> «La tecnología no se compra: se gestiona de principio a fin». Después de escuchar a KOSMOS TIC, "
             "piensen: ¿qué cambiarían de su lienzo?", AMBER),
    ]
    return s


def main(out):
    doc = BaseDocTemplate(out, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=1.5 * cm, bottomMargin=2 * cm,
                          title="Las fases de la clase · guía para estudiantes · Misión TI", author="Equipo 3")
    frame = Frame(MARGIN, 2 * cm, WIDTH, A4[1] - 3.5 * cm, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=page)])
    doc.build(story())
    print(f"OK: {out}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "docs/guia-fases-estudiantes.pdf")
