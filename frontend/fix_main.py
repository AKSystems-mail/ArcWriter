import sys

file_path = '../backend/main.py'
with open(file_path, 'r') as f:
    content = f.read()

old_string = """        url = services.asset_studio.generate_poster(
            title=request.title,
            tagline=request.tagline,
            anchor_image_url=request.reference_image_url,
            genre=request.genre or "Sci-Fi"
        )"""

new_string = """        url = services.asset_studio.generate_poster(
            title=request.title,
            tagline=request.tagline,
            anchor_image_url=request.reference_image_url,
            genre=request.genre or "Sci-Fi",
            style=request.style
        )"""

if old_string in content:
    new_content = content.replace(old_string, new_string)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully replaced content.")
else:
    print("Could not find exact match for replacement.")
    sys.exit(1)
