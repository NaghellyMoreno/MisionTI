#!/usr/bin/env python3
"""Genera el quiz final impreso, para quien no tenga internet durante la clase.

Salidas:
  docs/quiz-impreso.pdf        Formas 1 y 2 para entregar a los estudiantes (sin respuestas).
  docs/quiz-impreso-clave.pdf  Clave de respuestas y cómo pasar la nota. Solo para el equipo docente.

Las dos formas tienen las mismas 12 preguntas de la app, con preguntas y opciones en distinto
orden (fijo y reproducible), para que la respuesta correcta no quede siempre en la misma letra
y dos estudiantes vecinos no tengan el mismo examen.

    node scripts/exportar-quiz.mjs /tmp/quiz.json
    .venv-pdf/bin/python scripts/generar-quiz-impreso.py /tmp/quiz.json docs
"""
import json
import random
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
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

# Impresión en blanco y negro: tinta oscura y grises; el azul solo en detalles.
BLUE = colors.HexColor("#3368A0")
INK = colors.HexColor("#1B2733")
MUTED = colors.HexColor("#5B6770")
LINE = colors.HexColor("#9AA5AE")
SOFT = colors.HexColor("#EEF2F4")
CORAL = colors.HexColor("#B5523B")

MARGIN = 1.7 * cm
WIDTH = A4[0] - 2 * MARGIN
LETTERS = "abcd"
FORMS = {1: "forma-1", 2: "forma-2"}  # semilla de cada forma


def style(name, **kw):
    base = dict(fontName="Body", fontSize=10.5, leading=14, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "kicker": style("kicker", fontName="Body-Bold", fontSize=8.5, textColor=BLUE),
    "title": style("title", fontName="Body-Bold", fontSize=20, leading=24),
    "form": style("form", fontName="Body-Bold", fontSize=20, leading=24, alignment=2),
    "sub": style("sub", fontSize=9, leading=12, textColor=MUTED),
    "small": style("small", fontSize=8.5, leading=11.5, textColor=MUTED),
    "q": style("q", fontName="Body-Bold", fontSize=10.5, leading=14),
    "num": style("num", fontName="Body-Bold", fontSize=10.5, leading=14, textColor=BLUE),
    "opt": style("opt", fontSize=10, leading=13.5),
    "cell": style("cell", fontSize=9.5, leading=12.5),
    "cellc": style("cellc", fontSize=11, leading=14, alignment=1, fontName="Body-Bold"),
    "head": style("head", fontSize=8.5, leading=11, fontName="Body-Bold", textColor=BLUE),
    "h1": style("h1", fontName="Body-Bold", fontSize=15, leading=20, spaceBefore=6, spaceAfter=6),
    "h2": style("h2", fontName="Body-Bold", fontSize=11.5, leading=15, spaceBefore=10, spaceAfter=4, textColor=BLUE),
    "body": style("body", spaceAfter=4),
}
P = lambda t, s="body": Paragraph(t, S[s])


def build_form(quiz, n):
    """Orden de preguntas y de opciones para la forma n. Devuelve [(pregunta, opciones, letra correcta)]."""
    rnd = random.Random(FORMS[n])
    questions = list(quiz)
    if n != 1:
        rnd.shuffle(questions)
    out = []
    for q in questions:
        idx = list(range(4))
        rnd.shuffle(idx)
        options = [q["options"][i] for i in idx]
        correct = LETTERS[idx.index(q["answer"])]
        out.append((q, options, correct))
    return out


def header(n, minutes, total):
    left = [P("MISIÓN TI · GESTIÓN DE RECURSOS TECNOLÓGICOS", "kicker"), P("Quiz final individual", "title"),
            P(f"Miércoles 4 de noviembre de 2026 · {total} preguntas · {minutes} minutos", "sub")]
    top = Table([[left, P(f"Forma {n}", "form")]], colWidths=[WIDTH - 4 * cm, 4 * cm])
    top.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "BOTTOM"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    fields = Table([[P("<b>Nombre:</b>", "cell"), "", P("<b>Grupo:</b>", "cell"), ""]],
                   colWidths=[1.8 * cm, WIDTH - 6.3 * cm, 1.6 * cm, 2.9 * cm], rowHeights=[0.9 * cm])
    fields.setStyle(TableStyle([
        ("LINEBELOW", (1, 0), (1, 0), 0.8, INK), ("LINEBELOW", (3, 0), (3, 0), 0.8, INK),
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    rules = Table([[P("<b>Instrucciones.</b> Lean cada pregunta y encierren en un círculo la letra de <b>una sola</b> respuesta. "
                      "Luego copien sus respuestas en la tabla del final. Si cambian una respuesta, táchenla y escriban la nueva "
                      "al lado. Es individual: sin celular, sin apuntes y sin hablar con los compañeros.", "cell")]], colWidths=[WIDTH])
    rules.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SOFT), ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                               ("LEFTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return [top, Spacer(1, 6), fields, Spacer(1, 10), rules, Spacer(1, 12)]


def pdf_text(t):
    """La fuente no tiene la flecha →: se cambia por ›."""
    return escape(t.replace("→", "›"))


def question_block(i, q, options):
    opts = [[P(f"<b>{LETTERS[k]})</b>", "opt"), P(pdf_text(o), "opt")] for k, o in enumerate(options)]
    ot = Table(opts, colWidths=[0.8 * cm, WIDTH - 1.6 * cm])
    ot.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                            ("TOPPADDING", (0, 0), (-1, -1), 1.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5)]))
    t = Table([[P(f"{i}.", "num"), P(pdf_text(q["text"]), "q")], ["", ot]], colWidths=[0.8 * cm, WIDTH - 0.8 * cm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 1), (-1, 1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return KeepTogether([t, Spacer(1, 8)])


def answer_sheet(total):
    nums = [P(f"<b>{i}</b>", "cellc") for i in range(1, total + 1)]
    blanks = ["" for _ in range(total)]
    t = Table([nums, blanks], colWidths=[WIDTH / total] * total, rowHeights=[0.7 * cm, 1.0 * cm])
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.8, INK), ("BACKGROUND", (0, 0), (-1, 0), SOFT),
                           ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    score = Table([[P("<b>Aciertos:</b> ______ de 12", "cell"), P("<b>Nota del quiz (5 × aciertos ÷ 12):</b> ______", "cell"),
                    P("<i>Espacio para el equipo docente</i>", "small")]], colWidths=[4.2 * cm, 7.6 * cm, WIDTH - 11.8 * cm])
    score.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 8)]))
    return KeepTogether([P("Mis respuestas (escriban la letra)", "h2"), t, score])


def footer_factory(label):
    def page(canvas, doc):
        canvas.saveState()
        canvas.setFont("Body", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN, 1.1 * cm, label)
        canvas.drawRightString(A4[0] - MARGIN, 1.1 * cm, f"Página {doc.page}")
        canvas.restoreState()
    return page


def make_doc(path, title, label):
    doc = BaseDocTemplate(path, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=1.4 * cm, bottomMargin=1.8 * cm,
                          title=title, author="Equipo 3")
    frame = Frame(MARGIN, 1.8 * cm, WIDTH, A4[1] - 3.2 * cm, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=footer_factory(label))])
    return doc


def students_pdf(quiz, minutes, out):
    story = []
    for n in FORMS:
        form = build_form(quiz, n)
        story += header(n, minutes, len(form))
        for i, (q, options, _) in enumerate(form, 1):
            story.append(question_block(i, q, options))
        story.append(answer_sheet(len(form)))
        if n != list(FORMS)[-1]:
            story.append(PageBreak())
    make_doc(out, "Quiz final impreso · Misión TI", "Misión TI · Quiz final individual · versión impresa").build(story)


def key_pdf(quiz, minutes, out):
    story = [
        P("MISIÓN TI · SOLO PARA EL EQUIPO DOCENTE", "kicker"),
        P("Clave del quiz impreso", "title"),
        P("No imprimir junto con los cuestionarios ni dejar a la vista de los estudiantes.", "sub"),
        Spacer(1, 10),
        P("Cuándo usarlo", "h2"),
        P(f"Solo para quien no pueda conectarse durante el quiz final (2:58 p. m.). Entréguenle la hoja al mismo tiempo que se abre el "
          f"quiz en la app y recójanla a los {minutes} minutos. Si hay dos o más estudiantes sin conexión cerca, alternen la forma 1 y la forma 2."),
    ]
    for n in FORMS:
        form = build_form(quiz, n)
        story.append(P(f"Forma {n} · respuestas", "h2"))
        nums = [P(f"<b>{i}</b>", "cellc") for i in range(1, len(form) + 1)]
        letters = [P(c.upper(), "cellc") for _, _, c in form]
        t = Table([nums, letters], colWidths=[WIDTH / len(form)] * len(form), rowHeights=[0.65 * cm, 0.8 * cm])
        t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.8, INK), ("BACKGROUND", (0, 0), (-1, 0), SOFT),
                               ("TEXTCOLOR", (0, 1), (-1, 1), CORAL), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        story += [t, Spacer(1, 4)]
    story += [
        P("Cómo pasar la nota", "h2"),
        P("La app no recibe respuestas en papel. Para quien no se conectó, el quiz aparece en <b>Notas</b> con 0 aciertos y su "
          "nota final queda calculada con ese 0. Corríjanla a mano en la hoja descargada (<b>Descargar para Excel</b>):"),
        Table([[P("1.", "num"), P("<b>Nota del quiz</b> = 5 × aciertos ÷ 12.", "cell")],
               [P("2.", "num"), P("<b>Nota final</b> = 0,25 × sorpresa + 0,30 × quiz + 0,30 × lienzo + 0,15 × presupuesto, con los "
                                  "pesos por defecto. Si cambiaron los pesos en Notas, usen esos.", "cell")],
               [P("3.", "num"), P("Si a la persona no le llegó ninguna pregunta sorpresa, repartan ese 25 % entre los otros tres "
                                  "componentes en proporción a sus pesos, como hace la app: quiz 40 %, lienzo 40 % y presupuesto 20 %.", "cell")]],
              colWidths=[0.7 * cm, WIDTH - 0.7 * cm],
              style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0)])),
        P("Detalle por pregunta", "h2"),
    ]
    f1, f2 = build_form(quiz, 1), build_form(quiz, 2)
    pos2 = {q["id"]: (i, c) for i, (q, _, c) in enumerate(f2, 1)}
    rows = [[P(h, "head") for h in ["F1", "F2", "Pregunta", "Respuesta correcta"]]]
    for i, (q, _, c) in enumerate(f1, 1):
        j, c2 = pos2[q["id"]]
        rows.append([P(f"{i} · {c.upper()}", "cell"), P(f"{j} · {c2.upper()}", "cell"), P(pdf_text(q["text"]), "cell"),
                     P(f"{pdf_text(q['options'][q['answer']])}<br/><font color='#5B6770' size='8'>{pdf_text(q['explanation'])}</font>", "cell")])
    t = Table(rows, colWidths=[1.3 * cm, 1.3 * cm, 7.6 * cm, WIDTH - 10.2 * cm], repeatRows=1)
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, LINE), ("BACKGROUND", (0, 0), (-1, 0), SOFT),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    story.append(t)
    make_doc(out, "Clave del quiz impreso · Misión TI", "Misión TI · Clave del quiz impreso · solo equipo docente").build(story)


def main(data_path, out_dir):
    data = json.load(open(data_path, encoding="utf-8"))
    quiz, minutes = data["quiz"], data["minutes"]
    students_pdf(quiz, minutes, f"{out_dir}/quiz-impreso.pdf")
    key_pdf(quiz, minutes, f"{out_dir}/quiz-impreso-clave.pdf")
    for n in FORMS:
        print(f"Forma {n}:", " ".join(f"{i}{c}" for i, (_, _, c) in enumerate(build_form(quiz, n), 1)))
    print(f"OK: {out_dir}/quiz-impreso.pdf y {out_dir}/quiz-impreso-clave.pdf")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: generar-quiz-impreso.py <quiz.json> <carpeta de salida>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
