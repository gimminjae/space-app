"""Original educational diagrams and share cards; no fund performance is simulated."""
from pathlib import Path
from html import escape
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/etf-assets'
OUT.mkdir(parents=True, exist_ok=True)
manifest = json.loads((ROOT / 'content/etf/manifest.json').read_text())
INK, GREEN, PAPER, MUTED = '#19392f', '#306a54', '#f5f3eb', '#64756e'

def svg_text(x, y, text, size=28, fill=INK, weight=400, anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}" text-anchor="{anchor}">{escape(text)}</text>'

def save_svg(name, locale, title, subtitle, content, footnote):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="880" viewBox="0 0 1400 880" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(subtitle+' '+footnote)}</desc>
<rect width="1400" height="880" rx="24" fill="{PAPER}"/>
<g font-family="Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif">
{svg_text(70,76,'SPACE / ETF',22,GREEN,700)}
{svg_text(70,144,title,44,INK,700)}
{svg_text(70,193,subtitle,25,MUTED)}
{content}
<path d="M70 773H1330" stroke="#cdd5cc"/>
{svg_text(70,818,footnote,23,MUTED)}
</g></svg>'''
    (OUT / f'{name}.{locale}.svg').write_text(svg)

for locale in ['ko', 'en']:
    ko = locale == 'ko'
    # Constant holdings value through a 3-for-1 split.
    body = '<rect x="70" y="250" width="540" height="430" rx="18" fill="#e0e8dc"/><rect x="790" y="250" width="540" height="430" rx="18" fill="#e0e8dc"/>'
    body += svg_text(340,310,'분할 전' if ko else 'Before the split',29,GREEN,600,'middle')
    body += svg_text(1060,310,'3 대 1 분할 후' if ko else 'After a 3-for-1 split',29,GREEN,600,'middle')
    body += '<rect x="270" y="350" width="140" height="150" rx="10" fill="#306a54"/>'
    for x in [855,1000,1145]: body += f'<rect x="{x}" y="350" width="120" height="150" rx="10" fill="#306a54"/>'
    body += svg_text(340,441,'1',54,'white',700,'middle')
    for x in [915,1060,1205]: body += svg_text(x,441,'1',54,'white',700,'middle')
    body += svg_text(700,450,'→',65,GREEN,400,'middle')
    body += svg_text(340,568,'1주 × 90' if ko else '1 share × 90',38,INK,600,'middle')
    body += svg_text(1060,568,'3주 × 30' if ko else '3 shares × 30',38,INK,600,'middle')
    body += svg_text(340,630,'가치 90' if ko else 'Value: 90',33,GREEN,600,'middle')
    body += svg_text(1060,630,'가치 90' if ko else 'Value: 90',33,GREEN,600,'middle')
    save_svg('split',locale,'조각이 늘어도 파이는 그대로' if ko else 'More pieces, the same pie',
      '3 대 1 주식 분할의 가상 예시 · 가격 변동이 없다면' if ko else 'A hypothetical 3-for-1 share split, with no other price movement',body,
      '교육용 숫자입니다. SCHD의 실제 분할 전후 가격이 아닙니다.' if ko else 'Illustrative values, not actual SCHD prices before or after its split.')

    body = ''
    for x,label,end,cash,result,color in [(70,'A',900,80,'−2%','#935a43'),(740,'B',1050,30,'+8%',GREEN)]:
        body += f'<rect x="{x}" y="248" width="590" height="460" rx="18" fill="white"/>'
        body += svg_text(x+35,305,f'{label}  ·  '+('처음 투자한 돈 1,000' if ko else 'Starting investment 1,000'),27,INK,600)
        body += svg_text(x+35,368,'남은 자산' if ko else 'Assets remaining',25,MUTED)
        body += svg_text(x+550,368,f'{end:,}',32,INK,600,'end')
        body += svg_text(x+35,427,'받은 현금' if ko else 'Cash received',25,MUTED)
        body += svg_text(x+550,427,f'+ {cash}',32,INK,600,'end')
        body += f'<path d="M{x+35} 455H{x+555}" stroke="#dbe1d7"/>'
        body += svg_text(x+35,512,'합계' if ko else 'Combined value',26,INK,600)
        body += svg_text(x+550,512,f'{end+cash:,}',40,INK,700,'end')
        body += svg_text(x+35,591,'단순 총수익률' if ko else 'Simple total return',25,MUTED)
        body += svg_text(x+550,640,result,64,color,700,'end')
    save_svg('total-return',locale,'현금만 세면 절반을 놓칩니다' if ko else 'Cash is only part of the result',
      '(남은 자산 + 받은 현금 − 처음 투자금) ÷ 처음 투자금' if ko else '(Assets remaining + cash received − initial investment) ÷ initial investment',body,
      '가상 예시 · 재투자, 세금과 비용 제외 · 특정 ETF의 성과가 아닙니다.' if ko else 'Hypothetical; excludes reinvestment, taxes and costs. Not actual ETF performance.')

    # Expiry payoff: stock x-100; call overlay x-100+2-max(x-105,0).
    X = lambda p: 165+(p-80)/40*1020
    Y = lambda r: 480-r*8
    body = ''
    for ret in [-20,-10,0,10,20]:
        body += f'<path d="M165 {Y(ret)}H1185" stroke="#d5ddd2" stroke-dasharray="4 6"/>'
        body += svg_text(144,Y(ret)+8,str(ret),23,MUTED,400,'end')
    for price in [80,90,100,105,110,120]: body += svg_text(X(price),694,str(price),23,MUTED,400,'middle')
    body += f'<path d="M{X(80)} {Y(-20)} L{X(120)} {Y(20)}" stroke="#8299a8" stroke-width="7" fill="none"/>'
    body += f'<path d="M{X(80)} {Y(-18)} L{X(105)} {Y(7)} L{X(120)} {Y(7)}" stroke="{GREEN}" stroke-width="8" fill="none"/>'
    body += f'<circle cx="{X(105)}" cy="{Y(7)}" r="8" fill="{GREEN}"/>'
    body += svg_text(205,274,'주식만 보유' if ko else 'Stock alone',26,'#617e91',600)
    body += svg_text(600,274,'주식 + 콜옵션 매도' if ko else 'Stock + written call',26,GREEN,600)
    body += svg_text(129,300,'손익' if ko else 'P/L',22,MUTED,400,'end')
    body += svg_text(1100,395,'최대 +7' if ko else 'Maximum +7',28,GREEN,600,'middle')
    body += svg_text(675,738,'만기 기초자산 가격' if ko else 'Underlying price at expiration',26,MUTED,400,'middle')
    save_svg('covered-call',locale,'프리미엄을 받고, 상승 일부를 내줍니다' if ko else 'Collect premium, exchange some upside',
      '기초자산 100 · 콜 행사가격 105 · 프리미엄 2 · 1회 계약 만기 기준' if ko else 'Underlying 100 · call strike 105 · premium 2 · one contract held to expiration',body,
      '가상 예시 · 배당, 세금, 비용, 조기 행사 제외 · 실제 펀드 수익률 아님' if ko else 'Hypothetical; excludes dividends, taxes, costs and early exercise. Not fund returns.')

font_path = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
def font(size): return ImageFont.truetype(font_path, size, index=6)
def wrapped(text, draw, face, width):
    result, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if draw.textlength(trial,font=face) <= width: line=trial
        else:
            if line: result.append(line)
            line=''
            for char in word:
                if draw.textlength(line+char,font=face)>width: result.append(line);line=''
                line+=char
    if line: result.append(line)
    return result

cards = [(a['slug'],a['order'],a) for a in manifest['articles']]
cards += [('series',0,{'ko':{'title':'ETF를 읽는 시간','tags':['배당 · 옵션 · 총수익률']},'en':{'title':'Reading an ETF','tags':['Dividends · Options · Total return']}})]
for slug,order,item in cards:
    for locale in ['ko','en']:
        im=Image.new('RGB',(1200,630),PAPER);d=ImageDraw.Draw(im)
        d.rounded_rectangle((965,-100,1320,255),radius=170,outline='#d5dece',width=2)
        d.rounded_rectangle((1000,-75,1355,280),radius=170,outline='#d5dece',width=2)
        d.text((70,60),'space',font=font(44),fill=INK)
        d.ellipse((205,78,215,88),fill=GREEN)
        d.text((70,146),f'ETF / {order:02d}' if order else 'ETF / 17 ARTICLES',font=font(23),fill=GREEN)
        size=60
        while True:
            face=font(size);lines=wrapped(item[locale]['title'],d,face,1060)
            if len(lines)<=3: break
            size-=2
        for i,line in enumerate(lines): d.text((67,219+i*(size+15)),line,font=face,fill=INK)
        d.line((70,518,1130,518),fill='#cbd5c5',width=2)
        d.text((70,548),item[locale]['tags'][-1],font=font(24),fill=GREEN)
        date='2026.10.22';d.text((1130-d.textlength(date,font=font(23)),548),date,font=font(23),fill=MUTED)
        im.save(OUT/f'{slug}.{locale}.og.png',optimize=True)
print('Created 6 explanatory SVGs and 36 social preview PNGs.')
