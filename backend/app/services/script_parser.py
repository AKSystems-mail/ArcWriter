import pdfplumber
import re
import uuid

def parse_pdf_to_editor_format(file_path):
    """
    Parses a PDF script into a JSON format compatible with the ScriptEditor.
    Uses pdfplumber to extract text and layout information to categorize lines.
    Returns:
        tuple: (blocks: list, full_text: str)
    """
    blocks = []
    full_text = ""
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                # Accumulate raw text for the Logic Engine
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"

                # Extract words with position data
                words = page.extract_words(x_tolerance=2, y_tolerance=2)
                if not words:
                    continue

                # Group words into lines based on 'top' coordinate
                line_map = {}
                for word in words:
                    # Rounding to group slightly misaligned words into the same line
                    top = round(word['top'], 0)
                    if top not in line_map:
                        line_map[top] = []
                    line_map[top].append(word)

                sorted_tops = sorted(line_map.keys())
                
                for top in sorted_tops:
                    line_words = sorted(line_map[top], key=lambda w: w['x0'])
                    
                    # Clean and join text
                    text = " ".join([w['text'] for w in line_words]).strip()
                    if not text:
                        continue
                    
                    # 1. Ignore Page Numbers
                    # Heuristic: Text is numeric and located at the very top or bottom of the page
                    is_numeric = re.match(r'^\d+\.?$', text)
                    if is_numeric and (top < 50 or top > 750):
                        continue

                    # 2. Get the left-most position of the line
                    x0 = line_words[0]['x0']
                    
                    # 3. Apply Heuristics based on x0 (left position)
                    block_type = 'Action' # Default
                    
                    if x0 < 100:
                        # Action or Slugline (Scene Heading)
                        if text.isupper() and is_scene_heading(text):
                            block_type = 'Scene Heading'
                        else:
                            block_type = 'Action'
                    
                    elif 150 < x0 < 250:
                        # Dialogue or Parenthetical
                        if text.startswith("(") and text.endswith(")"):
                            block_type = 'Parenthetical'
                        else:
                            block_type = 'Dialogue'
                    
                    elif x0 >= 250:
                        # Character Name or Transition
                        if text.isupper():
                            block_type = 'Character'
                        else:
                            # Fallback for centered text that isn't a character
                            block_type = 'Action'

                    # Clean extra whitespace within the line
                    text = re.sub(r'\s+', ' ', text).strip()

                    # Add to blocks
                    blocks.append({
                        "id": str(uuid.uuid4()),
                        "type": block_type,
                        "text": text
                    })

    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return [], ""

    return blocks, full_text

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
    
    # Also catch lines like "INT HOUSE - DAY" (without dot)
    if (text.startswith("INT ") or text.startswith("EXT ")) and " - " in text:
        return True
        
    return False