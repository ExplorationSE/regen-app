# Erzeugt site/icon.svg für „ExplorationSE Regen“ (Text als Pfade, keine Schriftabhängigkeit)
# Stil wie „ExplorationSE Aktien“: Schwarz, „S.E.“ in Marcellus weiß, darunter preußischblaues Radar-Motiv
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import math, sys
FONT = '/usr/share/fonts/truetype/sand-box/google/Marcellus/Marcellus-Regular.ttf'
f = TTFont(FONT); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
def text_path(txt, size, cx, baseline, track=0):
    s = size / upm; names = [cmap[ord(c)] for c in txt]
    w = sum(gs[n].width for n in names) * s + track * (len(txt) - 1)
    x = cx - w / 2; pen = SVGPathPen(gs)
    for n in names:
        gs[n].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline))); x += gs[n].width * s + track
    return pen.getCommands(), w
TXT, w = text_path('S.E.', 144, 256, 226, track=14)
CX, CY, R = 256, 338, 74          # Radarschirm unter dem Schriftzug
def pt(a, r): return (round(CX + r * math.cos(math.radians(a)), 1), round(CY - r * math.sin(math.radians(a)), 1))
# Radar-Sweep: Keil von 20° bis 75° (oben rechts), läuft gegen den Uhrzeigersinn aus
a0, a1 = 18, 78
p0, p1 = pt(a0, R), pt(a1, R)
wedge = f'M{CX},{CY} L{p0[0]},{p0[1]} A{R},{R} 0 0 0 {p1[0]},{p1[1]} Z'
beam = pt(a0, R)
# Niederschlagszellen (Ellipsen) im Radarbild
cells = [(-38, -22, 18, 11, -25, .7), (29, -38, 22, 13, -30, .95), (46, -12, 11, 7, -20, .7), (-14, 32, 13, 8, -15, .5), (22, 26, 8, 6, 0, .45)]
cell_svg = ''.join(f'<ellipse cx="{CX+dx}" cy="{CY+dy}" rx="{rx}" ry="{ry}" transform="rotate({rot} {CX+dx} {CY+dy})" fill="url(#cell)" opacity="{op}"/>' for dx, dy, rx, ry, rot, op in cells)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
  <radialGradient id="glow" cx="50%" cy="58%" r="55%"><stop offset="0" stop-color="#001a2c" stop-opacity=".9"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <linearGradient id="tx" x1="0" y1="130" x2="0" y2="230" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9d3dc"/></linearGradient>
  <linearGradient id="rule" x1="150" y1="0" x2="362" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1f5f8b" stop-opacity="0"/><stop offset=".5" stop-color="#2a6f9f"/><stop offset="1" stop-color="#1f5f8b" stop-opacity="0"/></linearGradient>
  <radialGradient id="scope" cx="{CX}" cy="{CY}" r="{R}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#003153" stop-opacity=".45"/><stop offset="1" stop-color="#003153" stop-opacity=".08"/></radialGradient>
  <linearGradient id="sweep" x1="{p1[0]}" y1="{p1[1]}" x2="{p0[0]}" y2="{p0[1]}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2a6f9f" stop-opacity="0"/><stop offset="1" stop-color="#2a6f9f" stop-opacity=".55"/></linearGradient>
  <radialGradient id="cell"><stop offset="0" stop-color="#5a9fd0"/><stop offset=".6" stop-color="#2a6f9f"/><stop offset="1" stop-color="#14527c" stop-opacity="0"/></radialGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
  <clipPath id="clip"><circle cx="{CX}" cy="{CY}" r="{R}"/></clipPath>
</defs>
<rect width="512" height="512" fill="#000"/>
<rect width="512" height="512" fill="url(#glow)"/>
<path d="{TXT}" fill="url(#tx)"/>
<rect x="150" y="248" width="212" height="1.6" fill="url(#rule)"/>
<circle cx="{CX}" cy="{CY}" r="{R}" fill="url(#scope)"/>
<g clip-path="url(#clip)">{cell_svg}<path d="{wedge}" fill="url(#sweep)"/></g>
<g fill="none" stroke="#14527c" stroke-width="1.6">
  <circle cx="{CX}" cy="{CY}" r="{R}" stroke="#1f5f8b" stroke-width="2.4"/>
  <circle cx="{CX}" cy="{CY}" r="{R*2/3:.1f}" opacity=".8"/><circle cx="{CX}" cy="{CY}" r="{R/3:.1f}" opacity=".8"/>
  <line x1="{CX-R}" x2="{CX+R}" y1="{CY}" y2="{CY}" opacity=".5"/><line x1="{CX}" x2="{CX}" y1="{CY-R}" y2="{CY+R}" opacity=".5"/>
</g>
<circle cx="{CX}" cy="{CY}" r="{R}" fill="none" stroke="#1f5f8b" stroke-width="8" opacity=".25" filter="url(#soft)"/>
<line x1="{CX}" y1="{CY}" x2="{beam[0]}" y2="{beam[1]}" stroke="#3a82b5" stroke-width="3" stroke-linecap="round"/>
<circle cx="{CX}" cy="{CY}" r="11" fill="#2a6f9f" opacity=".35" filter="url(#soft)"/>
<circle cx="{CX}" cy="{CY}" r="5" fill="#3a82b5"/>
<circle cx="{CX}" cy="{CY}" r="2" fill="#e8f1f8"/>
</svg>'''
open(sys.argv[1] if len(sys.argv) > 1 else '../site/icon.svg', 'w').write(svg)
print('text width', round(w))
