from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
P=Path(__file__).parent
symbols={
'a': 'M222 175C232 193 220 216 200 216H56C36 216 24 193 34 175L106 50C116 32 140 32 150 50L194 126H151L128 86L74 180H170L153 150H208Z',
'b': 'M72 40H164C193 40 216 63 216 92V116H180V92C180 83 173 76 164 76H72ZM40 72H76V164C76 173 83 180 92 180H184V216H92C63 216 40 193 40 164ZM112 108H216V144H148V180H112Z',
'c': 'M128 28C148 64 160 80 194 96L228 112V144L194 160C160 176 148 192 128 228C108 192 96 176 62 160L28 144V112L62 96C96 80 108 64 128 28ZM128 88 88 128 128 168 168 128Z'
}

def svg(body,w=256,h=256): return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>'
font=instantiateVariableFont(TTFont(P/'fonts/Manrope.ttf'),{'wght':560})
glyphs=font.getGlyphSet(); cmap=font.getBestCmap(); upm=font['head'].unitsPerEm
# Outlined, optically spaced lettering; no live font dependency in SVG.
def wordmark(size=100):
 x=0; paths=[]; prev=''; pairs={'As':-18,'st':-8,'te':-12,'er':-5,'rG':12,'Gr':-18,'ra':-12,'ap':-8,'ph':-5}
 for char in 'AsterGraph':
  x += pairs.get(prev+char,0)
  pen=SVGPathPen(glyphs); t=TransformPen(pen,(size/upm,0,0,-size/upm,x*size/upm,0))
  glyphs[cmap[ord(char)]].draw(t)
  paths.append(f'<path d="{pen.getCommands()}"/>')
  x+=font['hmtx'].metrics[cmap[ord(char)]][0]-12;prev=char
 return ''.join(paths), x*size/upm
word,w=wordmark(130)
for key,d in symbols.items():
 (P/'iterations'/f'{key}-v1.svg').write_text(svg(f'<title>AsterGraph — Round 2 {key.upper()}</title><path fill="#111111" fill-rule="evenodd" d="{d}"/>'))
 body=f'<g fill="#111111"><g transform="translate(0 27) scale(.78)"><path fill-rule="evenodd" d="{d}"/></g><g transform="translate(230 165)">{word}</g></g>'
 (P/'iterations'/f'{key}-lockup-v1.svg').write_text(svg(body,round(230+w+10),256))
(P/'iterations'/'wordmark.svg').write_text(svg(f'<g fill="#111111" transform="translate(15 165)">{word}</g>',round(w+30),256))
