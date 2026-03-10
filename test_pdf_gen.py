from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
import io
import os

def generate_test_pdf():
    file_path = "backend/Screenwriter_Guide.md"
    with open(file_path, "r") as f:
        markdown_content = f.read()

    doc = SimpleDocTemplate("test_manual_final.pdf", pagesize=letter, topMargin=1*inch, bottomMargin=1*inch, leftMargin=1.5*inch, rightMargin=1*inch)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='ScriptSlug', fontSize=12, leading=14, fontName='Courier-Bold', spaceBefore=12, spaceAfter=12, textTransform='uppercase'))
    styles.add(ParagraphStyle(name='ScriptAction', fontSize=12, leading=14, fontName='Courier', spaceAfter=12))
    styles.add(ParagraphStyle(name='ScriptChar', fontSize=12, leading=14, fontName='Courier', leftIndent=2.0*inch, spaceBefore=12, spaceAfter=0, textTransform='uppercase'))
    styles.add(ParagraphStyle(name='ScriptDialogue', fontSize=12, leading=14, fontName='Courier', leftIndent=1.0*inch, rightIndent=1.5*inch, spaceAfter=6))
    styles.add(ParagraphStyle(name='ScriptParenthetical', fontSize=12, leading=14, fontName='Courier', leftIndent=1.5*inch, rightIndent=2.0*inch, spaceAfter=0))
    styles.add(ParagraphStyle(name='ScriptTitle', fontSize=24, leading=28, alignment=TA_CENTER, fontName='Courier-Bold', spaceBefore=150))
    styles.add(ParagraphStyle(name='ScriptCenterInfo', fontSize=12, leading=14, alignment=TA_CENTER, fontName='Courier', spaceAfter=12))

    story_elements = []
    lines = markdown_content.split('\n')
    first_content_line = 0
    for i, line in enumerate(lines):
        if 'FADE IN:' in line:
            first_content_line = i
            break
        if line.strip():
            if i == 0: story_elements.append(Paragraph(line.strip(), styles['ScriptTitle']))
            else: story_elements.append(Paragraph(line.strip(), styles['ScriptCenterInfo']))
    
    if story_elements:
        story_elements.append(PageBreak())
        lines = lines[first_content_line:]

    for line in lines:
        stripped = line.strip()
        if not stripped: continue
        indent = len(line) - len(line.lstrip())
        if indent >= 15:
            if stripped in ['FADE IN:', 'FADE OUT.', 'CUT TO:', 'BACK TO:', 'FADE TO BLACK.', 'THE END', 'CHOOSE YOUR PATH:', 'IF ARCHITECT MODE:', 'IF EXPLORER MODE:', 'BACK TO STORY:']:
                story_elements.append(Paragraph(stripped, styles['ScriptSlug']))
            else: story_elements.append(Paragraph(stripped, styles['ScriptChar']))
        elif indent >= 8 and stripped.startswith('(') and stripped.endswith(')'):
            story_elements.append(Paragraph(stripped, styles['ScriptParenthetical']))
        elif indent >= 8: story_elements.append(Paragraph(stripped, styles['ScriptDialogue']))
        elif stripped.upper().startswith('INT.') or stripped.upper().startswith('EXT.'):
            story_elements.append(Paragraph(stripped.upper(), styles['ScriptSlug']))
        else:
            story_elements.append(Paragraph(stripped, styles['ScriptAction']))

    doc.build(story_elements)
    print("Test PDF generated: test_manual_final.pdf")

if __name__ == "__main__":
    generate_test_pdf()
