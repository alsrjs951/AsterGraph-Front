from pathlib import Path
import xml.etree.ElementTree as ET
p=Path(__file__).parent
NS='{http://www.w3.org/2000/svg}'
ET.register_namespace('', 'http://www.w3.org/2000/svg')
# Concept-only context proofs; no app CSS/JS mutations.
def mark(k,size=32,col='currentColor'):
 root=ET.parse(p/'iterations'/f'{k}-v2.svg').getroot();d=root.find(NS+'path').attrib['d']
 return f'<svg width="{size}" height="{size}" viewBox="0 0 256 256"><path fill="{col}" d="{d}"/></svg>'
def lockup(k,width=200,col='#eef3f9'):
 s=(p/'iterations'/f'{k}-lockup-v2.svg').read_text().replace('#111111',col)
 root=ET.fromstring(s);root.set('width',str(width));root.set('height','56')
 return ET.tostring(root,encoding='unicode')
body=''
for k,title in [('a','A · AG Aperture'),('b','B · Relay')]:
 body+=f'<section><h2>{title}</h2><div class="twins"><div class="panel dark">{lockup(k,235)}<p>다크 테마 · 로고 조합</p></div><div class="panel light">{lockup(k,235,"#17263c")}<p>라이트 테마 · 로고 조합</p></div></div><div class="sizes">'
 for size in [16,20,24,32,48,64,96]: body+=f'<div>{mark(k,size)}<small>{size}px</small></div>'
 body+='</div><div class="treatments">'
 for transform,label in [('none','Original'),('scaleX(-1)','Mirror'),('rotate(180deg)','180°'),('none','White / navy')]:
  body+=f'<div class="treatment {"dark" if label=="White / navy" else ""}"><div style="transform:{transform}">{mark(k,80)}</div><small>{label}</small></div>'
 body+='</div></section>'
html=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><title>AsterGraph · Refined logo proofs</title><style>*{{box-sizing:border-box}}body{{margin:0;padding:32px;background:#f5f6f8;color:#17263c;font-family:-apple-system,sans-serif}}h1{{font-size:26px;margin:0 0 12px}}h2{{font-size:17px;margin:0 0 16px}}p,small{{font-size:12px}}section{{padding:24px;background:white;margin-top:24px;border:1px solid #d3dce7;border-radius:12px}}.twins,.treatments{{display:flex;gap:16px}}.panel{{padding:24px;flex:1;border:1px solid #d3dce7;border-radius:8px}}.dark{{background:#0b1220;color:#eef3f9}}.light{{background:#f3f6fa}}.sizes{{display:flex;gap:32px;align-items:end;margin:24px 0}}.sizes>div,.treatment{{display:flex;align-items:center;flex-direction:column;gap:12px}}.treatment{{padding:12px;width:140px;border:1px solid #d3dce7;border-radius:6px}}</style><h1>AsterGraph · Logo refinement</h1><p>콘셉트 검수 · 앱에 적용하기 전의 크기/배경 비교</p>{body}</html>'''
(p/'contexts.html').write_text(html)
