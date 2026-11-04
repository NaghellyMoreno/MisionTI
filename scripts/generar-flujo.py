#!/usr/bin/env python3
"""Genera docs/flujo-app.pdf: cómo funciona la app, guía para el equipo docente.

    python3 -m venv .venv-pdf && .venv-pdf/bin/pip install "reportlab==4.2.5"
    .venv-pdf/bin/python scripts/generar-flujo.py docs/flujo-app.pdf
"""
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Flowable, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
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
WHITE = colors.white

TITLE = "Misión TI · Cómo funciona la app · guía para el equipo docente"
MARGIN = 1.37 * cm
WIDTH = A4[0] - 2 * MARGIN


def style(name, **kw):
    base = dict(fontName="Body", fontSize=9, leading=12, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "kicker": style("kicker", fontName="Body-Bold", fontSize=8.5, textColor=BLUE),
    "title": style("title", fontName="Body-Bold", fontSize=24, leading=30, spaceBefore=4, spaceAfter=4),
    "sub": style("sub", textColor=MUTED, fontSize=9.5),
    "h1": style("h1", fontName="Body-Bold", fontSize=15, leading=20, spaceBefore=10, spaceAfter=2),
    "lead": style("lead", textColor=MUTED, spaceAfter=8),
    "body": style("body"),
    "label": style("label", fontName="Body-Bold", textColor=BLUE),
    "ojo": style("ojo", fontName="Body-Bold", textColor=CORAL),
    "bandL": style("bandL", fontName="Body-Bold", fontSize=13, textColor=WHITE, leading=16),
    "bandR": style("bandR", fontSize=8.5, textColor=WHITE, alignment=2),
    "check": style("check"),
}
P = lambda t, s="body": Paragraph(t, S[s])


class Diagram(Flowable):
    """Tres pantallas que hablan con el servidor."""

    def __init__(self, width):
        super().__init__()
        self.width, self.height = width, 5.9 * cm

    def box(self, c, x, y, w, h, title, route, note):
        c.setFillColor(WHITE)
        c.setStrokeColor(BLUE)
        c.setLineWidth(1)
        c.roundRect(x, y, w, h, 5, fill=1, stroke=1)
        cx = x + w / 2
        c.setFillColor(INK)
        c.setFont("Body-Bold", 11)
        c.drawCentredString(cx, y + h - 17, title)
        c.setFillColor(BLUE)
        c.setFont("Body", 8.5)
        c.drawCentredString(cx, y + h - 30, route)
        c.setFillColor(MUTED)
        c.setFont("Body", 7.5)
        for i, line in enumerate(note):
            c.drawCentredString(cx, y + h - 42 - i * 10, line)

    def arrow(self, c, x1, y1, x2, y2, color):
        import math
        c.setStrokeColor(color)
        c.setFillColor(color)
        c.setLineWidth(1)
        c.line(x1, y1, x2, y2)
        a = math.atan2(y2 - y1, x2 - x1)
        s = 5
        p = c.beginPath()
        p.moveTo(x2, y2)
        p.lineTo(x2 - s * math.cos(a - 0.4), y2 - s * math.sin(a - 0.4))
        p.lineTo(x2 - s * math.cos(a + 0.4), y2 - s * math.sin(a + 0.4))
        p.close()
        c.drawPath(p, fill=1, stroke=0)

    def draw(self):
        c = self.canv
        w = self.width
        bw, bh, gap = (w - 2 * 0.65 * cm) / 3, 2.0 * cm, 0.65 * cm
        top = self.height - bh
        xs = [0, bw + gap, 2 * (bw + gap)]
        self.box(c, xs[0], top, bw, bh, "Panel docente", "/control", ["Lo manejan José, Karen,", "Dylber y Camila"])
        self.box(c, xs[1], top, bw, bh, "Celular o computador", "/equipo", ["Cada estudiante, con su", "nombre y su grupo"])
        self.box(c, xs[2], top, bw, bh, "Proyector", "/proyector", ["El video beam; también se", "comparte en el Meet"])
        sw, sh = 8.6 * cm, 1.55 * cm
        sx, sy = (w - sw) / 2, 0
        c.setFillColor(BLUE)
        c.roundRect(sx, sy, sw, sh, 5, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Body-Bold", 11)
        c.drawCentredString(w / 2, sy + sh - 19, "Servidor + base de datos")
        c.setFont("Body", 8)
        c.drawCentredString(w / 2, sy + 12, "aplica las reglas del juego y guarda todo")
        self.arrow(c, xs[0] + bw / 2, top, sx + 1.4 * cm, sh, INK)
        self.arrow(c, w / 2, top, w / 2, sh, INK)
        self.arrow(c, sx + sw - 1.4 * cm, sh, xs[2] + bw / 2, top, SKY)
        mid = sh + (top - sh) / 2
        c.setFont("Body", 7.8)
        c.setFillColor(MUTED)
        c.drawString(0, mid, "órdenes del docente")
        c.drawString(w / 2 + 6, mid, "respuestas, compras, votos")
        c.setFillColor(SKY)
        c.drawRightString(w, mid, "aviso a todas las pantallas")


def pairs(rows, col=3.4 * cm):
    data = [[P(k, "label"), P(v)] for k, v in rows]
    t = Table(data, colWidths=[col, WIDTH - col])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def checks(items):
    data = [[P("☐", "check"), P(t)] for t in items]
    t = Table(data, colWidths=[0.55 * cm, WIDTH - 0.55 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TEXTCOLOR", (0, 0), (0, -1), BLUE),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def block(clock, name, meta, rows, band=BLUE):
    head = Table([[P(clock, "bandL"), P(name, "bandL"), P(meta, "bandR")]],
                 colWidths=[1.6 * cm, 7.4 * cm, WIDTH - 9.0 * cm])
    head.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), band),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (0, 0), 10),
        ("RIGHTPADDING", (-1, 0), (-1, 0), 10),
    ]))
    body = [[P(k, "ojo" if k == "Ojo" else "label"), P(v)] for k, v in rows]
    inner = Table(body, colWidths=[3.5 * cm, WIDTH - 3.5 * cm - 20])
    inner.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    outer = Table([[head], [inner]], colWidths=[WIDTH])
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.8, MIST),
        ("LEFTPADDING", (0, 0), (-1, 0), 0), ("RIGHTPADDING", (0, 0), (-1, 0), 0),
        ("TOPPADDING", (0, 0), (-1, 0), 0), ("BOTTOMPADDING", (0, 0), (-1, 0), 0),
        ("LEFTPADDING", (0, 1), (-1, 1), 10), ("TOPPADDING", (0, 1), (-1, 1), 8), ("BOTTOMPADDING", (0, 1), (-1, 1), 4),
    ]))
    return KeepTogether([outer, Spacer(1, 8)])


def grade_rows(rows):
    out = []
    for name, weight, how in rows:
        t = Table([[P(f"<b>{name}</b>"), P(f"<b>{weight}</b>", "label"), P(how)]],
                  colWidths=[5.0 * cm, 2.0 * cm, WIDTH - 7.0 * cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), WHITE),
            ("BOX", (0, 0), (-1, -1), 0.8, MIST),
            ("LEFTPADDING", (0, 0), (0, 0), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        out += [t, Spacer(1, 4)]
    return out


def page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setFont("Body", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 1.2 * cm, TITLE)
    canvas.drawRightString(A4[0] - MARGIN, 1.2 * cm, f"Página {doc.page}")
    canvas.restoreState()


def story():
    s = [
        P("MISIÓN TI · GESTIÓN DE RECURSOS TECNOLÓGICOS", "kicker"),
        P("Cómo funciona la app", "title"),
        P("Guía para el equipo docente · miércoles 4 de noviembre de 2026 · 1:00 a 4:00 p. m. · 27 estudiantes en 11 grupos", "sub"),
        P("1. Tres pantallas conectadas", "h1"),
        P("La app tiene tres pantallas y ninguna habla directamente con otra: todo pasa por el servidor. Así las reglas del juego se "
          "aplican en un solo lugar y nadie puede hacer trampa desde el celular o computador.", "lead"),
        Diagram(WIDTH),
        Spacer(1, 10),
        P("Cuando alguien hace algo (un docente abre el Mercado, un estudiante responde), el servidor revisa que se pueda, lo guarda y "
          "avisa a todas las pantallas, que se actualizan en uno o dos segundos. Si el aviso no llega por la red, cada pantalla vuelve a "
          "preguntar sola cada 3 segundos. La respuesta correcta de una pregunta nunca viaja al celular o computador antes de que el "
          "estudiante conteste."),
        P("2. Cómo entra cada quien", "h1"),
        Spacer(1, 4),
        pairs([
            ("Estudiantes", "Desde el celular escanean el QR que muestra el proyector en la Sala; desde el computador escriben la dirección "
             "que aparece junto al QR. Eligen su grupo, su nombre y escriben el código del grupo. Si alguien no tiene batería, entra desde "
             "el celular o computador de un compañero con el botón Cambiar."),
            ("Docentes", "Entran a /control con su nombre y el código docente (configurado en Vercel)."),
            ("Proyector", "En el computador del video beam: ingresar como docente, abrir /proyector, pantalla completa (F11) y pulsar "
             "Activar sonido. Desde el panel, en «En el proyector», se elige qué se muestra."),
        ]),
        P("3. Antes de la clase (12:30 p. m.)", "h1"),
        Spacer(1, 4),
        checks([
            "Control &gt; Ajustes &gt; Reiniciar partida (escribir REINICIAR). Borra compras, respuestas, preguntas y asistencia; conserva los pesos de la nota.",
            "Control &gt; Ajustes &gt; Mostrar códigos: tener a mano el código de cada grupo, sin proyectarlo.",
            "Probar el control remoto: las flechas de avanzar y retroceder pasan diapositivas cuando el proyector está en Teoría; B o el punto ponen la pantalla en negro.",
            "Control &gt; Invitado &gt; Abrir Meet, para tener lista la conexión con Oscar.",
            "12:45 p. m.: en «En el proyector» elegir Sala. En Asistencia se ve quién falta: el nombre se pone en verde al entrar.",
        ]),
        PageBreak(),
        P("4. Paso a paso de la clase", "h1"),
        P("Cada bloque indica quién lo lidera, qué se hace en el panel docente, qué muestra el proyector, qué hace el estudiante en el "
          "celular o computador y qué conviene vigilar.", "lead"),
        block("1:00", "Fase 1 · Fuente", "1:00–1:17 · 17 min · lidera: José", [
            ("Panel", "Cronograma: botón de reproducir y luego Iniciar; la teoría salta sola a su diapositiva. Clase: avanzar diapositivas "
             "con el control remoto. Al cerrar el bloque, Lanzar pregunta sorpresa del banco «fuente»."),
            ("Proyector", "Alerta Roja con sonido y después las fuentes: bibliografía, normativa y el expediente de KOSMOS TIC."),
            ("Celular o computador", "La misma diapositiva en pequeño. Al escogido le llega la pregunta sorpresa a pantalla completa: 45 s, individual."),
            ("Ojo", "La app escoge al azar entre los conectados, empezando por quienes menos preguntas han recibido. Si a alguien se le "
             "apagó el celular o computador, Clase &gt; Historial &gt; Anular: no cuenta en su nota."),
        ]),
        block("1:17", "Fase 2 · Entrega: el juego", "1:17–2:34 · 77 min · lidera: Dylber, Karen y Camila", [
            ("Panel", "Cada nivel: diapositivas y sorpresa al cerrar (el panel sugiere el banco). Karen abre el Mercado (15 min). Dylber "
             "aprueba o rechaza compras en Solicitudes y lanza las cartas de crisis: una en el minuto 8 del Mercado y otra en «Ubicación y "
             "plan de capacitación». En Lienzos se ve el avance de cada grupo."),
            ("Proyector", "Teoría de los niveles 1 a 6, ranking de TecnoCoins, aviso de Mercado abierto y la carta de crisis a pantalla completa."),
            ("Celular o computador", "Lienzo: 6 casillas, una por nivel, que se guardan solas mientras escriben. Mercado: elegir recurso, ruta legal y "
             "una justificación (15 caracteres o más). La solicitud queda «En revisión» con sus TC reservados."),
            ("Ojo", "Si se rechaza una compra, los TC vuelven y el grupo ve la nota del docente. No se puede pedir dos veces el mismo "
             "recurso. La Alcaldía es entidad pública y debe usar una ruta de contratación estatal. Cada carta suma o resta TC según su "
             "regla y, en varias, según lo que cada grupo compró (por ejemplo, respaldo o soporte)."),
        ]),
        block("2:34", "Pausa activa", "2:34–2:42 · 8 min · lidera: Todo el equipo", [
            ("Proyector", "Diapositiva de pausa."),
            ("Celular o computador", "Nada que hacer: 60 segundos de estiramiento de pie y luego descanso."),
        ], band=SKY),
        block("2:42", "Fase 4 · Evaluación", "2:42–3:20 · 38 min · lidera: Camila y José", [
            ("Semáforo", "2:42 · Camila. Abrir un escenario; cada grupo vota verde, amarillo o rojo de pie con el celular o computador; "
             "Revelar. Los grupos que aciertan ganan 5 TC."),
            ("Galería", "2:52 · José. Abrir votación: los lienzos se cierran y todos pueden leer los de los demás. El proyector los rota "
             "cada 15 s o muestra el que se fije en Lienzos. El vocero defiende el suyo en 20 s y cada grupo vota los 2 mejores, sin el "
             "propio. José califica la rúbrica de 6 criterios."),
            ("Quiz", "2:58 · Camila. Iniciar quiz: 12 preguntas en 15 min, en un orden distinto para cada estudiante, sin saber si acertó. "
             "El proyector muestra el reloj y cuántos terminaron, y avisa «¡Todos terminaron!». Luego, Terminar y mostrar ranking: más "
             "aciertos y, si empatan, menos tiempo."),
            ("Notas", "3:13 · José. En Notas se ven todas las notas; Descargar para Excel. Proyector en Podio para la premiación; si dos grupos empatan en TC, desempata la votación de la Galería (por eso conviene revelarla antes)."),
        ]),
        block("3:20", "Fase 3 · Invitado: KOSMOS TIC", "3:20–4:00 · 40 min · lidera: Camila y José", [
            ("Panel", "3:20: los grupos afinan su pregunta en Invitado; Abrir Meet y probar audio con Oscar. 3:30: poner cada pregunta En "
             "pantalla, en orden del nivel 1 al 6, y luego Marcar hecha. Corregir permite pulir la redacción antes."),
            ("Proyector", "La pregunta del grupo y el orden de la entrevista. Se comparte en el Meet con Presentar &gt; Una pestaña."),
            ("Celular o computador", "Cada grupo tiene un tema y una pista con cita oficial. Escriben una sola pregunta y la hacen en su turno, en máximo 30 s."),
            ("Ojo", "La conexión es lo último de la clase y termina a las 4:00 p. m. Cierre con la última diapositiva."),
        ]),
        P("5. La nota de 0 a 5", "h1"),
        P("Cada componente se calcula con lo que el estudiante obtuvo y va de 0 a 5; la nota final es su promedio ponderado, así que "
          "nunca pasa de 5,0. Los pesos se cambian en Notas y deben sumar 100 %.", "lead"),
        *grade_rows([
            ("Preguntas sorpresa", "25 %", "aciertos ÷ preguntas recibidas × 5 (sin contar las anuladas)"),
            ("Quiz final", "30 %", "aciertos ÷ 12 × 5 (las no respondidas cuentan como error)"),
            ("Lienzo", "30 %", "promedio de la rúbrica de José (cada criterio de 1 a 5)"),
            ("Presupuesto", "15 %", "3,0 al grupo con menos TC y 5,0 al que más tiene"),
        ]),
        P("Si a alguien le falta un componente (por ejemplo, nunca le tocó pregunta sorpresa), ese componente se excluye y su peso se "
          "reparte entre los demás; la tabla lo marca con *. Si hay datos fuera de rango, no se usan y la fila dice «revisar».", "lead"),
        P("6. Si algo falla", "h1"),
        Spacer(1, 4),
        pairs([
            ("Wifi lento", "Que los estudiantes usen datos móviles. Las pantallas se actualizan solas cada 3 s aunque falle el aviso."),
            ("Sin señal", "Si el celular o computador pierde la señal, la respuesta a una sorpresa se guarda y se envía al reconectar, pero solo cuenta si llega antes del "
             "límite más 3 s. Si llega tarde, el celular o computador lo avisa."),
            ("Equipo apagado", "Si se apagó el celular o computador: Clase &gt; Historial &gt; Anular la sorpresa de esa persona; puede entrar desde otro celular o "
             "computador con Cambiar."),
            ("Quiz con problemas", "Volver a empezar pide confirmación y borra solo las respuestas del quiz."),
        ], col=3.4 * cm),
    ]
    return s


def main(out):
    doc = BaseDocTemplate(out, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=1.5 * cm, bottomMargin=2 * cm,
                          title="Cómo funciona Misión TI · guía para el equipo docente", author="Equipo 3")
    frame = Frame(MARGIN, 2 * cm, WIDTH, A4[1] - 3.5 * cm, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=page)])
    doc.build(story())
    print(f"OK: {out}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "docs/flujo-app.pdf")
