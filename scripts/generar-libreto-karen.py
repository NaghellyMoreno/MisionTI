#!/usr/bin/env python3
"""Libreto imprimible de Karen Moreno (estratega y cronometrista), en el orden de la clase.

Toma las diapositivas, el guion y la agenda de la app (los mismos datos que se proyectan), así que si
cambian basta con volver a generarlo. Fondo blanco para imprimir.

    node scripts/exportar-guion.mjs /tmp/teoria.json
    .venv-pdf/bin/python scripts/generar-libreto-karen.py /tmp/teoria.json docs/libreto-karen.pdf
"""
import json
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Flowable
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

FONT_DIR = "/System/Library/Fonts/Supplemental/"
pdfmetrics.registerFont(TTFont("Body", FONT_DIR + "Trebuchet MS.ttf"))
pdfmetrics.registerFont(TTFont("Body-Bold", FONT_DIR + "Trebuchet MS Bold.ttf"))
pdfmetrics.registerFont(TTFont("Body-Italic", FONT_DIR + "Trebuchet MS Italic.ttf"))
pdfmetrics.registerFont(TTFont("Body-BoldItalic", FONT_DIR + "Trebuchet MS Bold Italic.ttf"))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic", boldItalic="Body-BoldItalic")

# Paleta del equipo. Fondo blanco: es para imprimir.
BLUE = colors.HexColor("#3368A0")
DEEP = colors.HexColor("#1F3F63")
SKY = colors.HexColor("#66A3BF")
MIST = colors.HexColor("#C8DFDB")
SAND = colors.HexColor("#F2EFE7")
INK = colors.HexColor("#1B2733")
MUTED = colors.HexColor("#5B6770")
LINE = colors.HexColor("#D5DCE0")
CORAL = colors.HexColor("#B5523B")
AMBER = colors.HexColor("#B7791F")
GREEN = colors.HexColor("#2F7A5C")
WHITE = colors.white

KIND = {  # color y nombre de cada tipo de diapositiva
    "concepto": (BLUE, "Teoría"),
    "kosmos": (SKY, "Así lo hace KOSMOS TIC"),
    "ley": (CORAL, "Normativa"),
    "actividad": (GREEN, "Actividad"),
    "mision": (AMBER, "Misión"),
    "portada": (DEEP, "Apertura"),
    "pausa": (MUTED, "Pausa"),
}

MARGIN = 1.7 * cm
WIDTH = A4[0] - 2 * MARGIN
TITLE = "Misión TI · Libreto de Karen · estratega y cronometrista"

# Lo que no está en la app: la frase para memorizar y la acción en el panel de cada diapositiva.
MEMORIZA = {
    "nivel1": "Antes de comprar nada: ¿qué problema del negocio queremos resolver?",
    "nivel1-kosmos": "El diagnóstico es el paso 01 de un ciclo: diagnosticar, diseñar, implementar y medir.",
    "lienzo1": "Situación, tres necesidades, una oportunidad y el reto. Uno dicta, otro escribe.",
    "nivel2": "Comprar es solo el comienzo: también cuestan la operación, el mantenimiento y el retiro.",
    "ruta-legal": "La empresa privada compra con orden de compra; la entidad pública, con contratación estatal.",
    "nivel2-kosmos": "Suscribirse a un servicio en lugar de comprar hardware: justo lo que pide el MRAE.",
    "ley2300": "Lunes a viernes de 7 a 7, sábados de 8 a 3; domingos y festivos, nunca.",
    "mercado": "Recurso, ruta legal y por qué: sin las tres cosas no hay compra.",
}
ACCION = {
    "nivel1-kosmos": "Al terminar: <b>Lanzar pregunta sorpresa</b> del banco «Nivel 1» (pestaña Clase del panel).",
    "lienzo1": "Recorre los grupos. En el panel, pestaña <b>Lienzos</b>: mira quién va atrasado.",
    "nivel2-kosmos": "Al terminar el bloque: <b>Lanzar pregunta sorpresa</b> del banco «Nivel 2».",
    "mercado": "Panel lateral: <b>Abrir mercado</b>. Minuto 8 (1:54 p. m.): Dylber lanza la carta de crisis.",
}

MY_BLOCKS = [3, 4, 5, 6]  # índices de la agenda que lidera Karen


def style(name, **kw):
    base = dict(fontName="Body", fontSize=10, leading=14, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "kicker": style("kicker", fontName="Body-Bold", fontSize=8.5, leading=11, textColor=BLUE),
    "coverk": style("coverk", fontName="Body-Bold", fontSize=10, leading=13, textColor=MIST),
    "coverT": style("coverT", fontName="Body-Bold", fontSize=34, leading=38, textColor=WHITE),
    "coverS": style("coverS", fontSize=12, leading=17, textColor=colors.HexColor("#DCE8F2")),
    "h1": style("h1", fontName="Body-Bold", fontSize=18, leading=23, spaceAfter=4),
    "h2": style("h2", fontName="Body-Bold", fontSize=12, leading=16, spaceBefore=10, spaceAfter=4, textColor=BLUE),
    "lead": style("lead", textColor=MUTED, spaceAfter=8),
    "body": style("body", spaceAfter=5),
    "small": style("small", fontSize=8.5, leading=11.5, textColor=MUTED),
    "bullet": style("bullet", leftIndent=13, bulletIndent=2, spaceAfter=3),
    "check": style("check", leftIndent=16, bulletIndent=0, spaceAfter=4, bulletFontName="ZapfDingbats", bulletFontSize=11),
    "say": style("say", fontSize=10, leading=14, leftIndent=16, bulletIndent=0, spaceAfter=4),
    "cell": style("cell", fontSize=9, leading=12),
    "cellb": style("cellb", fontSize=9, leading=12, fontName="Body-Bold"),
    "head": style("head", fontSize=8.5, leading=11, fontName="Body-Bold", textColor=BLUE),
    # Miniatura de la diapositiva
    "sK": style("sK", fontName="Body-Bold", fontSize=8, leading=10, textColor=MUTED),
    "sT": style("sT", fontName="Body-Bold", fontSize=15, leading=19),
    "sL": style("sL", fontSize=10, leading=14, textColor=colors.HexColor("#3B4955")),
    "sP": style("sP", fontSize=9.6, leading=13.4, leftIndent=14, bulletIndent=2, spaceAfter=2),
    "sQ": style("sQ", fontName="Body-Italic", fontSize=9.4, leading=13, textColor=colors.HexColor("#3B4955")),
    "sC": style("sC", fontSize=7.8, leading=10, textColor=MUTED),
    "tag": style("tag", fontName="Body-Bold", fontSize=7.8, leading=10, textColor=WHITE, alignment=1),
    "mem": style("mem", fontName="Body-Bold", fontSize=10.5, leading=14.5, textColor=DEEP),
    "memL": style("memL", fontName="Body-Bold", fontSize=7.8, leading=10, textColor=AMBER),
    "act": style("act", fontSize=9.2, leading=12.5),
    "bandT": style("bandT", fontName="Body-Bold", fontSize=17, leading=21, textColor=WHITE),
    "bandS": style("bandS", fontSize=9.5, leading=12.5, textColor=colors.HexColor("#E3EDF5")),
    "bandH": style("bandH", fontName="Body-Bold", fontSize=22, leading=24, textColor=WHITE, alignment=2),
    "cardT": style("cardT", fontName="Body-Bold", fontSize=11, leading=14, textColor=DEEP),
    "card": style("card", fontSize=9, leading=12.4, leftIndent=10, bulletIndent=0, spaceAfter=1.5),
}
P = lambda t, s="body": Paragraph(t, S[s])


def clean(t):
    return escape(t.replace("🔎", "").replace("→", "›"))


class Box(Flowable):
    """Casilla vacía para marcar con lápiz."""

    def __init__(self, size=9):
        super().__init__()
        self.size = size
        self.width = self.height = size

    def draw(self):
        self.canv.setStrokeColor(BLUE)
        self.canv.setLineWidth(0.9)
        self.canv.roundRect(0, 0, self.size, self.size, 1.5, stroke=1, fill=0)


def checklist(items):
    t = Table([[Box(), P(x, "body")] for x in items], colWidths=[0.6 * cm, WIDTH - 0.6 * cm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (0, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    return t


def bullets(items, st="bullet", mark="•"):
    return [Paragraph(t, S[st], bulletText=mark) for t in items]


def table(headers, rows, widths, bold_first=True, zebra=True):
    data = [[P(h, "head") for h in headers]] + [[P(c, "cellb" if i == 0 and bold_first else "cell") for i, c in enumerate(r)] for r in rows]
    t = Table(data, colWidths=widths, repeatRows=1)
    st = [("BACKGROUND", (0, 0), (-1, 0), SAND), ("LINEBELOW", (0, 0), (-1, 0), 0.8, BLUE),
          ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
          ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6)]
    t.setStyle(TableStyle(st))
    return t


def band(time, title, sub, color=BLUE):
    t = Table([[[P(title, "bandT"), P(sub, "bandS")], P(time, "bandH")]], colWidths=[WIDTH - 4.2 * cm, 4.2 * cm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), color), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("TOPPADDING", (0, 0), (-1, -1), 12), ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                           ("LEFTPADDING", (0, 0), (0, 0), 16), ("RIGHTPADDING", (-1, 0), (-1, 0), 16),
                           ("ROUNDEDCORNERS", [6, 6, 6, 6])]))
    return t


def slide_mock(s, n, total):
    """Miniatura de la diapositiva con el contenido exacto que se proyecta."""
    color, kind_name = KIND.get(s["kind"], (BLUE, ""))
    inner = [P(clean(s.get("kicker", "")).upper(), "sK"), Spacer(1, 2), P(clean(s["title"]), "sT")]
    if s.get("lead"):
        inner += [Spacer(1, 4), P(clean(s["lead"]), "sL")]
    if s.get("points"):
        inner += [Spacer(1, 4)] + [Paragraph(clean(p), S["sP"], bulletText="▪") for p in s["points"]]
    if s.get("quote"):
        q = Table([[[P("«" + clean(s["quote"]["text"]).strip("“”") + "»", "sQ"), P(clean(s["quote"]["cite"]), "sC")]]], colWidths=[WIDTH - 2.2 * cm])
        q.setStyle(TableStyle([("LINEBEFORE", (0, 0), (0, -1), 2.5, color), ("LEFTPADDING", (0, 0), (-1, -1), 9),
                               ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7F9FA")),
                               ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
        inner += [Spacer(1, 6), q]
    if s.get("clueFor"):
        grupos = ", ".join(g.replace("EQ", "") for g in s["clueFor"])
        inner += [Spacer(1, 5), P(f"Pista para el invitado · grupos {grupos}", "sC")]
    tag = Table([[P(kind_name.upper(), "tag")]], colWidths=[4.2 * cm])
    tag.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), color), ("ROUNDEDCORNERS", [4, 4, 4, 4]),
                             ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    head = Table([[tag, P(f"Diapositiva {n} de {total} de tu parte", "sC")]], colWidths=[4.5 * cm, WIDTH - 1.2 * cm - 4.5 * cm])
    head.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (1, 0), (1, 0), "RIGHT")]))
    box = Table([[head], [inner]], colWidths=[WIDTH - 0.6 * cm])
    box.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 1, LINE), ("LINEABOVE", (0, 0), (-1, 0), 4, color),
                             ("BACKGROUND", (0, 0), (-1, -1), WHITE), ("ROUNDEDCORNERS", [6, 6, 6, 6]),
                             ("LEFTPADDING", (0, 0), (-1, -1), 14), ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                             ("TOPPADDING", (0, 0), (-1, 0), 9), ("TOPPADDING", (0, 1), (-1, 1), 4), ("BOTTOMPADDING", (0, 1), (-1, 1), 12)]))
    wrap = Table([[box]], colWidths=[WIDTH])
    wrap.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SAND), ("ROUNDEDCORNERS", [8, 8, 8, 8]),
                              ("LEFTPADDING", (0, 0), (-1, -1), 0.3 * cm), ("RIGHTPADDING", (0, 0), (-1, -1), 0.3 * cm),
                              ("TOPPADDING", (0, 0), (-1, -1), 0.3 * cm), ("BOTTOMPADDING", (0, 0), (-1, -1), 0.3 * cm)]))
    return wrap


def memo_box(text):
    t = Table([[[P("MEMORIZA", "memL"), P(clean(text), "mem")]]], colWidths=[WIDTH])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FBF4E6")), ("LINEBEFORE", (0, 0), (0, -1), 3, AMBER),
                           ("LEFTPADDING", (0, 0), (-1, -1), 11), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return t


def action_box(text):
    t = Table([[P("EN EL PANEL", "memL"), P(text, "act")]], colWidths=[2.6 * cm, WIDTH - 2.6 * cm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EAF3EF")), ("LINEBEFORE", (0, 0), (0, -1), 3, GREEN),
                           ("TEXTCOLOR", (0, 0), (0, 0), GREEN), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return t


def say_list(lines):
    return [Paragraph(clean(l), S["say"], bulletText=f"{i}.") for i, l in enumerate(lines, 1)]


def card(title, lines):
    inner = [P(title, "cardT"), Spacer(1, 4)] + [Paragraph(l, S["card"], bulletText="›") for l in lines]
    t = Table([[inner]], colWidths=[WIDTH / 2 - 0.25 * cm], rowHeights=[5.2 * cm])
    t.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.8, SKY, None, (3, 3)), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 10)]))
    return t


def cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(DEEP)
    canvas.rect(0, A4[1] * 0.55, A4[0], A4[1] * 0.45, fill=1, stroke=0)
    canvas.setFillColor(BLUE)
    canvas.rect(0, A4[1] * 0.55, A4[0], 0.35 * cm, fill=1, stroke=0)
    # rejilla sutil, como en la app
    canvas.setStrokeColor(colors.HexColor("#2A4F78"))
    canvas.setLineWidth(0.4)
    for x in range(0, int(A4[0]), 28):
        canvas.line(x, A4[1] * 0.55 + 0.35 * cm, x, A4[1])
    for y in range(int(A4[1] * 0.55 + 0.35 * cm), int(A4[1]), 28):
        canvas.line(0, y, A4[0], y)
    canvas.restoreState()


def page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN, 1.6 * cm, A4[0] - MARGIN, 1.6 * cm)
    canvas.setFont("Body", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 1.15 * cm, TITLE)
    canvas.drawRightString(A4[0] - MARGIN, 1.15 * cm, f"{doc.page}")
    canvas.setFillColor(BLUE)
    canvas.rect(MARGIN, A4[1] - 1.05 * cm, 1.2 * cm, 0.12 * cm, fill=1, stroke=0)
    canvas.restoreState()


def story(data):
    slides, guion, agenda = data["slides"], data["guion"], data["agenda"]
    mine = [s for s in slides if s["agenda"] in MY_BLOCKS]
    total = len(mine)
    s = []

    # ---------------- Portada ----------------
    s += [
        Spacer(1, 2.6 * cm),
        P("MISIÓN TI · GESTIÓN DE RECURSOS TECNOLÓGICOS", "coverk"),
        Spacer(1, 10),
        P("Libreto de Karen", "coverT"),
        Spacer(1, 6),
        P("Estratega y cronometrista · niveles 1 y 2 del ciclo de vida, diagnóstico en el lienzo y Mercado Tecnológico", "coverS"),
        Spacer(1, 5.4 * cm),
        P("Miércoles 4 de noviembre de 2026 · 1:00 a 4:00 p. m.", "h2"),
        P("Tu parte va de la <b>1:22 a las 2:01 p. m.</b>: cuatro bloques seguidos y ocho diapositivas. "
          "Este libreto las sigue en el mismo orden en que salen en el proyector. En cada una tienes:", "body"),
        table(["", "Qué es"], [
            ["La diapositiva", "Una miniatura con el texto exacto que ve el salón."],
            ["Qué decir", "El guion, numerado, en el orden en que conviene decirlo."],
            ["Memoriza", "Una sola frase: si se te olvida todo lo demás, di esa."],
            ["En el panel", "Lo que tienes que hacer en la app en ese momento."],
        ], [3.2 * cm, WIDTH - 3.2 * cm], zebra=False),
        Spacer(1, 10),
        P("Control remoto: <b>flecha derecha</b> o <b>Av Pág</b> siguiente · <b>flecha izquierda</b> o <b>Re Pág</b> anterior · <b>B</b> o <b>punto</b> pantalla en negro. "
          "Solo funciona cuando el proyector está en <b>Teoría</b>.", "small"),
        PageBreak(),
    ]

    # ---------------- Tu día en una página ----------------
    rows = []
    for i, a in enumerate(agenda):
        mineb = i in MY_BLOCKS
        start = a["clock"].replace(" p. m.", "")
        lead = a["lead"]
        rows.append((i, start, a["minutes"], a["title"], lead, mineb))
    s += [
        P("Tu día en una página", "h1"),
        P("Tus bloques van resaltados. Como cronometrista, en <b>todos</b> los bloques avisas a quien lidera cuando falten 2 minutos.", "lead"),
    ]
    data_rows = [[P(h, "head") for h in ["Inicio", "Min", "Actividad", "Lidera", "Aviso 2 min", "Hecho"]]]
    hl = []
    for k, (i, start, mins, title, lead, mineb) in enumerate(rows, 1):
        h, m = map(int, start.split(":"))
        total_min = h * 60 + m + mins - 2
        aviso = f"{(total_min // 60 - 1) % 12 + 1}:{total_min % 60:02d}"
        data_rows.append([P(f"<b>{start}</b>", "cell"), P(str(mins), "cell"), P(("<b>" + clean(title) + "</b>") if mineb else clean(title), "cell"),
                          P(clean(lead), "cell"), P(aviso, "cell"), Box()])
        if mineb:
            hl.append(k)
    t = Table(data_rows, colWidths=[1.4 * cm, 1.0 * cm, 7.6 * cm, 3.2 * cm, 2.0 * cm, WIDTH - 15.2 * cm], repeatRows=1)
    st = [("BACKGROUND", (0, 0), (-1, 0), SAND), ("LINEBELOW", (0, 0), (-1, 0), 0.8, BLUE), ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE),
          ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5)]
    for k in hl:
        st += [("BACKGROUND", (0, k), (-1, k), colors.HexColor("#E3EEF7")), ("LINEBEFORE", (0, k), (0, k), 3, BLUE)]
    t.setStyle(TableStyle(st))
    s += [t, Spacer(1, 8), P("La clase termina a las 4:00 p. m. con la conexión en vivo con Oscar, de KOSMOS TIC.", "small")]

    s += [
        P("Antes de empezar tu parte", "h2"),
        checklist([
            "Ten a mano un cronómetro o el reloj del panel (el proyector también lo muestra arriba a la derecha).",
            "Ubica en el panel: el botón <b>Abrir mercado</b> (panel lateral), las pestañas <b>Clase</b> (preguntas sorpresa), <b>Lienzos</b> y <b>Crisis</b>.",
            "Confirma con Dylber quién lanza la carta de crisis del minuto 8 del Mercado y quién aprueba compras.",
            "Lee una vez las ocho frases de <b>Memoriza</b>: son el resumen de toda tu parte.",
        ]),
        PageBreak(),
    ]

    # ---------------- Bloques ----------------
    n = 0
    meta = {
        3: ("Nivel 1 · Identificación y diagnóstico", "Teoría · 8 minutos · termina con pregunta sorpresa", BLUE),
        4: ("Diagnóstico en el lienzo", "Actividad · 8 minutos · los grupos llenan la casilla 1", GREEN),
        5: ("Nivel 2 · Análisis y adquisición", "Teoría · 8 minutos · cuatro diapositivas: ve a buen ritmo", BLUE),
        6: ("Mercado Tecnológico", "Actividad · 15 min · con Dylber · crisis en el minuto 8", AMBER),
    }
    for bi, b in enumerate(MY_BLOCKS):
        title, sub, color = meta[b]
        clock = agenda[b]["clock"].replace(" p. m.", "")
        end_min = sum(a["minutes"] for a in agenda[: b + 1])
        end = f"{(13 * 60 + end_min) // 60 - 12}:{(13 * 60 + end_min) % 60:02d}"
        s += [band(f"{clock}", title, f"{clock} – {end} p. m. · {sub}", color), Spacer(1, 10)]
        for sl in [x for x in mine if x["agenda"] == b]:
            n += 1
            parts = [slide_mock(sl, n, total), Spacer(1, 8), P("QUÉ DECIR", "memL")]
            parts += say_list(guion.get(sl["id"], []))
            parts += [Spacer(1, 4), memo_box(MEMORIZA.get(sl["id"], ""))]
            if sl["id"] in ACCION:
                parts += [Spacer(1, 4), action_box(ACCION[sl["id"]])]
            s += [KeepTogether(parts), Spacer(1, 16)]
        if b == 4:
            s += [
                CondPageBreak(6 * cm),
                P("Mientras recorres los grupos", "h2"),
                *bullets([
                    "¿Las necesidades son <b>concretas</b>? «Mejorar la tecnología» no sirve; «los pedidos internacionales se pierden» sí.",
                    "¿Salen de los <b>problemas de su empresa</b>? Están en la pestaña Lienzo, en el perfil del caso.",
                    "¿Nombran el <b>reto</b>? Presupuesto, personas, conectividad o, en la Alcaldía, la ley.",
                    "Si ya piensan en qué comprar: que lo anoten para el Mercado. La casilla 1 es diagnóstico, no lista de compras.",
                ]),
            ]
        if b == 6:
            s += [
                CondPageBreak(7 * cm),
                P("Criterios para aprobar una compra", "h2"),
                table(["Aprobar si…", "Pedir que la ajusten si…"], [
                    ["La justificación nombra un problema de su diagnóstico.", "La justificación es genérica («la necesitamos»)."],
                    ["La ruta legal corresponde al tipo de empresa.", "La Alcaldía usa orden de compra privada (la auditoría la castiga)."],
                    ["El método tiene sentido para el caso.", "Es incoherente: software a la medida para la papelería."],
                ], [WIDTH / 2, WIDTH / 2], bold_first=False),
                PageBreak(),
                P("Rutas legales del juego", "h2"),
                table(["Ruta", "Cuándo"], [
                    ["Orden de compra privada", "Empresas privadas: Clínica, Colegio, Café, TiendaYa y Papelería."],
                    ["Mínima cuantía", "Alcaldía, compras pequeñas: red, respaldo, capacitación."],
                    ["Selección abreviada", "Alcaldía, bienes uniformes: computadores, nube por Acuerdo Marco."],
                    ["Licitación pública", "Alcaldía, compras grandes o complejas: ERP, software a la medida."],
                    ["Contratación directa", "Alcaldía, solo con causal: proveedor único o contrato interadministrativo."],
                    ["Convenio o donación", "Alcaldía, acuerdos con otra entidad o bienes recibidos."],
                ], [4.2 * cm, WIDTH - 4.2 * cm]),
                Spacer(1, 8),
                P("Cartas de crisis (para explicar el castigo o el premio)", "h2"),
                table(["Carta", "Regla"], [
                    ["El proveedor quebró", "Equipos físicos sin soporte: −10 TC."],
                    ["Ataque de ransomware", "Con respaldo: +5 TC. Sin respaldo: −15 TC."],
                    ["Recorte de presupuesto", "Todos pierden el 20 % de su saldo."],
                    ["Resistencia al cambio", "Con capacitación: +10 TC. Sin capacitación: −5 TC."],
                    ["Auditoría de contratación", "Entidad pública con compras fuera de la contratación estatal: −10 TC."],
                    ["Oportunidad inesperada", "Bono manual para quien justifique su impacto en 30 segundos."],
                ], [4.6 * cm, WIDTH - 4.6 * cm]),
            ]
        s.append(PageBreak())

    # ---------------- Tarjetas ----------------
    cards = [
        ("1 · Las cuatro preguntas del diagnóstico", ["Situación actual (inventario)", "Necesidades específicas: cuestan dinero, tiempo o clientes",
                                                     "Oportunidad tecnológica", "Reto que puede frenar el cambio"]),
        ("2 · El MRAE en una línea", ["Línea base: cómo opera hoy", "Situación objetivo: cómo debería operar", "Brecha: la diferencia",
                                      "Hoja de ruta: cómo cerrarla"]),
        ("3 · Tangible o intangible", ["Tangible: equipos, servidores, red", "Intangible: licencias, nube, servicios, conocimiento",
                                       "Una licencia es intangible: es un derecho de uso"]),
        ("4 · Cinco métodos de adquisición", ["Compra · leasing · suscripción", "Desarrollo propio o contratado · donación",
                                              "Leasing: cánones + opción de compra al final"]),
        ("5 · Costo total de propiedad", ["Adquisición + operación + mantenimiento + retiro", "Comprar es solo el comienzo",
                                          "Lo barato (donado) puede salir caro"]),
        ("6 · Ruta legal", ["Privada: orden de compra", "Pública: Ley 80 de 1993 y Ley 1150 de 2007",
                            "Licitación (regla general), selección abreviada, concurso de méritos, directa, mínima cuantía"]),
        ("7 · Ley 2300 de 2023", ["«Dejen de fregar»", "L-V 7:00 a. m. a 7:00 p. m. · sáb. 8:00 a. m. a 3:00 p. m.",
                                  "Domingos y festivos: nunca", "Máximo un contacto al día"]),
        ("8 · KOSMOS TIC en tu parte", ["Paso 01: «Diagnóstico Integral» (pista grupo 01)", "SaaS: crece sin grandes inversiones (grupos 02 y 14)",
                                        "IP PBX: central telefónica en la nube"]),
    ]
    s += [P("Tarjetas de memoria", "h1"),
          P("Recórtalas por la línea punteada y repásalas antes de la clase. Cada tarjeta es una idea que tienes que poder decir sin mirar.", "lead")]
    for i in range(0, len(cards), 2):
        row = Table([[card(*cards[i]), card(*cards[i + 1])]], colWidths=[WIDTH / 2, WIDTH / 2])
        row.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
        s.append(row)
    s.append(PageBreak())

    # ---------------- Preguntas sorpresa ----------------
    s += [
        P("Respuestas de tus preguntas sorpresa", "h1"),
        P("Al lanzar la pregunta, la app escoge al estudiante. Cuando se acabe el tiempo, el proyector muestra la respuesta: léela en voz alta y explícala en una frase.", "lead"),
        table(["Banco", "Pregunta", "Respuesta", "Explícala así"], [
            ["Nivel 1", "Hacer el inventario de la tecnología que tiene hoy la empresa corresponde a…", "Identificar la situación actual", "El inventario muestra qué hay y cómo funciona hoy."],
            ["Nivel 1", "«Los clientes no pueden comprar cuando la página se cae» describe…", "Una necesidad específica", "Es un problema concreto del negocio."],
            ["Nivel 1", "Descubrir que los clientes ya escriben por WhatsApp y se les puede atender por ahí es…", "Una oportunidad tecnológica", "Existe y se puede aprovechar."],
            ["Nivel 1", "En las estrategias de servicio al cliente de KOSMOS TIC, ¿cuál es el paso 01?", "Diagnóstico integral", "Primero analizan los procesos actuales."],
            ["Nivel 1", "¿Qué pregunta debe guiar el diagnóstico?", "¿Qué problema del negocio queremos resolver?", "La tecnología se elige por el problema, no por la moda."],
            ["Nivel 2", "Una licencia de software es un recurso…", "Intangible", "Es un derecho de uso."],
            ["Nivel 2", "Pagar mes a mes por usar un software en la nube es adquirir por…", "Suscripción (SaaS)", "Software como servicio: se paga por usarlo."],
            ["Nivel 2", "Una alcaldía que compra tecnología debe seguir…", "La contratación estatal", "Ley 80 de 1993 y Ley 1150 de 2007."],
            ["Nivel 2", "El costo total de propiedad (TCO) incluye…", "Adquisición, operación, mantenimiento y retiro", "Comprar es solo el comienzo."],
            ["Nivel 2", "Según KOSMOS TIC, una ventaja de sus sistemas SaaS es que…", "Crecen sin grandes inversiones iniciales", "Lo dice su catálogo."],
            ["Nivel 2", "Según la Ley 2300 de 2023, un sábado se pueden enviar mensajes comerciales…", "Entre 8:00 a. m. y 3:00 p. m.", "Domingos y festivos, nunca."],
        ], [1.5 * cm, 6.6 * cm, 4.2 * cm, WIDTH - 12.3 * cm]),
        Spacer(1, 14),
        P("Si te preguntan algo difícil", "h2"),
        table(["Pregunta", "Respuesta corta"], [
            ["¿El diagnóstico no es lo mismo que el inventario?", "No: el inventario es solo la primera pregunta. El diagnóstico también dice qué falta, qué se puede aprovechar y qué puede salir mal."],
            ["¿Por qué no comprar lo más moderno?", "Porque puede no resolver el problema, costar más de lo que la empresa puede sostener o quedar guardado sin uso."],
            ["¿Por qué la Alcaldía no puede comprar como cualquiera?", "Porque maneja recursos públicos: la Ley 80 exige transparencia, economía y responsabilidad, y la Ley 1150 una selección objetiva."],
            ["¿Qué es mejor, nube o servidor propio?", "Depende del diagnóstico. El MRAE pide preferir servicios por demanda y minimizar la compra de hardware."],
            ["¿La Ley 2300 aplica a cualquier empresa?", "Nació para las cobranzas, pero su artículo 5 la extiende a los mensajes comerciales por SMS, aplicaciones, web, correo y llamadas."],
        ], [5.4 * cm, WIDTH - 5.4 * cm]),
    ]
    return s


def main(data_path, out):
    data = json.load(open(data_path, encoding="utf-8"))
    doc = BaseDocTemplate(out, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=1.5 * cm, bottomMargin=2 * cm,
                          title="Libreto de Karen · Misión TI", author="Equipo 3")
    frame = Frame(MARGIN, 2 * cm, WIDTH, A4[1] - 3.5 * cm, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="portada", frames=[frame], onPage=cover),
                          PageTemplate(id="p", frames=[frame], onPage=page)])
    from reportlab.platypus import NextPageTemplate
    st = story(data)
    st.insert(0, NextPageTemplate("p"))
    doc.build(st)
    print(f"OK: {out}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: generar-libreto-karen.py <teoria.json> <salida.pdf>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
