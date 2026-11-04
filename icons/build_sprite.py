"""Build the local Fluent UI sprite from pinned, official SVG assets.

Run manually when updating the icon set; the application never fetches icons.
"""

from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen
import xml.etree.ElementTree as ET

REVISION = "9bfae3d782fda4c8764f2128cec4d0dda160b283"
BASE = f"https://raw.githubusercontent.com/microsoft/fluentui-system-icons/{REVISION}/assets"
ICONS = {
    "mail-20-regular": ("Mail", 20, "regular"),
    "mail-20-filled": ("Mail", 20, "filled"),
    "calendar-20-regular": ("Calendar", 20, "regular"),
    "people-20-regular": ("People", 20, "regular"),
    "checkmark-20-regular": ("Checkmark", 20, "regular"),
    "apps-20-regular": ("Apps", 20, "regular"),
    "mail-inbox-16-filled": ("Mail Inbox", 16, "filled"),
    "mail-edit-20-regular": ("Mail Edit", 20, "regular"),
    "send-16-regular": ("Send", 16, "regular"),
    "delete-16-regular": ("Delete", 16, "regular"),
    "archive-16-regular": ("Archive", 16, "regular"),
    "folder-16-regular": ("Folder", 16, "regular"),
    "chevron-down-12-regular": ("Chevron Down", 12, "regular"),
    "chevron-right-12-regular": ("Chevron Right", 12, "regular"),
    "navigation-20-regular": ("Navigation", 20, "regular"),
    "search-20-regular": ("Search", 20, "regular"),
    "home-20-filled": ("Home", 20, "filled"),
    "book-20-regular": ("Book", 20, "regular"),
    "building-20-regular": ("Building", 20, "regular"),
    "plant-grass-20-regular": ("Plant Grass", 20, "regular"),
    "sparkle-20-regular": ("Sparkle", 20, "regular"),
    "clipboard-20-regular": ("Clipboard", 20, "regular"),
    "arrow-right-16-regular": ("Arrow Right", 16, "regular"),
    "arrow-left-16-regular": ("Arrow Left", 16, "regular"),
    "dismiss-20-regular": ("Dismiss", 20, "regular"),
    "arrow-down-16-regular": ("Arrow Down", 16, "regular"),
    "arrow-up-16-regular": ("Arrow Up", 16, "regular"),
}

root = ET.Element("svg", {"xmlns": "http://www.w3.org/2000/svg"})
for icon_id, (name, size, style) in ICONS.items():
    filename = f"ic_fluent_{name.lower().replace(' ', '_')}_{size}_{style}.svg"
    url = f"{BASE}/{quote(name)}/SVG/{filename}"
    with urlopen(url, timeout=20) as response:
        source = ET.fromstring(response.read())
    assert source.attrib["viewBox"] == f"0 0 {size} {size}", url
    symbol = ET.SubElement(root, "symbol", {"id": icon_id, "viewBox": source.attrib["viewBox"]})
    for shape in source:
        assert shape.tag.endswith("}path"), url
        path = ET.SubElement(symbol, "path", dict(shape.attrib))
        path.set("fill", "currentColor")

output = Path(__file__).with_name("fluent.svg")
output.write_text(ET.tostring(root, encoding="unicode") + "\n", encoding="utf-8")
print(f"Wrote {len(ICONS)} official Fluent symbols to {output}")
