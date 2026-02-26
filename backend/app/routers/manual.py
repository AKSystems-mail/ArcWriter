from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from reportlab.lib import colors
import io

router = APIRouter(
    prefix="/api/manual",
    tags=["manual"]
)

@router.get("/download")
async def download_manual():
    """
    Generates and downloads 'The Screenwriter's Guide to ArcWriter' in screenplay format.
    """
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch, bottomMargin=1*inch, leftMargin=1.5*inch, rightMargin=1*inch)
        
        styles = getSampleStyleSheet()
        # Screenplay Styles
        styles.add(ParagraphStyle(name='ScriptSlug', fontSize=12, leading=14, fontName='Courier-Bold', spaceBefore=12, spaceAfter=12))
        styles.add(ParagraphStyle(name='ScriptAction', fontSize=12, leading=14, fontName='Courier', spaceAfter=12))
        styles.add(ParagraphStyle(name='ScriptChar', fontSize=12, leading=14, fontName='Courier', leftIndent=2.0*inch, spaceBefore=12))
        styles.add(ParagraphStyle(name='ScriptDialogue', fontSize=12, leading=14, fontName='Courier', leftIndent=1.0*inch, rightIndent=1.0*inch, spaceAfter=6))
        styles.add(ParagraphStyle(name='ScriptParenthetical', fontSize=12, leading=14, fontName='Courier', leftIndent=1.5*inch, rightIndent=1.5*inch))
        styles.add(ParagraphStyle(name='ScriptTitle', fontSize=24, leading=28, alignment=TA_CENTER, fontName='Courier-Bold', spaceBefore=200))
        styles.add(ParagraphStyle(name='ScriptSubTitle', fontSize=14, leading=18, alignment=TA_CENTER, fontName='Courier', spaceAfter=24))

        story = []

        # --- COVER PAGE ---
        story.append(Paragraph("THE SCREENWRITER'S GUIDE TO ARCWRITER", styles['ScriptTitle']))
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph("A Narrative Instrument for Professional Architects", styles['ScriptSubTitle']))
        story.append(PageBreak())

        # --- ACT 0: THE PUBLIC LABORATORY ---
        story.append(Paragraph("ACT 0: THE PUBLIC LABORATORY", styles['ScriptSlug']))
        story.append(Paragraph("EXT. BROWSER WINDOW - DAY", styles['ScriptSlug']))
        story.append(Paragraph("Before diving into a full Universe, the Writer discovers the Public Laboratory. A place to 'Distill Your Narrative Core.'", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER", styles['ScriptChar']))
        story.append(Paragraph("Paste your rough notes or upload a PDF script. Our Logic Engine will extract a 15-point structural beat sheet for you, right here.", styles['ScriptDialogue']))

        story.append(Paragraph("The Writer pastes a messy paragraph about a guy named Dan peeing in a pool and realizing his high school crush is there.", styles['ScriptAction']))

        story.append(Paragraph("THE WRITER", styles['ScriptChar']))
        story.append(Paragraph("Can you make sense of this?", styles['ScriptDialogue']))

        story.append(Paragraph("The Writer clicks 'Build Beat Sheet'. The Logic Engine activates, spinning up with a pulse.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER", styles['ScriptChar']))
        story.append(Paragraph("Structure Identified. I've broken down your rough notes into Opening Image, Theme Stated, Catalyst, and more.", styles['ScriptDialogue']))

        story.append(Paragraph("A clean, numbered beat sheet appears behind a blurred gate.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER (CONT'D)", styles['ScriptChar']))
        story.append(Paragraph("Send the full beat sheet. Enter your email to receive the PDF.", styles['ScriptDialogue']))

        story.append(Paragraph("The Writer submits their email. Package sent. They are now ready to Enter The Writer's Room.", styles['ScriptAction']))
        story.append(PageBreak())

        # --- ACT 1: THE GENESIS ---
        story.append(Paragraph("ACT I: THE ONBOARDING WIZARD", styles['ScriptSlug']))
        story.append(Paragraph("INT. ARCWRITER STUDIO - DAY", styles['ScriptSlug']))
        story.append(Paragraph("A glowing portal stands ready. The future of storytelling is blank, awaiting its first line of code.", styles['ScriptAction']))
        
        story.append(Paragraph("ARCWRITER", styles['ScriptChar']))
        story.append(Paragraph("Welcome, Writer. You aren't here to just type. You're here to engineer a masterpiece. Let's start at the beginning.", styles['ScriptDialogue']))

        story.append(Paragraph("EXT. THE ONBOARDING WIZARD - DAY", styles['ScriptSlug']))
        story.append(Paragraph("The WRITER has a choice. Upload a PDF of 120 pages, or start from scratch. The system begins to hum, parsing page by page, extracting the DNA of the story.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER", styles['ScriptChar']))
        story.append(Paragraph("(calmly)", styles['ScriptParenthetical']))
        story.append(Paragraph("Step one: Name your Universe. Are we building a standalone masterpiece or a sprawling franchise? You can link this script to existing Universes for cross-script continuity.", styles['ScriptDialogue']))

        story.append(Paragraph("The Writer makes a selection among the Dual-Mode Onboarding paths.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER (CONT'D)", styles['ScriptChar']))
        story.append(Paragraph("Choose THE DISCOVERY mode to brainstorm freely and start with tone, or THE BLUEPRINT mode to rigorously outline your plot points.", styles['ScriptDialogue']))

        story.append(Paragraph("The system finishes its analysis. The screen flashes 'analyzing narrative core'. The Story DNA summary appears.", styles['ScriptAction']))
        story.append(PageBreak())

        # --- ACT 2: THE FOUNDATION ---
        story.append(Paragraph("ACT II: THE ARCHITECTURE", styles['ScriptSlug']))
        story.append(Paragraph("INT. THE DASHBOARD - DAY", styles['ScriptSlug']))
        story.append(Paragraph("The Writer shifts into the ARCHITECT page. Here, the structure is God.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER", styles['ScriptChar']))
        story.append(Paragraph("Let's look at your BEAT SHEET. We can map your story to the Hero's Journey, or the Story Circle. Notice the Pitch Readiness circular meter responding to your input.", styles['ScriptDialogue']))

        story.append(Paragraph("The Writer opens the SOURCE MATERIAL DRAWER. No cluttered metadata. Just pure story beats and a spaced cast list.", styles['ScriptAction']))
        
        story.append(Paragraph("Behind the scenes, the PROJECT BIBLE acts as a RAG-powered continuity engine across the entire Universe. The Writer can't resurrect a deceased character without the system noticing.", styles['ScriptAction']))
        story.append(PageBreak())

        # --- ACT 3: THE CONFRONTATION ---
        story.append(Paragraph("ACT III: THE SCRIPT EDITOR", styles['ScriptSlug']))
        story.append(Paragraph("INT. THE SCRIPT EDITOR - DAY", styles['ScriptSlug']))
        story.append(Paragraph("The Writer types. The page is perfectly formatted to industry standards with a 1.5 inch left margin. Invisible block transitions give it a unified feel.", styles['ScriptAction']))

        story.append(Paragraph("THE WRITER", styles['ScriptChar']))
        story.append(Paragraph("I can't remember the name of that location from Act I...", styles['ScriptDialogue']))

        story.append(Paragraph("ARCWRITER", styles['ScriptChar']))
        story.append(Paragraph("Use the Smart Autocomplete. I remember every character and every location you've ever typed. Just start typing.", styles['ScriptDialogue']))

        story.append(Paragraph("The Writer gets stuck on a scene.", styles['ScriptAction']))

        story.append(Paragraph("THE WRITER", styles['ScriptChar']))
        story.append(Paragraph("What should they say?", styles['ScriptDialogue']))

        story.append(Paragraph("ARCWRITER", styles['ScriptChar']))
        story.append(Paragraph("Click the Magic Wand Tool. Do you want an 'Auto-Write Scene' or just 'Suggest Dialogue'? I'll read the last 2000 characters for tone and continuity matching.", styles['ScriptDialogue']))

        story.append(Paragraph("The Writer reviews the generated scene. The CRITIQUE SIDEBAR comes alive. The SCENE SEISMOGRAPH visualizes the push-and-pull tension of the dialogue line by line.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER (CONT'D)", styles['ScriptChar']))
        story.append(Paragraph("Run the 'First 10 Pages Gatekeeper Audit'. I'll evaluate the Theme, Motivation, Tone, and Catalyst. I'll tell you if a Producer would READ or PASS.", styles['ScriptDialogue']))

        story.append(Paragraph("A 'READ' verdict flashes. The Writer exhales. They delete an old, clunky scene. It doesn't disappear; it falls to THE CUTTING ROOM FLOOR.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER (CONT'D)", styles['ScriptChar']))
        story.append(Paragraph("Your darlings are safe in the 'Redemption' archive. If you want to permanently delete them, you'll need to confirm the Point of No Return.", styles['ScriptDialogue']))
        story.append(PageBreak())

        # --- ACT 4: THE PRODUCTION ---
        story.append(Paragraph("ACT IV: THE VISUALS STUDIO", styles['ScriptSlug']))
        story.append(Paragraph("INT. THE VISUALS STUDIO - NIGHT", styles['ScriptSlug']))
        story.append(Paragraph("The script is locked. It's time to build the pitch. The Writer enters the character gallery.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER", styles['ScriptChar']))
        story.append(Paragraph("Let's define your cast. Generate 4 variants for each. When you find the perfect one, LOCK the character anchor.", styles['ScriptDialogue']))

        story.append(Paragraph("The Writer clicks. A visual 'LOCKING ANCHOR...' message flashes. The character is cemented into the Universe.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER (CONT'D)", styles['ScriptChar']))
        story.append(Paragraph("Now for the key art. The AI will use your Locked Character Anchors as visual references to render an Official Poster in 2:3 vertical format.", styles['ScriptDialogue']))
        
        story.append(Paragraph("THE WRITER", styles['ScriptChar']))
        story.append(Paragraph("What about a trailer?", styles['ScriptDialogue']))
        
        story.append(Paragraph("ARCWRITER", styles['ScriptChar']))
        story.append(Paragraph("Our asynchronous motion pipeline powered by Veo 2.0 will generate 5-second 16:9 cinematic teasers. No timeouts. Just action.", styles['ScriptDialogue']))

        story.append(Paragraph("The screen fills with high-fidelity imagery and moving video.", styles['ScriptAction']))
        story.append(PageBreak())

        # --- ACT 5: THE RESOLUTION ---
        story.append(Paragraph("ACT V: THE DELIVERABLE", styles['ScriptSlug']))
        story.append(Paragraph("INT. THE PITCH MEETING - DAY", styles['ScriptSlug']))
        story.append(Paragraph("The Writer stands before a Producer. They don't have a stack of paper. They have an iPad.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER", styles['ScriptChar']))
        story.append(Paragraph("(V.O.)", styles['ScriptParenthetical']))
        story.append(Paragraph("Your master Export Pitch Package button triggered when you hit 100 percent completion. It glowed Arc-Orange.", styles['ScriptDialogue']))

        story.append(Paragraph("The Writer opens the compiled PDF Pitch Package. It contains the Poster, Story Summary, Cast Dossiers, and the Full Script.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER (CONT'D)", styles['ScriptChar']))
        story.append(Paragraph("And those QR codes on the pages? They link directly to your cinematic teasers.", styles['ScriptDialogue']))
        
        story.append(Paragraph("The Writer instead shifts to their phone, bringing up the MOBILE PITCH DECK. A responsive, read-only gallery meant for on-the-spot presentations. Swipe. Swipe. Sold.", styles['ScriptAction']))

        story.append(Paragraph("ARCWRITER (CONT'D)", styles['ScriptChar']))
        story.append(Paragraph("Mission accomplished. Go get them.", styles['ScriptDialogue']))

        story.append(Paragraph("FADE TO BLACK.", styles['ScriptSlug']))
        story.append(Paragraph("THE END", styles['ScriptTitle']))

        doc.build(story)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=\"ArcWriter_Screenwriters_Guide.pdf\""}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
