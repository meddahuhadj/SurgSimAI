# -*- coding: utf-8 -*-
"""
generate_pdf_guide.py — Générateur de Guide Utilisateur PDF Professionnel.
========================================================================
Utilise ReportLab pour convertir les guides Markdown en documents PDF haute qualité
destinés à la documentation médicale hospitalière.
"""

import os
import re
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 800, "GeneralSurgPlan3D & GenyPedPlan3D — Guide Utilisateur & Manuel Opérationnel")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 792, 541, 792)

        # Footer
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 541, 45)

        footer_text = "Dispositif Médical de Planification Chirurgicale 3D — MDR UE 2017/745 Classe IIb"
        self.drawString(54, 30, footer_text)
        page_str = f"Page {self._pageNumber} / {page_count}"
        self.drawRightString(541, 30, page_str)
        self.restoreState()


def convert_markdown_to_pdf(md_path: str, pdf_path: str, document_title: str):
    md_content = Path(md_path).read_text(encoding="utf-8")

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        alignment=TA_CENTER,
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#2563eb"),
        alignment=TA_CENTER,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0f766e"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6,
        alignment=TA_LEFT
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=15,
        bulletIndent=5,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=8
    )

    story = []

    # Header decoration
    story.append(Paragraph(f"🏥 {document_title}", title_style))
    story.append(Paragraph("DOCUMENTATION MÉDICALE & SÉCURITÉ CLINIQUE (MDR UE 2017/745)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2563eb"), spaceAfter=15))

    lines = md_content.splitlines()
    in_code_block = False
    code_lines = []

    for line in lines:
        raw_line = line.rstrip()

        # Handle Code blocks
        if raw_line.startswith("```"):
            if in_code_block:
                code_text = "<br/>".join([c.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") for c in code_lines])
                story.append(Paragraph(code_text, code_style))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(raw_line)
            continue

        if not raw_line.strip():
            story.append(Spacer(1, 4))
            continue

        # Format bold and inline code
        formatted = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', raw_line)
        formatted = re.sub(r'`(.*?)`', r'<font face="Courier" color="#2563eb">\1</font>', formatted)

        if formatted.startswith("# "):
            story.append(Paragraph(formatted[2:], title_style))
        elif formatted.startswith("## "):
            story.append(Paragraph(formatted[3:], h1_style))
        elif formatted.startswith("### "):
            story.append(Paragraph(formatted[4:], h2_style))
        elif formatted.startswith("- ") or formatted.startswith("* "):
            story.append(Paragraph(f"• {formatted[2:]}", bullet_style))
        elif re.match(r'^\d+\.\s', formatted):
            item_text = re.sub(r'^\d+\.\s', '', formatted)
            story.append(Paragraph(f"• {item_text}", bullet_style))
        else:
            story.append(Paragraph(formatted, body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF genere avec succes : {pdf_path}")


if __name__ == "__main__":
    repo1_md = r"d:\Travail\GeneralSurgPlan3D  MIMO\pour  Claude 2\GeneralSurgPlan3D_MIMO_enrichi  8 -anesthesie+reanimation\USER_GUIDE.md"
    repo1_pdf = r"d:\Travail\GeneralSurgPlan3D  MIMO\pour  Claude 2\GeneralSurgPlan3D_MIMO_enrichi  8 -anesthesie+reanimation\GeneralSurgPlan3D_USER_GUIDE.pdf"

    repo2_md = r"d:\Travail\GeneralSurgPlan3D  MIMO\pour  Claude 2\GeneralSurgPlan3D_Gynecologie_Pediatrie\app\GUIDE_UTILISATEUR.md"
    repo2_pdf = r"d:\Travail\GeneralSurgPlan3D  MIMO\pour  Claude 2\GeneralSurgPlan3D_Gynecologie_Pediatrie\app\GenyPedPlan3D_GUIDE_UTILISATEUR.pdf"

    convert_markdown_to_pdf(repo1_md, repo1_pdf, "GeneralSurgPlan3D NextGen — Guide Utilisateur")
    convert_markdown_to_pdf(repo2_md, repo2_pdf, "GenyPedPlan3D — Manuel Opérationnel")
