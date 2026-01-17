import pdfplumber
import re
import uuid

def parse_pdf_to_editor_format(file_path):
    """
    Parses a PDF script into a JSON format compatible with the ScriptEditor.
    Uses pdfplumber to extract text and layout information to categorize lines.
    """
    blocks = []
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                # Extract words with position data
                words = page.extract_words(x_tolerance=2, y_tolerance=2)
                if not words:
                    continue

                # Group words into lines based on 'top' coordinate
                lines = {}
                for word in words:
                    top = round(word['top'], 1)  # Rounding to group slightly misaligned words
                    if top not in lines:
                        lines[top] = []
                    lines[top].append(word)

                sorted_tops = sorted(lines.keys())
                
                for top in sorted_tops:
                    line_words = lines[top]
                    # Sort words left-to-right
                    line_words.sort(key=lambda w: w['x0'])
                    
                    text = " ".join([w['text'] for w in line_words])
                    text = text.strip()
                    
                    if not text:
                        continue
                    
                    # Basic Layout Analysis
                    # Standard US Letter Width is ~612pts. 
                    # Margins: Left is usually ~1 inch (72pts).
                    # Action: ~72pts
                    # Dialogue: ~180-200pts
                    # Character: ~250-280pts
                    # Parenthetical: ~220pts
                    
                    x0 = line_words[0]['x0']
                    
                    # Heuristic Classification
                    block_type = 'Action' # Default
                    
                    # 1. Scene Heading: All Caps, starts with INT/EXT, usually Left Aligned (x0 < 100)
                    if x0 < 120 and is_scene_heading(text):
                        block_type = 'Scene Heading'
                    
                    # 2. Transition: All Caps, Right Aligned (x0 > 400), ends with TO:
                    elif x0 > 350 and text.isupper() and text.endswith("TO:"):
                         block_type = 'Action' # Editor doesn't have Transition yet, map to Action
                    
                    # 3. Character: Indented (x0 > 200), All Caps
                    # Standard Character Indent is ~3.5 inches -> 252 pts
                    elif 180 < x0 < 320 and text.isupper():
                        block_type = 'Character'
                        
                    # 4. Parenthetical: Indented (x0 > 150), wrapped in ()
                    elif text.startswith("(") and text.endswith(")"):
                        block_type = 'Parenthetical'
                        
                    # 5. Dialogue: Indented (x0 > 100 but < 200 usually, depending on width)
                    # Dialogue block usually 1 inch from left margin -> 144 pts? 
                    # Actually standard is ~2.5 inches.
                    elif 100 < x0 < 250:
                        # Ambiguous zone between Character and Dialogue. 
                        # Characters are usually shorter and centered-ish.
                        # Dialogue is wider.
                        # If we already identified it as Character above, good. 
                        # If not, and it's in this zone, likely Dialogue.
                         block_type = 'Dialogue'
                         
                    # 6. Action: Left Aligned (x0 < 120)
                    elif x0 < 120:
                        block_type = 'Action'
                        
                    # Refinement: If previous was Character, this is likely Dialogue or Parenthetical
                    if len(blocks) > 0:
                        last_type = blocks[-1]['type']
                        if last_type == 'Character' and block_type == 'Action':
                             # If indentation was ambiguous but it follows a character, it's likely dialogue
                             # However, action can follow character too. 
                             # Let's rely on x0 mostly.
                             pass

                    # Add to blocks
                    blocks.append({
                        "id": str(uuid.uuid4()),
                        "type": block_type,
                        "text": text
                    })

    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return []

    return blocks

def is_scene_heading(text):
    """Checks if text looks like a scene heading."""
    text = text.upper().strip()
    patterns = [
        r'^INT\.', r'^EXT\.', r'^INT\./EXT\.', r'^EXT\./INT\.', r'^I/E', r'^E/I'
    ]
    for pat in patterns:
        if re.match(pat, text):
            return True
    return False
