"""Render paired original charts from one verified snapshot; never fetch or invent values."""
import json, math, sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager

source=Path(sys.argv[1]); out=Path(sys.argv[2]); out.mkdir(parents=True,exist_ok=True)
doc=json.loads(source.read_text())
rows=doc['rows']
assert 3<=len(rows)<=8, 'Use 3–8 comparable daily percentage changes.'
assert all(isinstance(r['changePct'],(int,float)) and not isinstance(r['changePct'],bool) and math.isfinite(r['changePct']) for r in rows), 'Missing or nonfinite quote.'
assert doc['sessionDate'] and doc['asOf'] and doc['sources'], 'Dates and sources required.'
assert all(s.startswith('https://') for s in doc['sources'])
fonts={f.name for f in font_manager.fontManager.ttflist}
font=next((n for n in ['AppleGothic','Noto Sans CJK KR','NanumGothic','Arial Unicode MS'] if n in fonts),None)
assert font, 'Install a Korean font before rendering.'
plt.rcParams.update({'font.family':font,'axes.unicode_minus':False})
for locale in ['ko','en']:
 plt.rcParams['font.family']=[font] if locale=='ko' else ['DejaVu Sans',font]
 fig,ax=plt.subplots(figsize=(12,6.3),dpi=100,facecolor='#f7f8fa');ax.set_facecolor('#f7f8fa')
 values=[r['changePct'] for r in rows]; extent=max(max(abs(v) for v in values),0.1)*1.45
 bars=ax.barh(range(len(rows)),values,color=['#267865' if v>=0 else '#b4534c' for v in values],height=.55)
 ax.set_yticks(range(len(rows)),[r['label'][locale] for r in rows],fontsize=13);ax.invert_yaxis()
 ax.axvline(0,color='#809098',lw=.8);ax.set_xlim(-extent,extent)
 ax.set_xlabel('전 거래일 대비 등락률 (%)' if locale=='ko' else 'Change from previous trading close (%)',fontsize=11,labelpad=15)
 for i,v in enumerate(values):ax.text(v+(extent*.035 if v>=0 else -extent*.035),i,f'{v:+.2f}%',va='center',ha='left' if v>=0 else 'right',fontsize=12,fontweight='bold',color='#1b2935')
 for spine in ax.spines.values():spine.set_visible(False)
 ax.tick_params(axis='both',length=0);ax.grid(axis='x',alpha=.12);ax.set_axisbelow(True)
 fig.text(.06,.94,doc['title'][locale],fontsize=21,fontweight='bold',color='#192e40')
 fig.text(.06,.885,('거래일 ' if locale=='ko' else 'Session ')+doc['sessionDate']+'  ·  '+doc['asOf'],fontsize=10,color='#53606a')
 fig.text(.06,.035,doc['sourceLabel'][locale],fontsize=9,color='#53606a')
 fig.subplots_adjust(left=.23,right=.94,top=.79,bottom=.19)
 fig.savefig(out/f'{locale}.png',dpi=100);plt.close(fig)
print(json.dumps({'rendered':['ko.png','en.png'],'sessionDate':doc['sessionDate']}))
