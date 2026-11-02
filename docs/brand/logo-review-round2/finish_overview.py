from pathlib import Path
import xml.etree.ElementTree as ET
p=Path(__file__).parent
NS='{http://www.w3.org/2000/svg}'
ET.register_namespace('',NS[1:-1])
s=(p/'concepts.svg').read_text().replace('height="984" viewBox="0 0 1400 984"','height="1224" viewBox="0 0 1400 1224"')
footer='<rect x="0" y="984" width="1400" height="240" fill="#f7f7f4"/><text x="60" y="1004" font-family="Arial,sans-serif" font-size="15" fill="#555">A / Product colour study — dark &amp; light</text>'
for x,bg,ink,blue,label in [(60,'#0b1220','#eef3f9','#78aaff','DARK'),(714,'#edf2f8','#17263c','#2458c6','LIGHT')]:
 footer+=f'<rect x="{x}" y="1028" width="626" height="136" rx="12" fill="{bg}"/>'
 root=ET.parse(p/'iterations/a-lockup-v2.svg').getroot()
 root.set('x',str(x+24));root.set('y','1047');root.set('width','310');root.set('height','94')
 group=root.find(NS+'g');group.set('fill',ink);group.find(NS+'g').set('fill',blue)
 footer+=ET.tostring(root,encoding='unicode')
 footer+=f'<text x="{x+540}" y="1100" font-family="Arial,sans-serif" font-size="12" fill="{ink}" opacity=".65">{label}</text>'
s=s.replace('</svg>',footer+'</svg>',1) if s.count('</svg>')==1 else s.rsplit('</svg>',1)[0]+footer+'</svg>'
(p/'concepts-context.svg').write_text(s)
