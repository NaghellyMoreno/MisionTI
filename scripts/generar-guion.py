#!/usr/bin/env python3
"""Genera el PDF de estudio con la teoría de la clase y lo que hay que decir en cada diapositiva.

Los datos salen de src/domain/data (lessons, guion, agenda, sources), así que si cambian las
diapositivas basta con volver a generar el PDF:

    python3 -m venv .venv-pdf && .venv-pdf/bin/pip install "reportlab==4.2.5"
    node scripts/exportar-guion.mjs /tmp/teoria.json
    .venv-pdf/bin/python scripts/generar-guion.py /tmp/teoria.json docs/guion-teoria.pdf
"""
import json
import re
import sys
from collections import OrderedDict
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
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
AMBER = colors.HexColor("#B7791F")

KIND_LABEL = {
    "portada": "Apertura", "concepto": "Teoría", "kosmos": "KOSMOS TIC", "ley": "Normativa",
    "actividad": "Actividad", "mision": "Misión", "pausa": "Pausa activa",
}


def clean(text: str) -> str:
    """Texto seguro para Paragraph: sin emojis (la fuente no los tiene) y con XML escapado."""
    return escape(text.replace("🔎", "[lupa]"))


def style(name, **kw):
    base = dict(fontName="Body", fontSize=10.5, leading=15, textColor=INK, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "title": style("title", fontName="Body-Bold", fontSize=30, leading=34, textColor=BLUE),
    "subtitle": style("subtitle", fontSize=14, leading=19, textColor=MUTED),
    "h1": style("h1", fontName="Body-Bold", fontSize=17, leading=21, textColor=BLUE, spaceBefore=6, spaceAfter=2),
    "block_meta": style("block_meta", fontSize=9.5, leading=13, textColor=MUTED, spaceAfter=8),
    "kicker": style("kicker", fontName="Body-Bold", fontSize=8.5, leading=11, textColor=SKY),
    "slide_title": style("slide_title", fontName="Body-Bold", fontSize=12.5, leading=16),
    "label": style("label", fontName="Body-Bold", fontSize=8.5, leading=11, textColor=BLUE, spaceBefore=6, spaceAfter=2),
    "body": style("body"),
    "small": style("small", fontSize=9, leading=12.5, textColor=MUTED),
    "bullet": style("bullet", leftIndent=12, bulletIndent=0, spaceAfter=2),
    "say": style("say", leftIndent=12, bulletIndent=0, spaceAfter=3, fontSize=10.5, leading=15),
    "quote": style("quote", fontName="Body-Italic", fontSize=10, leading=14, leftIndent=10, textColor=INK),
    "cite": style("cite", fontSize=8.5, leading=11, leftIndent=10, textColor=MUTED, spaceAfter=2),
    "clue": style("clue", fontName="Body-Bold", fontSize=9, leading=12, textColor=AMBER, spaceBefore=4),
    "cell": style("cell", fontSize=9.5, leading=12.5),
    "cell_head": style("cell_head", fontName="Body-Bold", fontSize=9, leading=12, textColor=colors.white),
    "ref": style("ref", fontSize=9, leading=12.5, spaceAfter=4, leftIndent=10),
}


def slide_flow(slide, say, agenda_item):
    """Una diapositiva: lo que se ve en pantalla y, debajo, lo que hay que decir."""
    kind = KIND_LABEL.get(slide["kind"], slide["kind"])
    head = Paragraph(f'{clean(slide["kicker"]).upper()}  ·  {kind.upper()}', S["kicker"])
    title = Paragraph(clean(slide["title"]), S["slide_title"])

    screen = []
    if slide.get("lead"):
        screen.append(Paragraph(clean(slide["lead"]), S["body"]))
    for p in slide.get("points", []):
        screen.append(Paragraph(clean(p), S["bullet"], bulletText="•"))
    if slide.get("quote"):
        q = slide["quote"]
        screen.append(Paragraph(f"“{clean(q['text'])}”", S["quote"]))
        screen.append(Paragraph(clean(q["cite"]), S["cite"]))
    if slide.get("clueFor"):
        screen.append(Paragraph("Pista de pregunta al invitado para: " + ", ".join(slide["clueFor"]), S["clue"]))

    inner = [head, Spacer(1, 2), title]
    if screen:
        inner += [Paragraph("EN LA DIAPOSITIVA", S["label"])] + screen
    inner += [Paragraph(f'QUÉ DECIR  ·  {clean(agenda_item["lead"])}', S["label"])]
    inner += [Paragraph(clean(line), S["say"], bulletText="›") for line in say]

    # Una fila por párrafo: así la caja se puede partir entre páginas cuando el guion es largo.
    table = Table([[x] for x in inner], colWidths=[17.2 * cm], splitByRow=True)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.6, MIST),
        ("LINEBEFORE", (0, 0), (0, -1), 3, BLUE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, 0), 8), ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
    ]))
    return table


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, letter[0], letter[1], stroke=0, fill=1)
    canvas.setFillColor(BLUE)
    canvas.rect(0, letter[1] - 0.45 * cm, letter[0], 0.45 * cm, stroke=0, fill=1)
    canvas.setFont("Body", 8.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(2 * cm, 1.1 * cm, "Misión TI · Guion de la teoría · Gestión de Recursos Tecnológicos")
    canvas.drawRightString(letter[0] - 2 * cm, 1.1 * cm, f"Página {doc.page}")
    canvas.restoreState()


def main(src, out):
    data = json.load(open(src, encoding="utf-8"))
    slides, guion, agenda, sources = data["slides"], data["guion"], data["agenda"], data["sources"]

    doc = BaseDocTemplate(out, pagesize=letter, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm,
                          bottomMargin=1.9 * cm, title="Misión TI · Guion de la teoría",
                          author="Equipo 3 · Misión TI", subject="Gestión de Recursos Tecnológicos")
    doc.addPageTemplates([PageTemplate(id="p", frames=[Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")],
                                       onPage=draw_page)])
    story = []

    # Portada
    story += [Spacer(1, 3 * cm), Paragraph("Guion de la teoría", S["title"]), Spacer(1, 6),
              Paragraph("Misión TI: Rescate empresarial", S["subtitle"]), Spacer(1, 14),
              Paragraph("Gestión de Recursos Tecnológicos · Ingeniería de Sistemas y Computación<br/>"
                        "Miércoles 4 de noviembre de 2026, de 1:00 a 4:00 p. m.", S["body"]), Spacer(1, 18),
              Paragraph("Equipo 3: José Castellanos (docente), Karen Moreno (estratega y cronometrista), "
                        "Dylber Cabrera (game master) y Camila Giraldo (anfitriona y evaluación).", S["body"]),
              Spacer(1, 22)]
    how = [
        "Está en el orden en que aparecen las diapositivas en el proyector.",
        "Cada diapositiva trae lo que se ve en pantalla y, debajo, <b>qué decir</b>.",
        "Las citas de KOSMOS TIC son textuales de su catálogo y de kosmostic.com; las de teoría, del MRAE v3.0 de MinTIC.",
        "No agreguen datos de la empresa que no estén en esas fuentes.",
        "Bloques de teoría de máximo 8 minutos: la clase es después de almorzar.",
        "Control remoto: avanzar/retroceder con las flechas o PageUp/PageDown. Un botón de pantalla en negro puede enviar «.» o «b».",
    ]
    story += [Paragraph("CÓMO USAR ESTE DOCUMENTO", S["label"])]
    story += [Paragraph(h, S["bullet"], bulletText="•") for h in how]
    story.append(PageBreak())

    # Cronograma
    story += [Paragraph("Cronograma de la clase", S["h1"]), Spacer(1, 6)]
    rows = [[Paragraph(h, S["cell_head"]) for h in ("Hora", "Actividad", "Min", "Fase", "Responsable", "Diapositivas")]]
    per_block = {}
    for i, s in enumerate(slides):
        per_block.setdefault(s["agenda"], []).append(i + 1)
    for i, a in enumerate(agenda):
        nums = per_block.get(i)
        diap = f"{nums[0]}–{nums[-1]}" if nums and len(nums) > 1 else (str(nums[0]) if nums else "—")
        rows.append([Paragraph(clean(c), S["cell"]) for c in (a["clock"], a["title"], str(a["minutes"]), a["phase"], a["lead"], diap)])
    t = Table(rows, colWidths=[2.3 * cm, 6.4 * cm, 1.1 * cm, 2.1 * cm, 2.9 * cm, 2.4 * cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, MIST), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story += [t, Spacer(1, 8),
              Paragraph("Las actividades sin diapositivas (Mercado, Semáforo, Galería, quiz) se manejan desde el panel de control.", S["small"])]
    story.append(PageBreak())

    # Cuerpo: un bloque por actividad del cronograma
    by_block = OrderedDict()
    for s in slides:
        by_block.setdefault(s["agenda"], []).append(s)
    first_block = True
    for idx, items in by_block.items():
        a = agenda[idx]
        header = [Paragraph(clean(a["title"]), S["h1"]),
                  Paragraph(f'{a["clock"]}  ·  {a["minutes"]} min  ·  Fase: {a["phase"]}  ·  Responsable: {clean(a["lead"])}', S["block_meta"])]
        if a.get("energy"):
            header.append(Paragraph(f'Energía: {clean(a["energy"])}', S["small"]))
            header.append(Spacer(1, 6))
        first = True
        for s in items:
            flow = slide_flow(s, guion[s["id"]], a)
            if first:
                story.append(KeepTogether(header + [flow]))
                first = False
            else:
                story.append(KeepTogether([flow]))
            story.append(Spacer(1, 8))
        story.append(Spacer(1, 6))
        first_block = False

    # Fuentes realmente usadas
    used = OrderedDict()
    for s in slides:
        for sid in s["sources"]:
            used[sid] = sources[sid]
    story.append(PageBreak())
    story += [Paragraph("Fuentes citadas", S["h1"]), Spacer(1, 6)]
    for src_ in used.values():
        line = clean(src_["full"]) + (f' {clean(src_["url"])}' if src_.get("url") else "")
        story.append(Paragraph(line, S["ref"], bulletText="•"))

    doc.build(story)
    print(f"OK: {out}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Uso: generar-guion.py <teoria.json> <salida.pdf>")
    main(sys.argv[1], sys.argv[2])
