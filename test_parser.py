import re
import os

def get_manual_section(section_id, content):
    search_key = section_id.upper()
    mapping = {
        "ONBOARDING": "WIZARD",
        "ONBOARDING_WIZARD": "WIZARD",
        "BEAT_SHEET": "BLUEPRINT",
        "BLUEPRINT": "BLUEPRINT"
    }
    search_key = mapping.get(search_key, search_key)
    
    # Simple line-by-line search for the slugline
    lines = content.split('\n')
    start_line_idx = -1
    for i, line in enumerate(lines):
        stripped = line.strip()
        if (stripped.startswith('INT.') or stripped.startswith('EXT.')) and search_key in stripped.upper():
            start_line_idx = i
            break
    
    if start_line_idx == -1:
        return None

    # Collect until next slugline or transition
    scene_lines = [lines[start_line_idx]]
    for i in range(start_line_idx + 1, len(lines)):
        line = lines[i]
        stripped = line.strip()
        if not stripped and i < len(lines) - 1 and not lines[i+1].strip(): continue # Skip double empty
        if stripped.startswith('INT.') or stripped.startswith('EXT.') or stripped in ['FADE OUT.', 'CUT TO:', 'FADE TO BLACK.', 'FADE IN:']:
            break
        scene_lines.append(line)

    result = {
        "slugline": scene_lines[0].strip(),
        "action": "",
        "character": "ARCWRITER",
        "parenthetical": "",
        "dialogue": ""
    }
    
    action_parts = []
    dialogue_parts = []
    
    for line in scene_lines[1:]:
        indent = len(line) - len(line.lstrip())
        stripped = line.strip()
        if not stripped: continue
        if indent >= 15:
            result["character"] = stripped
        elif indent >= 8 and stripped.startswith('(') and stripped.endswith(')'):
            result["parenthetical"] = stripped.strip('()')
        elif indent >= 8:
            dialogue_parts.append(stripped)
        else:
            action_parts.append(stripped)
    
    result["action"] = " ".join(action_parts)
    result["dialogue"] = " ".join(dialogue_parts)
    return result

with open("backend/Screenwriter_Guide.md", "r") as f:
    content = f.read()

print(f"WIZARD: {get_manual_section('WIZARD', content)}")
print(f"DASHBOARD: {get_manual_section('DASHBOARD', content)}")
