import pdfplumber
import re
import uuid
import gc

def parse_pdf_to_editor_format(file_path):
    """
    Parses a PDF script into a JSON format compatible with the ScriptEditor.
    Uses pdfplumber with aggressive memory management.
    Returns (blocks, full_text, page_count).
    """
    blocks = []
    full_text = ""
    page_count = 0
    
    try:
        with pdfplumber.open(file_path) as pdf:
            page_count = len(pdf.pages)
            for i, page in enumerate(pdf.pages):
                # 1. Quick text extraction for LLM
                p_text = page.extract_text()
                if p_text:
                    full_text += p_text + "\n"

                # 2. Layout analysis for Editor Blocks
                # We limit word extraction to help memory
                words = page.extract_words(x_tolerance=2, y_tolerance=2, use_text_flow=True)
                if not words:
                    page.flush_cache()
                    continue

                line_map = {}
                for word in words:
                    top = round(word['top'], 0)
                    if top not in line_map:
                        line_map[top] = []
                    line_map[top].append(word)

                for top in sorted(line_map.keys()):
                    line_words = sorted(line_map[top], key=lambda w: w['x0'])
                    text = " ".join([w['text'] for w in line_words]).strip()
                    if not text: continue
                    
                    # Ignore Page Numbers
                    if re.match(r'^\d+\.?$', text) and (top < 70 or top > 750): continue

                    x0 = line_words[0]['x0']
                    block_type = 'Action'
                    
                    if x0 < 140:
                        block_type = 'Scene Heading' if is_scene_heading(text) else 'Action'
                    elif 140 <= x0 < 240:
                        block_type = 'Parenthetical' if text.startswith("(") else 'Dialogue'
                    elif x0 >= 240:
                        block_type = 'Character' if text.isupper() else 'Action'

                    blocks.append({
                        "id": str(uuid.uuid4()),
                        "type": block_type,
                        "text": re.sub(r'\s+', ' ', text).strip()
                    })
                
                # AGGRESSIVE CLEANUP
                page.flush_cache()
                if i % 10 == 0:
                    gc.collect() # Force garbage collection every 10 pages

    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return [], "", 0

    return blocks, full_text, page_count

def is_scene_heading(text):
    """Checks if text looks like a scene heading."""
    text = text.upper().strip()
    patterns = [
        r'^INT\.', r'^EXT\.', r'^INT\./EXT\.', r'^EXT\./INT\.', r'^I/E', r'^E/I',
        r'^ESTABLISHING', r'^LATER', r'^SAME'
    ]
    for pat in patterns:
        if re.match(pat, text):
            return True
    if (text.startswith("INT ") or text.startswith("EXT ")) and " - " in text:
        return True
    return False
