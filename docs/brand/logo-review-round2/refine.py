exec(open(__file__.replace('refine.py','build.py')).read().split('for key,d in symbols.items():')[0])
# 60-degree internal edges. Slight corner softness, open right-hand route.
symbols['a']='M222 175C232 193 220 216 200 216H56C36 216 24 193 34 175L106 50C116 32 140 32 150 50L193.879 126H151.094L128 86L73.729 180H170.321L153 150H207.566Z'
# Rebuilt junctions: no touching corners, no sub-pixel notches. 28-unit aperture.
symbols['b']='M88 40H164C193 40 216 63 216 92V104H180V92C180 83 173 76 164 76H88ZM40 92H76V164C76 173 83 180 92 180H112V132H216V164H148V180H184V216H92C63 216 40 193 40 164Z'
for key in 'ab':
 d=symbols[key]
 (P/'iterations'/f'{key}-v2.svg').write_text(svg(f'<title>AsterGraph — {key.upper()}</title><path fill="#111111" d="{d}"/>'))
 # Symbol footprint reduced to avoid overwhelming the name; baseline aligned optically.
 body=f'<g fill="#111111"><g transform="translate(0 32) scale(.7)"><path d="{d}"/></g><g transform="translate(208 160)">{word}</g></g>'
 (P/'iterations'/f'{key}-lockup-v2.svg').write_text(svg(body,round(208+w+10),256))
