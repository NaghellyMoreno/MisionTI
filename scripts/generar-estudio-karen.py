#!/usr/bin/env python3
"""Material de estudio para Karen Moreno (estratega y cronometrista): niveles 1 y 2 del ciclo de vida,
diagnóstico en el lienzo, ruta legal y Mercado Tecnológico. Solo para el equipo docente.

Las citas textuales salen de los documentos oficiales consultados el 4 de noviembre de 2026
(MRAE v3.0 de MinTIC, Ley 80 de 1993, Ley 1150 de 2007, Ley 2300 de 2023, Decreto 913 de 1993)
y de la propia app (catálogo, casos, bancos de preguntas y cartas de crisis).

    .venv-pdf/bin/python scripts/generar-estudio-karen.py docs/estudio-karen-niveles-1-2.pdf
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
WHITE = colors.white

TITLE = "Misión TI · Material de estudio de Karen · niveles 1 y 2"
MARGIN = 1.6 * cm
WIDTH = A4[0] - 2 * MARGIN


def style(name, **kw):
    base = dict(fontName="Body", fontSize=9.6, leading=13.6, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "kicker": style("kicker", fontName="Body-Bold", fontSize=8.5, textColor=BLUE),
    "title": style("title", fontName="Body-Bold", fontSize=25, leading=31, spaceBefore=4, spaceAfter=4),
    "sub": style("sub", textColor=MUTED, fontSize=10),
    "h1": style("h1", fontName="Body-Bold", fontSize=16, leading=21, spaceBefore=4, spaceAfter=6),
    "h2": style("h2", fontName="Body-Bold", fontSize=11.5, leading=15, spaceBefore=10, spaceAfter=3, textColor=BLUE),
    "h3": style("h3", fontName="Body-Bold", fontSize=10, leading=13.5, spaceBefore=6, spaceAfter=2),
    "lead": style("lead", textColor=MUTED, spaceAfter=6),
    "body": style("body", spaceAfter=5),
    "bullet": style("bullet", leftIndent=12, bulletIndent=2, spaceAfter=2.5),
    "label": style("label", fontName="Body-Bold", textColor=BLUE),
    "small": style("small", fontSize=8.3, leading=11.2, textColor=MUTED),
    "cell": style("cell", fontSize=8.5, leading=11.2),
    "cellb": style("cellb", fontSize=8.5, leading=11.2, fontName="Body-Bold"),
    "head": style("head", fontSize=8.3, leading=10.8, fontName="Body-Bold", textColor=BLUE),
    "quote": style("quote", fontName="Body-Italic", textColor=colors.HexColor("#3B4955"), leftIndent=12, rightIndent=8, spaceBefore=2),
    "cite": style("cite", fontSize=8, leading=10.5, textColor=MUTED, leftIndent=12, spaceAfter=7),
    "bandL": style("bandL", fontName="Body-Bold", fontSize=16, leading=19, textColor=WHITE),
    "bandS": style("bandS", fontSize=9, leading=12, textColor=WHITE),
}
P = lambda t, s="body": Paragraph(t, S[s])


def bullets(items, s="bullet"):
    return [Paragraph(t, S[s], bulletText="•") for t in items]


def table(headers, rows, widths, bold_first=True):
    data = [[P(h, "head") for h in headers]]
    for r in rows:
        data.append([P(c, "cellb" if (i == 0 and bold_first) else "cell") for i, c in enumerate(r)])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), MIST),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#FAF8F3")]),
        ("BOX", (0, 0), (-1, -1), 0.6, MIST), ("INNERGRID", (0, 0), (-1, -1), 0.4, MIST),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def band(name, when, color=BLUE):
    t = Table([[[P(name, "bandL"), P(when, "bandS")]]], colWidths=[WIDTH])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), color), ("TOPPADDING", (0, 0), (-1, -1), 10),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 10), ("LEFTPADDING", (0, 0), (-1, -1), 14)]))
    return t


def note(text, color=BLUE, bg="#E6F0EE"):
    t = Table([[P(text, "body")]], colWidths=[WIDTH])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(bg)), ("LINEBEFORE", (0, 0), (0, -1), 3, color),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    return t


def quote(text, cite):
    return KeepTogether([P(f"«{text}»", "quote"), P(cite, "cite")])


def page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setFont("Body", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 1.2 * cm, TITLE)
    canvas.drawRightString(A4[0] - MARGIN, 1.2 * cm, f"Página {doc.page}")
    canvas.restoreState()


MRAE = "MinTIC · MRAE v3.0, Documento Maestro (mayo de 2023)"


def story():
    s = []
    # ---------------- Portada ----------------
    s += [
        P("MISIÓN TI · SOLO PARA EL EQUIPO DOCENTE", "kicker"),
        P("Tu parte en la clase: diagnóstico y adquisición", "title"),
        P("Material de estudio para Karen Moreno · estratega y cronometrista · miércoles 4 de noviembre de 2026", "sub"),
        Spacer(1, 10),
        P("Este documento amplía la teoría de los bloques que te tocan: el <b>nivel 1</b> (identificación y diagnóstico), "
          "el <b>nivel 2</b> (análisis y planeación de la adquisición, con la ruta legal) y el <b>Mercado Tecnológico</b>. "
          "Todo sale de las fuentes que cita la clase: el Marco de Referencia de Arquitectura Empresarial (MRAE) v3.0 de MinTIC, "
          "las leyes de contratación estatal, la Ley 2300 de 2023, las normas ISO de gestión de activos y el catálogo de KOSMOS TIC. "
          "Las frases entre comillas son textuales; lo demás es explicación para que puedas contarlo con tus palabras."),
        P("1. Tus bloques de un vistazo", "h2"),
        table(["Hora", "Bloque", "Min", "Lo que pasa", "En la app"], [
            ["1:22", "Nivel 1 · Identificación y diagnóstico", "8", "Teoría: las cuatro preguntas del diagnóstico y cómo lo hace KOSMOS TIC.", "Al cerrar: pregunta sorpresa del banco «Nivel 1»."],
            ["1:30", "Diagnóstico en el lienzo", "8", "Los grupos llenan la casilla 1. Recorres el salón.", "Pestaña Lienzos del panel: avance de cada grupo."],
            ["1:38", "Nivel 2 · Análisis y adquisición", "8", "Teoría: tipos de recursos, métodos, costo total, ruta legal y Ley 2300.", "Al cerrar: pregunta sorpresa del banco «Nivel 2»."],
            ["1:46", "Mercado Tecnológico (con Dylber)", "15", "Abres el Mercado. Los grupos compran y llenan la casilla 2. Crisis en el minuto 8.", "Botón «Abrir mercado» en el panel; Dylber aprueba en Solicitudes."],
        ], [1.1 * cm, 4.3 * cm, 1.1 * cm, 5.9 * cm, WIDTH - 12.4 * cm]),
        Spacer(1, 6),
        P("<b>Como cronometrista</b> (toda la clase): avisa a quien lidera cada bloque cuando falten 2 minutos. Tu tramo es el más "
          "largo seguido (1:22 a 2:01 p. m.): si un bloque de teoría se alarga, recorta ejemplos, nunca el tiempo del lienzo ni del Mercado."),
        P("2. El hilo conductor: por qué empezar por aquí", "h2"),
        P("Tus dos niveles son la parte de <b>planeación</b> del ciclo de vida: deciden si todo lo que viene después (implementar, "
          "capacitar, operar y retirar) tendrá sentido. Las normas de gestión de activos lo plantean así:"),
        *bullets([
            "<b>ISO 55000</b> (gestión de activos, edición 2024): busca que las organizaciones gestionen sus activos «over their life cycles» "
            "para aumentar el valor que obtienen de ellos. Un activo es algo con valor potencial o real para la organización, y el software también cuenta.",
            "<b>ISO/IEC 19770-1:2017</b> (gestión de activos de TI): define la gestión de activos de TI como toda la infraestructura y los procesos "
            "«necessary for the effective management, control and protection of IT assets» en todas las etapas del ciclo de vida. Propone tres niveles: "
            "datos confiables, integración del ciclo de vida y optimización. El primero es justamente saber qué se tiene: el inventario del diagnóstico.",
            "<b>ITIL 4</b>: la práctica de gestión de activos de TI tiene como propósito planear y gestionar el ciclo de vida completo de todos los activos de TI.",
            "<b>COBIT 2019</b>: separa los objetivos de <i>alinear, planear y organizar</i> (APO) de los de <i>construir, adquirir e implementar</i> (BAI). "
            "Tus niveles son el paso de uno al otro: primero se planea y después se adquiere.",
        ]),
        note("<b>Idea para abrir tu parte:</b> «Comprar es la parte fácil. Lo difícil es saber qué comprar, cómo y por qué. Eso es lo que van a decidir ahora».", BLUE),
        PageBreak(),
    ]

    # ---------------- Nivel 1 ----------------
    s += [
        band("Nivel 1 · Identificación y diagnóstico", "1:22 – 1:30 p. m. · 8 minutos · diapositivas: concepto + «Así lo hace KOSMOS TIC»"),
        Spacer(1, 8),
        P("<b>La idea en una frase:</b> antes de comprar nada, hay que entender cómo opera hoy la organización, qué le duele y qué quiere lograr. "
          "Sin diagnóstico, la compra responde a la moda o al proveedor, no al problema."),
        P("Lo que dice el MRAE de MinTIC", "h2"),
        P("El MRAE es la guía oficial del Estado colombiano para que las entidades planeen su tecnología. Su método tiene cuatro piezas que encajan con el nivel 1:"),
        quote("esta práctica permite diseñar y estructurar una arquitectura actual o línea base, una arquitectura objetivo, el análisis de brecha "
              "y una hoja de ruta", f"{MRAE}, p. 23"),
        table(["Pieza", "Qué es", "En la clase"], [
            ["Línea base (situación actual)", "Cómo opera hoy la organización: procesos, personas, información y tecnología.", "«Situación actual» de la casilla 1."],
            ["Situación objetivo", "Cómo debería operar para lograr sus objetivos.", "El reto de cada empresa del juego."],
            ["Análisis de brecha", "La diferencia entre lo que hay y lo que se necesita.", "Las «necesidades específicas»."],
            ["Hoja de ruta", "Las iniciativas priorizadas para cerrar la brecha.", "Las compras del Mercado (nivel 2)."],
        ], [4.0 * cm, 7.2 * cm, WIDTH - 11.2 * cm]),
        Spacer(1, 6),
        quote("su Arquitectura Institucional en su situación actual (línea base), que corresponde a la forma como opera en el presente la entidad",
              f"{MRAE}, dominio de arquitectura institucional, p. 40. Es la cita que aparece en tu diapositiva."),
        P("Lineamientos que respaldan cada parte del diagnóstico:", "h3"),
        *bullets([
            "<b>MAE.LI.PA.04 · Visión de la arquitectura:</b> cada ejercicio debe identificar «las necesidades, preocupaciones, oportunidades de mejora o de "
            "transformaciones». Son tres de las cuatro preguntas de tu diapositiva.",
            "<b>MAE.LI.PA.05 · Definición de la arquitectura:</b> se plantea la situación objetivo y, «a partir del análisis de brecha con respecto a la "
            "situación actual», se identifican las iniciativas de la hoja de ruta.",
            "<b>MGGTI.LI.GO.05 · Capacidades y recursos de TI:</b> hay que «identificar, evaluar y monitorear las capacidades actuales y requeridas de TI». "
            "La evidencia que pide es un «Inventario de los recursos disponibles».",
            "<b>MGGTI.LI.ES.05 · Catálogo de servicios de TI:</b> mantener actualizado el catálogo de servicios de TI con sus acuerdos de nivel de servicio (ANS).",
            "<b>PETI (Plan Estratégico de Tecnologías de la Información):</b> es «la carta de navegación» de la transformación digital de una entidad (p. 28). "
            "El diagnóstico es su punto de partida.",
        ]),
        P("Las cuatro preguntas, explicadas", "h2"),
        table(["Pregunta", "Qué buscar", "Ejemplo del juego (Clínica Santa Ana)"], [
            ["1. ¿Cuál es la situación actual?", "Inventario: qué equipos, programas, datos y personas hay, y cómo se usan hoy.",
             "Historias clínicas en papel, citas por teléfono y un solo computador por piso."],
            ["2. ¿Qué necesidades específicas hay?", "Lo que hoy cuesta dinero, tiempo o clientes. Debe ser concreto y medible.",
             "Las historias se pierden o se duplican; hay pacientes que llegan sin cupo; el personal hace fila para registrar."],
            ["3. ¿Qué oportunidad tecnológica existe?", "Algo que ya está disponible y se puede aprovechar.",
             "Agendar citas por internet o mensajería; historia clínica digital en la nube."],
            ["4. ¿Cuál es el reto principal?", "Lo que puede frenar el cambio: presupuesto, cultura, normas, conectividad.",
             "Digitalizar sin parar la atención y proteger datos de salud, que son sensibles."],
        ], [3.8 * cm, 5.6 * cm, WIDTH - 9.4 * cm]),
        Spacer(1, 4),
        KeepTogether([P("<b>Diferencias que conviene dejar claras</b> (son las preguntas sorpresa de tu banco):", "h3"),
        *bullets([
            "Hacer el <b>inventario</b> de lo que hay es identificar la <b>situación actual</b>.",
            "«Los clientes no pueden comprar cuando la página se cae» es una <b>necesidad específica</b>: un problema concreto del negocio.",
            "«Los clientes ya escriben por WhatsApp y se les puede atender por ahí» es una <b>oportunidad tecnológica</b>: algo que existe y se puede aprovechar.",
            "La pregunta que guía todo el diagnóstico es <b>«¿Qué problema del negocio queremos resolver?»</b>.",
        ])]),
        CondPageBreak(5 * cm),
        P("Así lo hace KOSMOS TIC", "h2"),
        quote("Diagnóstico Integral: Analizamos tus procesos actuales de atención para identificar oportunidades de mejora.",
              "Catálogo KOSMOS TIC y BU-TIC · Estrategias de Servicio al Cliente, paso 01 (citado en la diapositiva). Pista para el grupo 01."),
        P("Después del diagnóstico vienen el diseño de estrategia, la implementación y la medición de resultados: el diagnóstico es el primer paso de un ciclo, "
          "igual que en la clase. En su sitio web, KOSMOS TIC describe que su equipo de soporte «recibe, diagnostica y resuelve» los problemas: diagnosticar "
          "también es parte de la operación diaria."),
        P("Cómo contarlo en 8 minutos", "h2"),
        table(["Minuto", "Qué hacer"], [
            ["0 – 1", "Pregunta al salón: «Si van al médico, ¿qué hace primero: recetar o examinar?». La respuesta es el nivel 1."],
            ["1 – 4", "Las cuatro preguntas con el ejemplo de la clínica (tabla de arriba). Lee la cita de la línea base del MRAE."],
            ["4 – 6", "Diapositiva de KOSMOS TIC: lee la cita del «Diagnóstico Integral». Recuerda que es pista del grupo 01."],
            ["6 – 7", "Error típico: comprar computadores nuevos sin saber qué falla hoy. Se gasta sin resolver el problema."],
            ["7 – 8", "Lanza la pregunta sorpresa del banco «Nivel 1» y da paso al lienzo."],
        ], [2.0 * cm, WIDTH - 2.0 * cm]),
        Spacer(1, 6),
        P("Preguntas difíciles que te pueden hacer", "h3"),
        *bullets([
            "<b>«¿El diagnóstico no es lo mismo que el inventario?»</b> No. El inventario es solo la primera pregunta (qué hay). El diagnóstico además dice "
            "qué falta, qué se puede aprovechar y qué puede salir mal.",
            "<b>«¿Por qué no comprar lo más moderno?»</b> Porque lo más moderno puede no resolver el problema, costar más de lo que la empresa puede sostener "
            "o quedar guardado sin uso. Eso es lo que muestra la frase de apertura de la clase.",
            "<b>«¿Quién hace el diagnóstico?»</b> En el Estado, la dirección de TI o quien haga sus veces (así lo dicen los lineamientos del MRAE), con las áreas "
            "que usan la tecnología. En una empresa pequeña, puede ser la dueña con un asesor.",
        ]),
        PageBreak(),
    ]

    # ---------------- Lienzo ----------------
    s += [
        band("Diagnóstico en el lienzo · casilla 1", "1:30 – 1:38 p. m. · 8 minutos · los grupos trabajan y tú recorres el salón", SKY),
        Spacer(1, 8),
        P("<b>Qué deben escribir:</b> la situación actual, tres necesidades específicas, una oportunidad tecnológica y el reto principal "
          "(máximo 600 caracteres). Se guarda solo; una persona dicta y otra escribe, y rotan."),
        P("Así se ve una buena casilla 1 (ejemplo para orientar, no para dictar)", "h3"),
        note("<i>«Hoy las historias clínicas están en papel, las citas se piden por teléfono y hay un solo computador por piso. Necesidades: (1) dejar de perder "
             "historias, (2) que los pacientes no lleguen sin cupo, (3) que el personal no haga fila para registrar. Oportunidad: agendamiento e historia clínica "
             "en la nube. Reto: cambiar sin detener la atención y proteger datos de salud.»</i>", SKY, "#EEF4F7"),
        Spacer(1, 6),
        P("Cómo lo califica José (criterio «Diagnóstico» de la rúbrica)", "h3"),
        table(["Excelente (5)", "Deficiente (1)"], [["Situación, necesidades, oportunidad y reto claros.", "Genérico o ausente."]], [WIDTH / 2, WIDTH / 2], bold_first=False),
        Spacer(1, 6),
        P("Qué revisar al recorrer los grupos", "h3"),
        *bullets([
            "¿Las necesidades son <b>concretas</b>? «Mejorar la tecnología» no sirve; «los pedidos internacionales se pierden» sí.",
            "¿Salen de los <b>problemas de su empresa</b>? Están en la pestaña Lienzo, en el perfil del caso.",
            "¿Mencionan el <b>reto</b>? Casi siempre es presupuesto, personas que no saben usar la tecnología, conectividad o, en la Alcaldía, la ley.",
            "¿Están pensando ya en <b>qué comprar</b>? Bien, pero que lo anoten para el Mercado: la casilla 1 es diagnóstico, no lista de compras.",
            "Usa la pestaña <b>Lienzos</b> del panel para ver qué grupos van atrasados y pásales primero.",
        ]),
        P("Retos típicos por empresa (para orientar a cada grupo)", "h3"),
        table(["Empresa", "Lo que deberían notar en el diagnóstico"], [
            ["Clínica Santa Ana", "Datos sensibles de salud: el respaldo y la protección de datos no son opcionales."],
            ["Colegio Rural La Esperanza", "Conectividad inestable y equipos donados sin mantenimiento: el problema no es solo comprar, es que la tecnología se use."],
            ["Café de Origen Exportadora", "Un ERP de 12 años sin soporte del fabricante: es un caso de obsolescencia y de migración de datos."],
            ["TiendaYa", "Caídas en temporada alta y sin respaldo: capacidad y continuidad antes que lo vistoso."],
            ["Alcaldía de Villa Verde", "Es entidad pública: toda compra sigue la contratación estatal. El reto incluye la ruta legal."],
            ["Papelería El Rincón Digital", "Caso exprés de una sola persona: 2 o 3 compras bien justificadas bastan."],
        ], [4.4 * cm, WIDTH - 4.4 * cm]),
        PageBreak(),
    ]

    # ---------------- Nivel 2 ----------------
    s += [
        band("Nivel 2 · Análisis y planeación de la adquisición", "1:38 – 1:46 p. m. · 8 minutos · diapositivas: concepto, ruta legal, KOSMOS TIC y Ley 2300"),
        Spacer(1, 8),
        P("<b>La idea en una frase:</b> con el diagnóstico listo, se decide <b>qué</b> adquirir, <b>con qué método</b> y <b>por qué ruta legal</b>, "
          "pensando en todo lo que va a costar durante su vida, no solo en el precio."),
        P("Recursos tangibles e intangibles", "h2"),
        table(["Tipo", "Qué son", "Ejemplos del catálogo del juego"], [
            ["Tangibles", "Se pueden tocar: equipos y su instalación.", "Servidor físico, lote de 10 computadores, red y conectividad, equipos donados."],
            ["Intangibles", "No se pueden tocar: derechos de uso, servicios y conocimiento.", "Licencia de ERP, nube, software a la medida, respaldo, capacitación, soporte."],
        ], [2.4 * cm, 6.0 * cm, WIDTH - 8.4 * cm]),
        Spacer(1, 4),
        P("Una licencia de software es un recurso <b>intangible</b>: es un derecho de uso (pregunta sorpresa de tu banco). Para ISO 55000 ambos son activos, "
          "porque los dos tienen valor para la organización.", "small"),
        P("Métodos de adquisición", "h2"),
        table(["Método", "Cómo funciona", "Conviene cuando…", "Cuidado con…"], [
            ["Compra", "La organización paga y el bien es suyo.", "El bien se usará muchos años y hay presupuesto inicial.", "Mantenimiento, garantía y retiro corren por su cuenta."],
            ["Leasing", "Se usa el bien a cambio de cánones periódicos, con opción de adquirirlo al final (leasing financiero).", "Se quiere renovar equipos sin un gran pago inicial.", "Es un contrato financiero: al final hay que decidir si se compra o se devuelve."],
            ["Suscripción (SaaS / IaaS)", "Se paga por usar software o infraestructura en la nube, generalmente mes a mes.", "La demanda cambia o no hay capital para servidores propios.", "Dependencia del proveedor, de internet y de dónde quedan los datos."],
            ["Desarrollo propio o contratado", "Se construye software a la medida.", "Nada del mercado resuelve el problema.", "Es lo más caro y lento; necesita mantenimiento propio."],
            ["Donación", "Se recibe el bien sin pagar.", "Hay una necesidad clara y el bien sirve.", "En el juego viene «sin garantía»: puede salir caro después (ver costo total)."],
        ], [2.7 * cm, 4.6 * cm, 4.4 * cm, WIDTH - 11.7 * cm]),
        Spacer(1, 4),
        P("<b>Definición legal del leasing en Colombia:</b> el Decreto 913 de 1993 (art. 2) lo define como «la entrega, a título de arrendamiento, de bienes "
          "adquiridos para el efecto, financiando su uso y goce a cambio de cánones», con una opción de adquisición al final a favor del locatario. Si no hay "
          "opción de compra, se habla de leasing operativo. Hoy está recogido en el Decreto 2555 de 2010.", "small"),
        P("Costo total de propiedad (TCO)", "h2"),
        P("Es la estimación de todo lo que cuesta un recurso durante su vida: <b>adquisición + operación + mantenimiento y soporte + capacitación + "
          "retiro</b>. El concepto lo popularizó Gartner a finales de los años 80. Es el argumento para no decidir solo por precio."),
        table(["Opción en el juego", "Precio", "Lo que falta para que funcione", "Costo real aproximado"], [
            ["Servidor físico (compra)", "40 TC", "Soporte técnico (15) y respaldo (10)", "65 TC"],
            ["Nube · 1 año (suscripción)", "25 TC", "Respaldo opcional (10); el soporte suele ir incluido en el servicio", "25 – 35 TC"],
            ["10 computadores (compra)", "35 TC", "Soporte (15) para no perder la garantía si quiebra el proveedor", "50 TC"],
            ["10 computadores (leasing)", "20 TC", "Incluye reposición al final del contrato", "20 TC + lo que se decida al final"],
            ["Equipos donados", "0 TC", "Sin garantía: soporte y, a la larga, reemplazo", "0 TC hoy, más después"],
        ], [4.2 * cm, 1.6 * cm, 6.8 * cm, WIDTH - 12.6 * cm]),
        P("Los «costos reales» son una lectura didáctica del catálogo del juego, no precios del mercado.", "small"),
        CondPageBreak(5 * cm),
        P("Lo que pide el MRAE para adquirir tecnología", "h2"),
        quote("debe definir los criterios y metodologías que orienten la toma de decisiones para las compras de bienes de servicios de tecnología, buscando la "
              "mejora del servicio, haciendo uso de los Acuerdos Marco de Precios (AMP) existentes, dando prioridad a adquisiciones en modalidad de servicio "
              "o por demanda y propendiendo por minimizar la compra de bienes de hardware",
              f"{MRAE}, lineamiento MGGTI.LI.GO.06 «Capacidades y optimización de recursos de TI», p. 78. Tu diapositiva cita la última parte."),
        *bullets([
            "La evidencia que pide este lineamiento son los <b>estudios previos de las adquisiciones</b>: un documento con los criterios de la compra.",
            "<b>MGGTI.LI.GO.09 · Gestión de proveedores de TI:</b> durante el contrato hay que hacer «dirección, supervisión, seguimiento, control y recibo a "
            "satisfacción», además de la transferencia de conocimiento.",
            "<b>MGGTI.LI.ES.04 · Gestión del presupuesto de TI:</b> separar los recursos de operación de los de inversión, en relación con el <b>Plan Anual de Adquisiciones</b>.",
        ]),
        P("Así lo hace KOSMOS TIC", "h3"),
        quote("Sistemas en la nube que crecen con tu negocio, sin necesidad de grandes inversiones iniciales en infraestructura.",
              "Catálogo KOSMOS TIC y BU-TIC · Sistemas SaaS para Gestión Comercial. Pista para los grupos 02 y 14."),
        P("Su IP PBX es una central telefónica que opera en la nube: es un ejemplo de pasar de comprar hardware (una central física) a suscribirse a un servicio, "
          "justo lo que recomienda el MRAE."),
        PageBreak(),
    ]

    # ---------------- Ruta legal ----------------
    s += [
        band("La ruta legal: no todas las empresas compran igual", "Parte del nivel 2 · también decide la carta de crisis «Auditoría de contratación»", CORAL),
        Spacer(1, 8),
        P("Empresa privada", "h2"),
        P("Compra con libertad de contratación: una <b>orden de compra</b> o un contrato entre particulares, con las condiciones que pacten las partes. "
          "En el juego: Clínica, Colegio, Café, TiendaYa y Papelería usan «Orden de compra privada». Ojo: el perfil del colegio dice «colegio público rural», "
          "pero en el juego está marcado como privado; si un grupo lo pregunta, la respuesta real es que un colegio público también sigue la contratación estatal."),
        P("Entidad pública: la contratación estatal", "h2"),
        P("Las entidades estatales (la Nación, los departamentos, los municipios y sus entidades, según el art. 2 de la Ley 80 de 1993) no pueden comprar "
          "como un particular: deben seguir el Estatuto General de Contratación."),
        quote("Las actuaciones de quienes intervengan en la contratación estatal se desarrollarán con arreglo a los principios de transparencia, economía y "
              "responsabilidad", "Ley 80 de 1993, art. 23"),
        quote("Previo a la apertura de un proceso de selección, o a la firma del contrato en el caso en que la modalidad de selección sea contratación directa, "
              "deberán elaborarse los estudios, diseños y proyectos requeridos, y los pliegos de condiciones, según corresponda.",
              "Ley 80 de 1993, art. 25, num. 12 (modificado por el art. 87 de la Ley 1474 de 2011). Es la base legal de los «estudios previos»: el diagnóstico hecho documento."),
        quote("Es objetiva la selección en la cual la escogencia se haga al ofrecimiento más favorable a la entidad y a los fines que ella busca, sin tener en "
              "consideración factores de afecto o de interés", "Ley 1150 de 2007, art. 5 (selección objetiva)"),
        P("Las modalidades de selección (Ley 1150 de 2007, art. 2)", "h3"),
        table(["Modalidad", "Cuándo se usa", "Ejemplo en tecnología"], [
            ["Licitación pública", "Es la regla general: todo lo que no encaje en las demás.", "Un sistema de información grande para toda la alcaldía."],
            ["Selección abreviada", "Procesos más cortos según el objeto o la cuantía. Literal a: «bienes y servicios de características técnicas uniformes y de común "
             "utilización» (por ejemplo, por Acuerdo Marco de Precios). Literal b: menor cuantía.", "Computadores estándar o servicios de nube pública por la Tienda Virtual del Estado Colombiano."],
            ["Concurso de méritos", "Selección de consultores o proyectos: se elige por calidad, no por precio.", "Contratar el diagnóstico o la arquitectura empresarial de la entidad."],
            ["Contratación directa", "Solo en las causales de la ley; por ejemplo, contratos interadministrativos o cuando no existe pluralidad de oferentes.", "Renovar una licencia que solo vende el fabricante; un convenio con otra entidad pública."],
            ["Mínima cuantía", "Contratos que no superan el 10 % de la menor cuantía de la entidad. Se publica una invitación de al menos un día hábil y gana la oferta de menor precio que cumpla.", "Comprar un switch o unos discos para respaldo."],
        ], [3.2 * cm, 7.6 * cm, WIDTH - 10.8 * cm]),
        Spacer(1, 4),
        P("<b>Topes de la menor cuantía</b> (art. 2, num. 2, lit. b): dependen del presupuesto anual de la entidad. Van de hasta 280 SMMLV (entidades con presupuesto "
          "menor a 120.000 SMMLV) hasta 1.000 SMMLV (presupuesto de 1.200.000 SMMLV o más). Una alcaldía pequeña como Villa Verde estaría en el tramo más bajo.", "small"),
        P("<b>Sobre la mínima cuantía:</b> la creó el art. 94 de la Ley 1474 de 2011 (como dice tu diapositiva), y hoy rige con el texto que le dio el art. 30 de la "
          "Ley 2069 de 2020. Si un bien está en un Acuerdo Marco de Precios, la compra de mínima cuantía debe hacerse por la Tienda Virtual del Estado Colombiano.", "small"),
        P("Acuerdos Marco de Precios (AMP)", "h3"),
        P("Colombia Compra Eficiente negocia por adelantado precios y condiciones con varios proveedores, y las entidades compran por la <b>Tienda Virtual del Estado "
          "Colombiano</b> con una orden de compra. Existen, por ejemplo, acuerdos marco de servicios de nube pública (vamos en la quinta generación). El MRAE pide usarlos "
          "(lineamiento GO.06). Es la forma más rápida y transparente de comprar tecnología en el Estado."),
        P("Las rutas legales en el juego", "h3"),
        table(["Ruta en la app", "Para quién", "Comentario"], [
            ["Orden de compra privada", "Empresas privadas", "La auditoría castiga a la Alcaldía si la usa."],
            ["Mínima cuantía", "Entidad pública", "Compras pequeñas: red, respaldo, capacitación."],
            ["Selección abreviada", "Entidad pública", "Bienes uniformes (computadores) y nube por Acuerdo Marco."],
            ["Licitación pública", "Entidad pública", "Compras grandes o complejas: software a la medida, ERP."],
            ["Contratación directa", "Entidad pública", "Solo con causal: proveedor único o contrato interadministrativo."],
            ["Convenio o donación", "Entidad pública", "Simplificación del juego: en la ley, el convenio interadministrativo es una causal de contratación directa, y una donación se acepta mediante un acto de la entidad."],
        ], [3.8 * cm, 3.0 * cm, WIDTH - 6.8 * cm]),
        PageBreak(),
    ]

    # ---------------- Ley 2300 ----------------
    s += [
        band("Ley 2300 de 2023 · «Dejen de fregar»", "Parte del nivel 2 · diapositiva «Ruta legal en comunicaciones» · pista para el grupo 06", AMBER),
        Spacer(1, 8),
        P("<b>Por qué está en tu bloque:</b> KOSMOS TIC vende SMS masivos y campañas de voz y de correo. Si una empresa adquiere esos servicios, tiene que usarlos "
          "dentro de la ley: elegir bien un servicio también es saber qué reglas trae."),
        P("Lo que dice la ley", "h2"),
        quote("Una vez establecido un contacto directo con el consumidor, este no podrá ser contactado por parte de gestores de cobranza mediante varios canales "
              "dentro de una misma semana ni en más de una ocasión durante el mismo día.", "Ley 2300 de 2023, art. 3 (horarios y periodicidad)"),
        quote("dentro del horario de lunes a viernes y de 7:00 a. m. a 7:00 p. m., y sábados de 8:00 a. m. a 3:00 p. m., excluyendo cualquier tipo de contacto "
              "con el consumidor los domingos y días festivos.", "Ley 2300 de 2023, art. 3"),
        quote("En todo caso el envío de mensajes publicitarios a través de Mensajes Cortos de Texto (SMS), mensajería por aplicaciones o web, correos electrónicos "
              "y que realicen llamadas telefónicas de carácter comercial o publicitario, solo podrán hacerlo por dentro de los horarios establecidos en el artículo 3o.",
              "Ley 2300 de 2023, art. 5, parágrafo 3"),
        P("Para explicarla bien", "h3"),
        *bullets([
            "<b>Origen:</b> la ley nació para las <b>cobranzas</b> (art. 1). El art. 5 la extiende «en los mismos términos» a los mensajes comerciales y publicitarios "
            "por SMS, aplicaciones, web, correo y llamadas. Por eso aplica a lo que vende KOSMOS TIC.",
            "<b>Horarios:</b> lunes a viernes de 7:00 a. m. a 7:00 p. m.; sábados de 8:00 a. m. a 3:00 p. m.; domingos y festivos, nunca.",
            "<b>Frecuencia:</b> no más de un contacto el mismo día ni por varios canales en la misma semana.",
            "<b>Canales:</b> solo por los que el consumidor haya autorizado (art. 2).",
            "<b>Otras reglas:</b> no se puede obligar a nadie a aceptar mensajes comerciales al comprar (art. 5, parágrafo 2) y debe existir un mecanismo sencillo "
            "para cancelarlos. La ley ordena adaptar el Registro de Números Excluidos con la CRC.",
            "<b>Quién vigila:</b> la Superintendencia de Industria y Comercio y la Superintendencia Financiera, según el caso.",
        ]),
        note("<b>Pregunta sorpresa de tu banco:</b> un sábado se pueden enviar mensajes comerciales <b>entre 8:00 a. m. y 3:00 p. m.</b>"
             "<br/><b>Pregunta del quiz final:</b> un SMS comercial <b>no</b> se puede enviar <b>un domingo</b>.", AMBER, "#F6EFE2"),
        Spacer(1, 8),
        band("Mercado Tecnológico", "1:46 – 2:01 p. m. · 15 minutos · con Dylber (game master)", BLUE),
        Spacer(1, 8),
        P("Cómo lo manejan", "h2"),
        *bullets([
            "<b>Tú abres el Mercado</b> desde el panel lateral («Abrir mercado») y anuncias las reglas en 30 segundos: recurso, ruta legal y justificación "
            "(mínimo 15 caracteres). El presupuesto no alcanza para todo.",
            "<b>Dylber aprueba o rechaza</b> en la pestaña Solicitudes. Si rechazan una compra, los TC vuelven y el grupo ve el comentario.",
            "<b>Minuto 8 (1:54 p. m.):</b> lanzan la primera carta de crisis desde la pestaña Crisis. Antes, aprueben las compras pendientes para que la carta sea justa.",
            "<b>Al final:</b> recuerda llenar la casilla 2 del lienzo: qué compraron, con qué método y por qué ruta legal.",
        ]),
        KeepTogether([P("Criterios para aprobar o rechazar una compra", "h3"),
        table(["Aprobar si…", "Rechazar o pedir que la ajusten si…"], [
            ["La justificación nombra un problema de su diagnóstico.", "La justificación es genérica («la necesitamos»)."],
            ["La ruta legal corresponde al tipo de empresa.", "Una entidad pública usa orden de compra privada (o espérenla en la auditoría)."],
            ["El método tiene sentido para el caso (por ejemplo, nube para TiendaYa).", "Es claramente incoherente (software a la medida para la papelería)."],
        ], [WIDTH / 2, WIDTH / 2], bold_first=False)]),
        Spacer(1, 6),
        P("Las cartas de crisis premian decisiones del ciclo completo", "h3"),
        table(["Carta", "Regla"], [
            ["El proveedor quebró", "Quien tenga equipos físicos sin contrato de soporte pierde la garantía: −10 TC."],
            ["Ataque de ransomware", "Con sistema de respaldo: +5 TC. Sin respaldo: −15 TC."],
            ["Recorte de presupuesto", "Todos pierden el 20 % de su saldo disponible."],
            ["Resistencia al cambio", "Con programa de capacitación: +10 TC. Sin capacitación: −5 TC."],
            ["Auditoría de contratación", "Entidades públicas con compras fuera de la contratación estatal: −10 TC."],
            ["Oportunidad inesperada", "Bono manual del equipo docente para quien justifique su impacto en 30 segundos."],
        ], [4.2 * cm, WIDTH - 4.2 * cm]),
        P("Úsalas como argumento del costo total: el soporte, el respaldo y la capacitación parecen gastos extra, pero son los que protegen la inversión.", "small"),
        PageBreak(),
    ]

    # ---------------- Preguntas sorpresa ----------------
    s += [
        P("Preguntas sorpresa de tus bloques", "h1"),
        P("Al cerrar cada bloque, el panel sugiere el banco. Puedes elegir una pregunta o dejar que la app escoja la menos usada.", "lead"),
        table(["Banco", "Pregunta", "Respuesta correcta"], [
            ["Nivel 1", "Hacer el inventario de la tecnología que tiene hoy la empresa corresponde a…", "Identificar la situación actual"],
            ["Nivel 1", "«Los clientes no pueden comprar cuando la página se cae» describe…", "Una necesidad específica"],
            ["Nivel 1", "Descubrir que los clientes ya escriben por WhatsApp y que se les puede atender por ahí es…", "Una oportunidad tecnológica"],
            ["Nivel 1", "En las estrategias de servicio al cliente de KOSMOS TIC, ¿cuál es el paso 01?", "Diagnóstico integral"],
            ["Nivel 1", "¿Qué pregunta debe guiar el diagnóstico?", "¿Qué problema del negocio queremos resolver?"],
            ["Nivel 2", "Una licencia de software es un recurso…", "Intangible"],
            ["Nivel 2", "Pagar mes a mes por usar un software en la nube es adquirir por…", "Suscripción (SaaS)"],
            ["Nivel 2", "Una alcaldía que compra tecnología debe seguir…", "La contratación estatal (Ley 80 de 1993 y Ley 1150 de 2007)"],
            ["Nivel 2", "El costo total de propiedad (TCO) incluye…", "Adquisición, operación, mantenimiento y retiro"],
            ["Nivel 2", "Según KOSMOS TIC, una ventaja de sus sistemas SaaS es que…", "Crecen con el negocio sin grandes inversiones iniciales en infraestructura"],
            ["Nivel 2", "Según la Ley 2300 de 2023, un sábado se pueden enviar mensajes comerciales…", "Entre 8:00 a. m. y 3:00 p. m."],
        ], [1.6 * cm, 9.0 * cm, WIDTH - 10.6 * cm]),
        Spacer(1, 6),
        P("Del quiz final también salen de tus niveles: el orden del ciclo de vida, la licencia de ERP como recurso intangible, el leasing, la contratación "
          "estatal de una entidad pública y el SMS comercial en domingo. Si tu parte queda clara, cinco de las doce preguntas son repaso.", "small"),
        P("Glosario rápido", "h1"),
        table(["Término", "Significado"], [
            ["Línea base", "La situación actual: cómo opera hoy la organización (MRAE)."],
            ["Análisis de brecha", "La diferencia entre la situación actual y la situación objetivo."],
            ["Hoja de ruta", "Las iniciativas priorizadas para cerrar la brecha."],
            ["PETI", "Plan Estratégico de Tecnologías de la Información: la «carta de navegación» de TI de una entidad pública."],
            ["ANS", "Acuerdo de nivel de servicio: lo que un proveedor se compromete a cumplir."],
            ["TCO", "Costo total de propiedad: adquisición, operación, mantenimiento, soporte, capacitación y retiro."],
            ["SaaS / IaaS", "Software o infraestructura como servicio: se paga por usarlos en la nube."],
            ["Leasing", "Uso de un bien a cambio de cánones, con opción de adquirirlo al final (Decreto 913 de 1993)."],
            ["Estudios previos", "Documento con la necesidad, el objeto y los criterios de una compra pública (Ley 80, art. 25, num. 12)."],
            ["Selección objetiva", "Escoger la oferta más favorable a la entidad, sin motivaciones subjetivas (Ley 1150, art. 5)."],
            ["Acuerdo Marco de Precios", "Precios y condiciones negociados por Colombia Compra Eficiente; se compra por la Tienda Virtual del Estado Colombiano."],
            ["SMMLV", "Salario mínimo mensual legal vigente: la unidad con que se fijan las cuantías de contratación."],
        ], [3.8 * cm, WIDTH - 3.8 * cm]),
        PageBreak(),
        P("Fuentes consultadas", "h1"),
        P("Consultadas el 4 de noviembre de 2026. Los textos de ley se tomaron de compilaciones oficiales del normograma; para citar en un trabajo formal, "
          "verifiquen contra el Diario Oficial.", "lead"),
        *bullets([
            "MinTIC. <i>Documento Maestro – Marco de Referencia de Arquitectura Empresarial (MRAE) v3.0</i>, mayo de 2023. "
            "lenguaje.mintic.gov.co/sites/default/files/archivos/marco referencia_compressed.pdf (lineamientos MAE.LI.PA.04, MAE.LI.PA.05, MGGTI.LI.GO.05, "
            "MGGTI.LI.GO.06, MGGTI.LI.GO.09, MGGTI.LI.ES.04, MGGTI.LI.ES.05; pp. 23, 28, 40, 45-46 y 73-79).",
            "Congreso de Colombia. Ley 80 de 1993, arts. 2, 23 y 25 (num. 12 modificado por la Ley 1474 de 2011). normograma.dian.gov.co/dian/compilacion/docs/ley_0080_1993.htm",
            "Congreso de Colombia. Ley 1150 de 2007, arts. 2 y 5 (num. 5 del art. 2 modificado por la Ley 2069 de 2020). normograma.dian.gov.co/dian/compilacion/docs/ley_1150_2007.htm",
            "Congreso de Colombia. Ley 2300 de 2023, arts. 1, 2, 3 y 5. normativa.colpensiones.gov.co/compilacion/docs/ley_2300_2023.htm · "
            "también en funcionpublica.gov.co/eva/gestornormativo/norma.php?i=213990",
            "Presidencia de la República. Decreto 913 de 1993 (leasing), art. 2. alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=7093",
            "ISO/IEC JTC 1/SC 7. ISO/IEC 19770-1:2017, gestión de activos de TI. committee.iso.org/sites/jtc1sc7/home/projects/flagship-standards/isoiec-19770-12017.html",
            "ISO/TC 251. ISO 55000:2024, gestión de activos. committee.iso.org/sites/tc251/home/projects/published/iso-55000.html",
            "AXELOS / PeopleCert. ITIL 4, práctica de gestión de activos de TI (propósito citado en fuentes secundarias de formación ITIL 4).",
            "ISACA. COBIT 2019, dominios APO y BAI.",
            "Colombia Compra Eficiente. Acuerdo Marco de Precios de Servicios de Nube Pública. colombiacompra.gov.co",
            "TechTarget. «What is total cost of ownership (TCO)?» (concepto popularizado por Gartner).",
            "KOSMOS TIC S.A.S. y BU-TIC. Catálogo de productos y servicios (citas incluidas en la app) y sitio web kosmostic.com.",
        ]),
        Spacer(1, 6),
        note("<b>Ojo con un enlace de la app:</b> la dirección de la Ley 2300 que aparece en las fuentes de la clase "
             "(normograma.mintic.gov.co/docs/pdf/ley_2300_2023.pdf) respondía «no encontrada» al consultarla. Las direcciones de arriba sí funcionan.", CORAL, "#F6E7E2"),
    ]
    return s


def main(out):
    doc = BaseDocTemplate(out, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=1.5 * cm, bottomMargin=2 * cm,
                          title="Material de estudio de Karen · niveles 1 y 2 · Misión TI", author="Equipo 3")
    frame = Frame(MARGIN, 2 * cm, WIDTH, A4[1] - 3.5 * cm, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=page)])
    doc.build(story())
    print(f"OK: {out}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "docs/estudio-karen-niveles-1-2.pdf")
