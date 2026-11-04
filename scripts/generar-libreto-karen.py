#!/usr/bin/env python3
"""Libreto de Karen Moreno, versión para tener a mano: solo lo que se dice, en el orden de la clase.

Toma el guion y la agenda de la app (los mismos datos que se proyectan), así que si cambian basta con
volver a generarlo. Fondo blanco, letra grande, para imprimir o leer en el celular.

    node scripts/exportar-guion.mjs /tmp/teoria.json
    .venv-pdf/bin/python scripts/generar-libreto-karen.py /tmp/teoria.json docs/libreto-karen.pdf
"""
import json
import re
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import CondPageBreak, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

FONT_DIR = "/System/Library/Fonts/Supplemental/"
pdfmetrics.registerFont(TTFont("Body", FONT_DIR + "Trebuchet MS.ttf"))
pdfmetrics.registerFont(TTFont("Body-Bold", FONT_DIR + "Trebuchet MS Bold.ttf"))
pdfmetrics.registerFont(TTFont("Body-Italic", FONT_DIR + "Trebuchet MS Italic.ttf"))
pdfmetrics.registerFont(TTFont("Body-BoldItalic", FONT_DIR + "Trebuchet MS Bold Italic.ttf"))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic", boldItalic="Body-BoldItalic")

BLUE = colors.HexColor("#3368A0")
INK = colors.HexColor("#1B2733")
MUTED = colors.HexColor("#7A858D")
AMBER = colors.HexColor("#B7791F")

MARGIN = 1.8 * cm
WIDTH = A4[0] - 2 * MARGIN
MY_BLOCKS = [3, 4, 5, 6]  # índices de la agenda que lidera Karen

# La frase clave de cada diapositiva: si se olvida todo lo demás, se dice esta.
CLAVE = {
    "nivel1": "Antes de comprar nada: ¿qué problema del negocio queremos resolver?",
    "nivel1-kosmos": "El diagnóstico es el paso 01 de un ciclo: diagnosticar, diseñar, implementar y medir.",
    "lienzo1": "Situación, tres necesidades, una oportunidad y el reto. Uno dicta, otro escribe.",
    "nivel2": "Comprar es solo el comienzo: también cuestan la operación, el mantenimiento y el retiro.",
    "ruta-legal": "La empresa privada compra con orden de compra; la entidad pública, con contratación estatal.",
    "nivel2-kosmos": "Suscribirse a un servicio en lugar de comprar hardware: justo lo que pide el MRAE.",
    "ley2300": "Lunes a viernes de 7 a 7, sábados de 8 a 3; domingos y festivos, nunca.",
    "mercado": "Recurso, ruta legal y por qué: sin las tres cosas no hay compra.",
}


def style(name, **kw):
    base = dict(fontName="Body", fontSize=12, leading=17, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "title": style("title", fontName="Body-Bold", fontSize=20, leading=24, spaceAfter=2),
    "sub": style("sub", fontSize=10, leading=13, textColor=MUTED, spaceAfter=14),
    "block": style("block", fontName="Body-Bold", fontSize=15, leading=19, textColor=BLUE),
    "slide": style("slide", fontName="Body-Bold", fontSize=9, leading=12, textColor=MUTED, spaceBefore=10, spaceAfter=5),
    "say": style("say", leftIndent=18, bulletIndent=0, spaceAfter=7),
    "cue": style("cue", fontName="Body-Italic", fontSize=9.5, leading=13, textColor=MUTED, leftIndent=18, spaceAfter=6),
    "key": style("key", fontName="Body-Bold", fontSize=12, leading=16, textColor=INK),
}


def say(text):
    """Escapa el texto y deja las acotaciones [entre corchetes] en gris pequeño."""
    t = escape(text.replace("🔎", "").replace("→", "›"))
    return re.sub(r"\[([^\]]*)\]", r'<font size="9.5" color="#7A858D"><i>(\1)</i></font>', t)


def key_box(text):
    t = Table([[Paragraph('<font size="8.5" color="#B7791F">CLAVE</font>  ' + escape(text), S["key"])]], colWidths=[WIDTH])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FBF4E6")),
                           ("LINEBEFORE", (0, 0), (0, -1), 3, AMBER),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 6),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return t


def block_head(clock, end, title, minutes):
    t = Table([[Paragraph(f"{clock} – {end}", S["block"]), Paragraph(f"{escape(title)}  <font size='10' color='#7A858D'>{minutes} min</font>", S["block"])]],
              colWidths=[3.6 * cm, WIDTH - 3.6 * cm])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 1.2, BLUE), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 5), ("VALIGN", (0, 0), (-1, -1), "BOTTOM")]))
    return t


def hhmm(minutes_from_one):
    m = 13 * 60 + minutes_from_one
    return f"{(m // 60 - 1) % 12 + 1}:{m % 60:02d}"


def story(data):
    slides, guion, agenda = data["slides"], data["guion"], data["agenda"]
    s = [
        Paragraph("Libreto de Karen · lo que digo", S["title"]),
        Paragraph("Misión TI · miércoles 4 de noviembre de 2026 · mi parte: 1:22 a 2:01 p. m. · "
                  "aviso a quien lidera cuando falten 2 minutos", S["sub"]),
    ]
    for b in MY_BLOCKS:
        a = agenda[b]
        start = sum(x["minutes"] for x in agenda[:b])
        s += [CondPageBreak(5 * cm), Spacer(1, 6),
              block_head(hhmm(start), hhmm(start + a["minutes"]), a["title"], a["minutes"])]
        for sl in [x for x in slides if x["agenda"] == b]:
            lines, n = [], 0
            for l in guion.get(sl["id"], []):
                if re.fullmatch(r"\[[^\]]*\]", l.strip()):  # acotación sola: no se dice, va sin número
                    lines.append(Paragraph("(" + escape(l.strip()[1:-1]) + ")", S["cue"]))
                else:
                    n += 1
                    lines.append(Paragraph(say(l), S["say"], bulletText=f"{n}."))
            head = [Paragraph(escape("Diapositiva · " + sl["title"]).upper(), S["slide"])]
            # El título queda pegado a su primer párrafo; la frase clave, al último.
            s += [KeepTogether(head + lines[:1])] + lines[1:-1]
            tail = lines[-1:]
            if sl["id"] in CLAVE:
                tail += [Spacer(1, 2), key_box(CLAVE[sl["id"]])]
            s += [KeepTogether(tail), Spacer(1, 4)]
    return s


def page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Body", 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(A4[0] - MARGIN, 1.1 * cm, f"{doc.page}")
    canvas.restoreState()


def main(data_path, out):
    data = json.load(open(data_path, encoding="utf-8"))
    doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=1.6 * cm,
                            bottomMargin=1.8 * cm, title="Libreto de Karen · Misión TI", author="Equipo 3")
    doc.build(story(data), onFirstPage=page, onLaterPages=page)
    print(f"OK: {out}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: generar-libreto-karen.py <teoria.json> <salida.pdf>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
