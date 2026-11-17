from pathlib import Path
import os, math, random, json, shutil, io, zipfile, textwrap
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance
import cairosvg

OUT=Path('/mnt/data/NeRazley_ArtKit_v1')
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(parents=True)
P={
'ink':'#192437','ink2':'#28354B','navy':'#111A2A','charcoal':'#384456',
'yellow':'#FFD12B','yellow2':'#FFB900','orange':'#FF8300','cream':'#FFF7E8',
'white':'#FFFFFF','lime':'#59D354','red':'#FF5E57','blue':'#36A6ED',
'purple':'#A36BFC','stone':'#9AA7B8','gray':'#6D7B8F','road':'#424C60',
'grass':'#80C64B','wood':'#B76F36','wood2':'#D78B42',
}
manifest=[]
svgdefs='''<defs>
<linearGradient id="yellow" x1="0" y1="0" x2="0.2" y2="1"><stop stop-color="#FFF570"/><stop offset="0.46" stop-color="#FFCF19"/><stop offset="1" stop-color="#FF9200"/></linearGradient>
<linearGradient id="lime" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#A7F96B"/><stop offset="1" stop-color="#28AB42"/></linearGradient>
<linearGradient id="danger" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FF9D81"/><stop offset="1" stop-color="#E93842"/></linearGradient>
<linearGradient id="cream" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FFFFFF"/><stop offset="1" stop-color="#EFE0CC"/></linearGradient>
<linearGradient id="navy" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#39485F"/><stop offset="1" stop-color="#141D2D"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#E4EDF5"/><stop offset="0.55" stop-color="#8797A8"/><stop offset="1" stop-color="#536478"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1384DB"/><stop offset="0.6" stop-color="#72C6FF"/><stop offset="1" stop-color="#D4F2FF"/></linearGradient>
<linearGradient id="sky_evening" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#243961"/><stop offset="0.55" stop-color="#9A75A5"/><stop offset="1" stop-color="#FFB275"/></linearGradient>
<linearGradient id="sky_winter" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#78A7CB"/><stop offset="1" stop-color="#DDF1FF"/></linearGradient>
</defs>'''
def doc(w,h,body):
 return f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{svgdefs}<g stroke-linejoin="round" stroke-linecap="round">{body}</g></svg>'
def R(x,y,w,h,fill,rx=0,stroke='none',sw=0,opacity=1): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{opacity}"/>'
def C(x,y,r,fill,stroke='none',sw=0,op=1): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>'
def E(x,y,rx,ry,fill,stroke='none',sw=0,op=1): return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>'
def PATH(d,fill='none',stroke='none',sw=0,op=1):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>'
def LINE(x1,y1,x2,y2,stroke,sw,op=1): return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>'
def POLY(p,fill,stroke='none',sw=0): return f'<polygon points="{p}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def T(x,y,txt,size=42,color=None,weight=800,stroke='none',sw=0,anchor='middle'):
 color=color or P['ink'];return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="DejaVu Sans, sans-serif" font-weight="{weight}" font-size="{size}" fill="{color}" stroke="{stroke}" stroke-width="{sw}" paint-order="stroke">{txt}</text>'
def asset(category,name,w,h,body,kind='svg_png',notes='',extra=None):
 d=OUT/category;d.mkdir(parents=True,exist_ok=True)
 svg=doc(w,h,body)
 sp=d/(name+'.svg');sp.write_text(svg,encoding='utf-8')
 pp=d/(name+'.png')
 try: cairosvg.svg2png(bytestring=svg.encode(),write_to=str(pp),output_width=w,output_height=h)
 except Exception as e: print('ERR',sp,e);raise
 manifest.append({'path':str(pp.relative_to(OUT)).replace('\\','/'),'vector':str(sp.relative_to(OUT)).replace('\\','/'),'size':[w,h],'category':category,'source':'original editable SVG','runtime_usable':True,'notes':notes,**(extra or {})})
 return pp

# branding
logo_body='''<path d="M67 110 Q58 64 105 57 L860 56 Q924 66 920 134 L916 337 Q910 392 854 399 L77 400 Q35 382 43 325Z" fill="#132035" stroke="#101522" stroke-width="20"/>
<path d="M104 86 L852 86" stroke="#6F7E90" stroke-width="12" opacity=".5"/>'''
logo_body+=T(310,216,'Не',137,'none',900,P['navy'],26)+T(310,216,'Не',137,P['cream'],900)
logo_body+=T(524,344,'Разлей!',124,'none',900,P['navy'],30)+T(524,344,'Разлей!',124,'url(#yellow)',900)
logo_body+=PATH('M250 372 Q520 415 800 368','none','#FF871C',17)
logo_body+=C(745,103,54,P['cream'],P['navy'],12)+PATH('M700 118 L707 143 L780 143 L793 113Z','url(#yellow)',P['navy'],9)+PATH('M734 65 Q712 30 732 18 M755 64 Q766 35 753 20','none',P['white'],10)
logo_body+=E(816,62,18,11,P['orange'])+E(829,35,10,7,P['yellow'])
asset('01_BRAND','logo_full',980,460,logo_body,notes='Editable logo and raster fallback; display text baked into PNG.')
icon_body=R(0,0,512,512,'url(#yellow)',110)+E(280,462,250,85,P['orange'],op=.3)+PATH('M70 332 Q256 165 440 332','none',P['ink'],32)+PATH('M98 335 L130 390 L381 390 L414 331Z','url(#navy)',P['ink'],15)+PATH('M151 169 L175 341 L345 341 L365 169Z','url(#cream)',P['ink'],19)+E(259,166,128,35,'#F8F8F2',P['ink'],17)+R(210,205,100,110,'url(#yellow)',22,P['ink'],12)+PATH('M235 117 Q212 78 245 52 M295 119 Q317 78 284 50','none',P['cream'],17)+C(350,120,14,P['orange'])
asset('01_BRAND','app_icon_master',512,512,icon_body,notes='Icon without title, suitable starting point for adaptive icon foreground. Do not use entire background as Android foreground.')

# Vehicle components
W,H=700,370
# body only, no wheels, wheel pivots at x170,y286 and x535,y286
scooter=E(330,331,290,20,P['navy'],op=.18)
scooter+=PATH('M100 245 Q130 199 217 208 L312 207 L358 253 L473 242 L505 178 L562 186 L606 258 L572 272 L480 273 L409 288 L220 287 L155 275Z','url(#navy)',P['navy'],11)
scooter+=PATH('M106 227 Q115 156 166 150 L253 147 Q312 148 316 202 L273 239 L124 240Z','url(#yellow)',P['ink'],12)
scooter+=PATH('M275 207 L392 219 L444 227 L480 180 L514 178 L483 256 L394 276 L267 269Z','url(#yellow)',P['ink'],12)
scooter+=PATH('M481 176 Q499 90 538 92 Q583 95 585 153 L600 231 L543 244 L511 181Z','url(#yellow)',P['ink'],12)
scooter+=R(123,132,172,35,'url(#navy)',16,P['ink'],8)+PATH('M509 100 L497 64 L574 53','none',P['ink'],13)+C(574,50,9,P['ink'])+PATH('M577 114 Q607 112 609 143 L609 158 L570 158Z','url(#cream)',P['ink'],8)
scooter+=R(147,278,380,22,'url(#metal)',10,P['ink'],8)+R(230,286,160,23,'url(#navy)',8,P['ink'],5)
scooter+=PATH('M111 202 L261 202','none',P['cream'],9,0.6)+PATH('M515 166 Q543 126 565 137','none',P['cream'],10,.7)
scooter+=PATH('M74 255 Q104 204 169 205','none',P['ink'],15)+PATH('M509 207 Q543 197 573 229','none',P['ink'],13)
asset('03_VEHICLES/parts','scooter_body_no_wheels',W,H,scooter,notes='Wheels intentionally separate. Wheel center points on 700x370 art: left (170,286), right (535,286); tune against physics configuration.',extra={'wheel_centers_px':[[170,286],[535,286]],'art_pivot_px':[350,185]})

def wheel(dark=False):
 o=E(100,103,94,94,P['navy'],P['ink'],13)+C(100,100,83,'#2E3443',P['navy'],8)+C(100,100,60,'#697789',P['navy'],7)
 for a in range(8):
  x1=100+23*math.cos(a*math.pi/4);y1=100+23*math.sin(a*math.pi/4);x2=100+55*math.cos(a*math.pi/4);y2=100+55*math.sin(a*math.pi/4)
  o+=LINE(round(x1,2),round(y1,2),round(x2,2),round(y2,2),'#DCE5ED',9)
 o+=C(100,100,29,'url(#metal)',P['ink'],9)+C(100,100,10,'#B3BCC9',P['ink'],3)
 for a in range(12):
  v=a*2*math.pi/12
  o+=E(round(100+88*math.cos(v),2),round(100+88*math.sin(v),2),9,4,'#94A1AD',op=.5)
 return o
asset('03_VEHICLES/parts','wheel_side',200,200,wheel(),notes='Center (100,100); meant to rotate according to Planck wheel angle.',extra={'pivot_px':[100,100]})
asset('03_VEHICLES/parts','wheel_spare',200,200,wheel()+C(100,100,12,P['yellow'],P['ink'],3),extra={'pivot_px':[100,100]})
# bag
bag=PATH('M65 70 Q68 37 106 35 L244 35 Q268 35 276 65 L278 255 Q280 283 251 284 L70 284 Q39 279 44 249Z','url(#yellow)',P['ink'],13)
bag+=PATH('M82 52 L83 260 M245 53 L243 264','none',P['ink'],13)+R(75,134,170,34,'#FFF5E0',4)+R(106,95,114,35,'url(#navy)',13,P['ink'],6)+C(160,112,12,P['yellow'])+R(74,49,170,22,'url(#metal)',10,P['ink'],7)+PATH('M89 38 Q88 13 123 13 L204 13 Q240 13 240 38','none',P['ink'],18)
asset('03_VEHICLES/parts','delivery_backpack',320,320,bag,extra={'pivot_px':[160,160]})
asset('03_VEHICLES/parts','front_headlight',160,120,E(80,62,69,52,'url(#metal)',P['ink'],11)+E(80,62,50,35,'#FFF8A6',P['white'],10)+PATH('M56 58 L105 36','none',P['white'],10))
asset('03_VEHICLES/parts','scooter_seat',300,110,PATH('M28 71 Q32 28 117 25 L254 35 Q287 45 269 73 L237 95 L60 93Z','url(#navy)',P['ink'],10)+PATH('M52 60 Q105 38 223 51','none','#778598',9,0.7))
asset('03_VEHICLES/parts','helmet_yellow',210,190,PATH('M31 121 Q22 31 106 20 Q181 22 186 112 L161 131 L57 130Z','url(#yellow)',P['ink'],12)+PATH('M112 41 Q151 48 164 80','none',P['cream'],11)+PATH('M117 83 L193 91 L184 116 L121 115Z','url(#metal)',P['ink'],9)+PATH('M71 137 L151 138','none',P['ink'],11))

# Cargo asset generators

def food(asset_name):
 n=asset_name;o=''
 if n=='coffee':
  o=E(110,263,66,10,P['navy'],op=.16)+PATH('M59 82 L165 82 L150 244 Q146 253 132 253 L87 253 Q76 249 74 239Z','url(#cream)',P['ink'],10)+R(70,134,85,74,'url(#yellow)',8)+PATH('M49 75 Q52 52 83 53 L157 53 Q183 57 183 80Z','url(#navy)',P['ink'],9)+R(72,43,88,12,P['cream'],6,P['ink'],4)+PATH('M102 36 Q88 15 102 8 M129 37 Q139 13 128 6','none','#CCD6DF',9)
 elif n=='coffee_tray':
  for dx in [-45,45]:o+=f'<g transform="translate({dx},4) scale(.58)">'+food('coffee')+'</g>'
  o+=PATH('M44 214 L181 214 L205 260 L26 260Z',P['wood2'],P['ink'],9)
 elif n=='pizza_box':
  o=PATH('M30 132 L159 103 L225 138 L221 219 L73 251 L26 222Z',P['wood2'],P['ink'],10)+PATH('M31 130 L157 88 L229 123 L88 173Z','url(#cream)',P['ink'],10)+PATH('M91 176 L89 237','none','#F8D49A',7)+C(135,133,31,'#E86229',P['ink'],4)+C(120,121,7,P['cream'])+C(151,137,6,'#F9DD5D')+C(139,151,6,P['lime'])
 elif n=='pizza_slice':
  o=PATH('M34 45 Q124 14 217 51 L126 240Z','#F6B83B',P['ink'],10)+PATH('M35 45 Q123 12 218 51','none','#A74C29',27)+C(112,84,13,'#B62F32')+C(161,85,14,'#B62F32')+C(118,155,13,'#B62F32')+C(89,110,7,P['lime'])
 elif n=='cake':
  o=E(126,243,103,15,'url(#metal)',P['ink'],8)+R(54,134,142,102,'#E9B07B',8,P['ink'],8)+R(54,165,142,25,'#FFF3E5',0)+R(48,118,154,34,'#FFF5E8',12,P['ink'],7)+PATH('M58 141 Q74 183 90 143 T123 145 T158 145 T191 140','none',P['cream'],14)
  for x in [80,125,170]:o+=C(x,110,14,'#EA5159',P['ink'],4)+PATH(f'M{x} 98 l5 -9','none','#4EA849',6)
 elif n=='eggs':
  o=R(26,156,204,80,'#BFA885',15,P['ink'],9)+PATH('M34 168 L219 168 L194 221 L50 221Z','#E6D1B2',P['ink'],6)
  for x in [63,105,147,190]:o+=E(x,135,19,33,'#FFF7DE',P['ink'],5)
 elif n=='sushi':
  o=R(24,110,207,118,'url(#navy)',21,P['ink'],8)
  for x in [63,122,181]:
   o+=R(x-24,131,48,65,'#D9F0EE',9,P['ink'],5)+C(x,159,16,'#F97850',P['cream'],6)+C(x-4,154,6,P['lime'])
 elif n=='parcel':
  o=PATH('M34 95 L120 53 L216 92 L220 227 L121 266 L32 230Z','#DDA66C',P['ink'],10)+PATH('M33 96 L122 143 L217 91 M122 143 L122 260','none','#8C5E38',8)+PATH('M91 70 L186 112 L185 165 L151 181 L151 127 L61 82Z','#FFF3D7',P['ink'],5)+R(148,193,46,31,P['cream'],4)
 elif n=='grocery_bag':
  o=PATH('M58 99 L193 99 L203 251 L44 251Z','#D9A46B',P['ink'],10)+PATH('M84 104 Q81 42 124 42 Q166 42 167 105','none',P['ink'],13)+PATH('M79 74 Q60 43 75 21 Q114 30 117 83',P['lime'],P['ink'],6)+C(162,82,32,P['red'],P['ink'],6)+PATH('M159 45 l10 -12','none',P['lime'],8)+PATH('M76 132 l100 0','none','#EBC89F',7)
 elif n=='watermelon':
  o=C(128,157,92,'#399F55',P['ink'],11)+PATH('M62 100 Q125 64 191 106','none','#A4E070',17)+PATH('M71 218 Q133 253 184 212','none','#A4E070',14)+PATH('M86 122 Q131 109 170 125','none','#20763E',8)
 elif n=='bottle':
  o=R(100,30,55,30,'url(#navy)',8,P['ink'],6)+PATH('M98 62 L155 62 L174 92 L178 234 Q174 252 154 253 L95 253 Q76 245 79 225 L81 105Z','#99DFF5',P['ink'],9)+R(78,131,101,61,'url(#yellow)',5,P['ink'],4)+E(109,98,14,30,P['white'],op=.4)
 elif n=='fragile_crate':
  o=R(28,80,195,170,P['wood2'],8,P['ink'],10)+R(52,104,146,122,'#DFA566',4,P['ink'],4)+LINE(55,108,196,220,P['wood'],14)+LINE(192,110,57,220,P['wood'],14)+R(90,122,73,67,'url(#cream)',8,P['ink'],5)+PATH('M125 132 L125 177 M104 150 L125 131 L148 150','none',P['red'],9)
 elif n=='flowers':
  o=PATH('M77 104 L180 104 L163 251 L96 251Z','url(#cream)',P['ink'],9)+PATH('M126 104 L126 41 M126 89 L81 48 M127 72 L167 27','none','#438C49',12)
  for x,y,col in [(78,42,P['red']),(128,30,P['yellow']),(170,25,P['purple'])]:
   for j in range(5):
    a=j*2*math.pi/5;o+=E(round(x+12*math.cos(a),1),round(y+12*math.sin(a),1),11,11,col)
   o+=C(x,y,8,P['cream'])
 elif n=='icecream':
  o=PATH('M85 137 L167 137 L127 252Z','#C98948',P['ink'],9)+PATH('M79 137 Q40 88 85 65 Q91 21 135 36 Q181 31 180 83 Q206 120 170 147Z','#FFF8EA',P['ink'],8)+C(135,37,12,P['red'],P['ink'],4)
 elif n=='noodles':
  o=PATH('M49 135 L210 135 L191 245 L68 245Z','url(#danger)',P['ink'],9)+E(129,139,82,26,'#FFF0CC',P['ink'],8)
  for i in range(5):o+=PATH(f'M{67+i*27} 132 q12 -30 25 -10','none','#F5C74A',9)
  o+=PATH('M168 123 L229 50','none',P['wood'],9)
 return o
for name in ['coffee','coffee_tray','pizza_box','pizza_slice','cake','eggs','sushi','parcel','grocery_bag','watermelon','bottle','fragile_crate','flowers','icecream','noodles']:
 asset('04_CARGO',name,260,280,food(name),notes='Visual sprite; cargo durability is computed by gameplay physics, not by artwork.')

# World props

def prop(n):
 s='';
 if n=='traffic_cone':
  s=E(140,228,108,14,P['navy'],op=.2)+R(49,207,182,26,'url(#navy)',10,P['ink'],8)+PATH('M138 27 L208 205 L72 205Z','#FF861A',P['ink'],11)+PATH('M106 123 L171 123 L183 155 L93 155Z',P['cream'])+PATH('M121 77 L156 77 L164 99 L113 99Z',P['cream'])
 elif n=='barrier':
  s=R(30,74,250,100,'url(#cream)',12,P['ink'],10)
  for x in range(-10,280,60):s+=POLY(f'{x},169 {x+40},74 {x+76},74 {x+33},174','#FF9D21')
  s+=R(22,70,266,106,'none',12,P['ink'],9)+LINE(70,174,64,242,P['ink'],14)+LINE(235,176,244,244,P['ink'],14)
 elif n=='road_barrier_black':
  s=R(22,100,275,106,'#505C68',18,P['ink'],10)
  for x in range(40,280,66):s+=POLY(f'{x},113 {x+25},113 {x+72},194 {x+45},194',P['yellow'])
  s+=R(22,100,275,106,'none',18,P['ink'],8)
 elif n=='wood_ramp':
  s=PATH('M20 230 L290 108 L290 230Z','#80471F',P['ink'],10)+PATH('M18 210 L284 90 L300 121 L37 240Z','#DFA257',P['ink'],10)
  for x in [78,125,171,217,260]:s+=LINE(x,174-x*.22,x+12,202-x*.22,P['wood'],6)
 elif n=='wood_plank':
  s=PATH('M35 166 L281 115 L289 155 L44 209Z','#DB9451',P['ink'],9)+PATH('M52 167 L270 125','none','#F9C27A',8)
  for x in [65,250]:s+=C(x,174 if x==65 else 140,5,P['ink'])
 elif n=='crate':
  s=R(61,69,184,177,'#DCA469',9,P['ink'],11)+R(81,91,144,133,'#CF8B4F',4,P['ink'],5)+LINE(89,96,218,219,P['wood'],17)+LINE(214,95,90,215,P['wood'],17)
 elif n=='barrel':
  s=R(86,42,138,212,'#D94936',20,P['ink'],11)+E(155,43,69,20,'#EA6954',P['ink'],11)+E(155,251,68,18,'#A52626',P['ink'],7)+R(89,91,132,19,'url(#metal)',5,P['ink'],6)+R(89,187,132,18,'url(#metal)',5,P['ink'],6)
 elif n=='tire_stack':
  for y in [199,145,91]:s+=E(150,y,92,36,'#28303D',P['ink'],12)+E(150,y-14,63,19,'#4A5361',P['ink'],6)+E(150,y-14,28,11,P['navy'],P['ink'],5)
 elif n=='speed_bump':
  s=PATH('M15 216 Q136 91 292 216 L293 236 L18 236Z',P['ink'],P['ink'],7)
  for x in [55,122,185,252]:s+=POLY(f'{x-25},210 {x},176 {x+25},210',P['yellow'])
 elif n=='pothole':
  s=E(150,202,130,41,'#292F3D',P['ink'],9)+PATH('M68 195 Q122 159 221 195','none','#5C6371',12)+E(130,218,83,14,'#629DB6',op=.5)
 elif n=='manhole':
  s=E(154,177,111,64,'url(#metal)',P['ink'],10)+E(154,176,87,45,P['charcoal'],P['ink'],7)
  for x in [102,143,184]:s+=LINE(x,146,x,208,'#8895A4',7)
 elif n=='brick_stack':
  s=R(35,95,251,149,'#B6543C',6,P['ink'],11)
  for y in [140,187]:s+=LINE(37,y,284,y,'#E7A082',8)
  for x in [100,170,240]:s+=LINE(x,99,x,136,'#E7A082',6)+LINE(x-34,144,x-34,183,'#E7A082',6)+LINE(x,192,x,240,'#E7A082',6)
 elif n=='concrete_block':
  s=PATH('M49 106 L227 86 L282 128 L282 236 L89 249 L50 216Z','#A5ACAD',P['ink'],10)+PATH('M49 107 L89 145 L282 129 M89 145 L89 248','none','#687483',9)+LINE(111,172,207,171,'#C3D0D2',8)
 elif n=='trash_bin':
  s=R(80,81,139,165,'#32835F',10,P['ink'],10)+R(64,60,172,29,P['charcoal'],8,P['ink'],8)+R(104,35,88,28,P['charcoal'],7,P['ink'],6)+LINE(114,107,114,222,'#6ACD91',9)+LINE(184,107,184,222,'#6ACD91',9)
 elif n=='bench':
  s=R(40,99,240,45,P['wood2'],8,P['ink'],8)+R(51,50,218,33,P['wood2'],7,P['ink'],7)+R(51,154,221,28,P['wood2'],7,P['ink'],7)+LINE(81,177,75,255,P['ink'],13)+LINE(249,177,255,255,P['ink'],13)
 elif n=='bollard':
  s=R(110,48,80,206,P['charcoal'],23,P['ink'],10)+R(110,104,80,44,P['yellow'],7)+E(150,51,38,11,'url(#metal)',P['ink'],7)
 elif n=='road_sign':
  s=LINE(145,98,145,259,P['charcoal'],15)+POLY('143,25 263,225 23,225',P['cream'],P['red'],18)+PATH('M111 168 Q145 121 179 168','none',P['ink'],13)+PATH('M105 186 Q143 147 184 186','none',P['ink'],8)
 elif n=='arrow_sign':
  s=LINE(148,88,148,259,P['charcoal'],14)+R(35,27,231,126,'#4599D8',17,P['cream'],12)+PATH('M75 84 L205 84 M171 50 L215 84 L171 119','none',P['cream'],17)
 elif n=='street_lamp':
  s=LINE(160,100,160,268,P['ink'],16)+PATH('M160 118 Q151 33 230 39','none',P['ink'],15)+PATH('M201 44 L260 43 L249 99 L219 100Z','url(#metal)',P['ink'],8)+PATH('M210 99 Q229 135 249 100','none',P['yellow'],7)
 elif n=='bush':
  for x,y,r in [(72,194,61),(117,155,72),(186,175,74),(237,199,53)]:s+=C(x,y,r,'#478E45',P['ink'],7)+C(x-10,y-16,r*.73,'#83CE4F')
  s+=R(45,223,222,29,'#487B38',5)
 elif n=='tree':
  s=PATH('M136 105 L171 105 L197 268 L103 268Z','#8A5637',P['ink'],10)
  for x,y,r in [(82,107,58),(133,62,80),(204,92,64),(160,126,72)]:s+=C(x,y,r,'#388B54',P['ink'],6)+C(x-10,y-13,r*.72,'#78C457')
 elif n=='hydrant':
  s=R(118,107,74,155,'#E44E39',20,P['ink'],10)+R(87,135,136,42,'#D94D37',12,P['ink'],9)+E(155,103,52,24,P['red'],P['ink'],9)+C(155,87,21,'#FAC35C',P['ink'],7)+R(110,207,94,26,P['charcoal'],7)
 elif n=='construction_fence':
  s=R(25,89,272,162,'#DCE1E5',6,P['ink'],10)
  for y in range(105,247,25):s+=LINE(40,y,284,y,'#A0AFC1',6)
  for x in range(50,285,25):s+=LINE(x,102,x,234,'#A0AFC1',5)
  s+=LINE(41,239,40,270,P['ink'],12)+LINE(279,238,281,272,P['ink'],12)
 elif n=='ladder':
  s=LINE(72,45,102,262,P['wood'],17)+LINE(215,45,185,262,P['wood'],17)
  for y in [75,110,145,180,215]:s+=LINE(85,y,203,y,P['wood2'],12)
 elif n=='wood_pallet':
  for y in [86,131,176,221]:s+=R(26,y,259,29,'#BE753B',5,P['ink'],6)
  for x in [63,239]:s+=R(x,81,22,185,'#8C4E2A',4)
 elif n=='construction_sack':
  s=PATH('M75 90 Q49 57 103 36 L175 36 Q221 61 196 103 L236 226 Q175 266 63 225Z','#D7C6AD',P['ink'],10)+PATH('M94 81 Q151 98 186 78','none','#9A8F82',10)+T(147,190,'25',62,P['gray'])
 elif n=='stair_section':
  s=PATH('M29 235 L29 192 L96 192 L96 147 L159 147 L159 106 L223 106 L223 66 L282 66 L282 242Z','#9BA7B3',P['ink'],10)
  for x,y in [(29,192),(96,147),(159,106),(223,66)]:s+=LINE(x,y,x+60,y,P['cream'],7)
 return s
props=['traffic_cone','barrier','road_barrier_black','wood_ramp','wood_plank','crate','barrel','tire_stack','speed_bump','pothole','manhole','brick_stack','concrete_block','trash_bin','bench','bollard','road_sign','arrow_sign','street_lamp','bush','tree','hydrant','construction_fence','ladder','wood_pallet','construction_sack','stair_section']
for p in props:asset('05_WORLD/props',p,320,280,prop(p))

# Tiles
for n in ['asphalt','asphalt_cracked','wet_asphalt','concrete','sidewalk','dirt','grass','bricks','wood','metal','snow','ice','hazard','gravel']:
 color={'asphalt':'#454C5A','asphalt_cracked':'#454C5A','wet_asphalt':'#37445D','concrete':'#9DAAB4','sidewalk':'#B5BCC3','dirt':'#98643F','grass':'#9A673E','bricks':'#AE5C48','wood':'#B9743D','metal':'#647688','snow':'#B2CBDD','ice':'#8BC3DD','hazard':'#2A3545','gravel':'#687078'}[n]
 s=R(0,20,512,140,color)
 if n=='grass':s+=PATH('M0 38 Q55 25 96 34 T190 28 T289 31 T398 31 T512 37 L512 66 L0 66Z','#5AA944')+LINE(0,60,512,60,'#95D469',9)
 if n in ['asphalt','asphalt_cracked','wet_asphalt','concrete','sidewalk','snow','ice','gravel']:
  s+=R(0,20,512,9,{'asphalt':'#677383','wet_asphalt':'#829CB7','snow':'#F0F7FD','ice':'#C5EFF7'}.get(n,'#D9DFE5'))
 if n=='bricks':
  for y in [60,110]:s+=LINE(0,y,512,y,'#E4A18C',6)
  for x in range(0,512,64):s+=LINE(x,21,x,58,'#E4A18C',4)+LINE(x+32,63,x+32,108,'#E4A18C',4)
 if n=='wood':
  for y in [60,105]:s+=LINE(0,y,512,y,'#764620',8)
  for x in [100,225,380]:s+=C(x,80,7,'#714A2C')
 if n=='hazard':
  for x in range(-80,620,112):s+=POLY(f'{x},20 {x+47},20 {x+165},160 {x+117},160',P['yellow'])
 if n=='asphalt_cracked':s+=PATH('M75 25 L105 78 L85 105 L126 156 M324 30 L312 65 L349 78 L320 121','none','#273140',4)
 if n=='wet_asphalt':s+=E(190,106,115,18,'#7ABBEA',op=.4)+E(395,140,70,8,'#98D7FF',op=.3)
 if n=='ice':s+=PATH('M34 64 L154 99 L277 67 L431 111','none','#DBF8FE',7,0.5)
 if n=='snow':s+=PATH('M0 39 Q70 8 125 30 T255 32 T395 24 T512 34','none',P['white'],19)
 if n=='metal':
  for x in [20,160,300,440]:s+=C(x,44,5,'#B9D0D9')+C(x,133,5,'#B9D0D9')
 if n=='gravel':
  for x,y in [(35,76),(86,128),(130,80),(195,96),(252,138),(310,63),(371,120),(455,68)]:s+=E(x,y,16,8,'#4A5565')
 asset('05_WORLD/tiles',n+'_512x160',512,160,s,notes='Visual tile. Collision geometry MUST be authored separately; repeats horizontally, test seams.')

# Icons as editable vector paths, consistent stroke
IC={'play':'M23 13 L54 32 L23 51Z','pause':'M19 12 H28 V52 H19Z M39 12 H48 V52 H39Z','home':'M10 31 L32 12 L54 31 M17 29 V52 H47 V29 M27 52 V38 H38 V52',
'back':'M40 14 L22 32 L40 50 M24 32 H54','forward':'M24 14 L42 32 L24 50 M42 32 H10','replay':'M48 18 A24 24 0 1 0 52 38 M48 18 V5 M48 18 H35',
'gear':'M32 10 L38 14 L46 11 L52 19 L48 26 L54 32 L48 38 L52 46 L44 53 L37 49 L31 55 L24 49 L16 52 L11 44 L15 38 L9 32 L15 26 L12 18 L20 12 L26 16Z M32 24 A8 8 0 1 0 32 40 A8 8 0 1 0 32 24',
'garage':'M10 28 L32 12 L54 28 V53 H10Z M19 37 H45 V53 H19Z M19 31 H45','orders':'M20 13 H45 V54 H14 V18Z M23 28 H37 M23 37 H37 M23 46 H32 M18 12 H26',
'coin':'M32 6 A26 26 0 1 0 32 58 A26 26 0 1 0 32 6 M32 16 V48 M40 22 Q23 14 22 27 Q23 33 37 33 Q48 42 25 47',
'star':'M32 8 L40 24 L57 27 L44 40 L47 57 L32 49 L17 57 L20 40 L7 27 L24 24Z',
'check':'M10 34 L26 49 L55 14','close':'M14 14 L50 50 M50 14 L14 50','plus':'M32 8 V56 M8 32 H56',
'minus':'M8 32 H56','clock':'M32 7 A25 25 0 1 0 32 57 A25 25 0 1 0 32 7 M32 15 V33 L46 40',
'shield':'M32 8 L52 16 V34 Q50 49 32 57 Q14 49 12 34 V16Z M22 32 L29 39 L42 25',
'heart':'M32 54 Q8 39 8 25 A12 12 0 0 1 32 17 A12 12 0 0 1 56 25 Q56 39 32 54',
'lock':'M18 27 V20 A14 14 0 0 1 46 20 V27 M15 27 H49 V55 H15Z',
'unlock':'M18 27 V20 A14 14 0 0 1 46 20 M15 27 H49 V55 H15Z',
'box':'M9 18 L32 7 L55 18 V47 L32 58 L9 47Z M9 18 L32 31 L55 18 M32 31 V58 M23 11 L44 23',
'warning':'M32 8 L59 55 H5Z M32 26 V40 M32 48 V49',
'forward_fast':'M13 17 L29 32 L13 47Z M34 17 L50 32 L34 47Z',
'bike':'M18 46 A11 11 0 1 0 18 24 A11 11 0 1 0 18 46 M49 46 A11 11 0 1 0 49 24 A11 11 0 1 0 49 46 M18 35 L31 16 L49 35 L18 35 M31 16 L25 16 M31 16 L38 12',
'wrench':'M48 10 A15 15 0 0 0 31 28 L12 47 A8 8 0 0 0 23 58 L42 39 A15 15 0 0 0 58 22 L47 31 L39 23Z',
'bolt':'M36 5 L12 36 H31 L27 59 L54 25 H35Z',
'music':'M24 20 L49 12 V43 M24 20 V47 M49 12 L49 43 M24 47 A8 6 0 1 1 10 47 A8 6 0 1 1 24 47 M49 43 A8 6 0 1 1 35 43 A8 6 0 1 1 49 43',
'sound':'M9 24 H20 L35 12 V52 L20 40 H9Z M44 23 Q55 32 44 41 M49 15 Q65 32 49 49',
'mute':'M9 24 H20 L35 12 V52 L20 40 H9Z M43 23 L56 42 M56 23 L43 42',
'flag':'M17 7 V57 M17 10 Q31 4 45 10 L45 34 Q30 27 17 34',
'pin':'M32 7 C5 7 11 39 32 58 C53 39 59 7 32 7Z M32 22 A10 10 0 1 0 32 42 A10 10 0 1 0 32 22',
'gift':'M10 29 H54 V54 H10Z M8 20 H56 V30 H8Z M32 20 V55 M31 20 Q15 18 16 8 Q25 0 32 20 Q45 0 51 9 Q50 18 31 20',
'trophy':'M19 11 H45 V27 Q45 46 32 46 Q19 46 19 27Z M19 17 H8 Q7 38 23 35 M45 17 H56 Q56 38 42 35 M32 46 V54 M20 54 H44',
'helmet':'M9 37 Q10 13 32 11 Q54 13 55 37 H12 M16 37 L18 50 H48 L52 37 M29 34 H51',
'bag':'M15 24 H49 V56 H15Z M23 24 V15 Q23 7 32 7 Q41 7 41 15 V24 M18 36 H46',
'cart':'M8 13 H15 L23 43 H50 L57 22 H18 M27 55 A3 3 0 1 0 27 49 A3 3 0 1 0 27 55 M47 55 A3 3 0 1 0 47 49 A3 3 0 1 0 47 55',
'chevron_up':'M12 42 L32 22 L52 42','chevron_down':'M12 22 L32 42 L52 22',
'info':'M32 6 A26 26 0 1 0 32 58 A26 26 0 1 0 32 6 M32 27 V45 M32 18 V19',
'crown':'M8 19 L19 31 L31 11 L44 31 L56 19 L51 52 H13Z',
'hand':'M20 36 V20 Q20 14 25 14 Q31 14 31 20 V12 Q31 6 37 6 Q43 6 43 13 V24 Q43 18 49 18 Q56 18 56 24 V41 Q56 55 42 58 H31 Q19 57 9 44 Q2 31 10 28 Q15 26 20 36Z',
'speed':'M13 47 Q5 35 13 22 Q31 3 51 22 Q59 35 51 47 M32 35 L47 18 M16 50 H49',
'brake':'M32 8 A24 24 0 1 0 32 56 A24 24 0 1 0 32 8 M32 19 V45 M19 32 H45',
'lean':'M9 47 Q32 5 54 45 M14 42 L10 49 L19 51',
'camera':'M12 19 H22 L27 12 H41 L45 19 H55 V52 H9 V19Z M32 25 A11 11 0 1 0 32 47 A11 11 0 1 0 32 25',
}
for name,d in IC.items():
 s=PATH(d,'none',P['cream'],4.8)
 # some enclosed paths produce no fill but good line icons
 asset('06_UI/icons',name,64,64,s,notes='Line icon. Tint in runtime or use as supplied cream-colored PNG.')

# UI skins
for style,grad in [('primary','url(#yellow)'),('secondary','url(#cream)'),('dark','url(#navy)'),('success','url(#lime)'),('danger','url(#danger)')]:
 for state in ['normal','pressed','disabled']:
  y=25 if state=='normal' else 36 if state=='pressed' else 29
  fill=grad if state!='disabled' else '#7D8898'
  s=R(13,y+8,474,114,P['ink'],36,opacity=.45)+R(11,y,478,111,fill,35,P['ink'],9)
  if state!='disabled':s+=PATH(f'M43 {y+36} Q224 {y-3} 458 {y+31}','none',P['white'],11,.4)
  if state=='disabled':s+=R(20,y+10,460,93,'#4F5B6A',30,opacity=.55)
  asset('06_UI/buttons',f'button_{style}_{state}',500,175,s,notes='Empty graphic skin; place labels/icons with Phaser or React. Nine-slice: left/right 46px, top/bottom 42px.',extra={'nine_slice':[46,42,46,42]})
for style,fill in [('yellow','url(#yellow)'),('cream','url(#cream)'),('dark','url(#navy)'),('red','url(#danger)')]:
 for state in ['normal','pressed']:
  s=R(12,18,110,108,P['ink'],29,opacity=.4)+R(8,6 if state=='normal' else 14,112,109,fill,28,P['ink'],9)+PATH('M25 35 Q56 11 99 34','none',P['white'],7,.45)
  asset('06_UI/buttons',f'square_{style}_{state}',132,140,s,notes='Empty square icon-button skin; icons should be separate.')

panels={
'panel_dark':(540,350,R(17,25,505,306,P['ink'],37,opacity=.4)+R(9,10,520,308,'url(#navy)',34,P['ink'],11)+PATH('M40 42 H497','none','#64758B',6,.5)),
'panel_cream':(540,350,R(15,25,510,310,P['navy'],34,opacity=.23)+R(8,8,524,317,'url(#cream)',32,P['ink'],9)+PATH('M43 39 H498','none',P['white'],8,.65)),
'panel_header':(700,130,R(9,10,680,108,'url(#navy)',29,P['ink'],9)+PATH('M35 39 H656','none','#77859A',6,.6)),
'hud_pill':(440,120,R(8,8,422,100,'url(#navy)',46,P['cream'],7)),
'ribbon_yellow':(600,160,PATH('M22 40 L577 40 L558 82 L578 120 L25 120 L42 81Z','url(#yellow)',P['ink'],9)+PATH('M57 56 H539','none',P['cream'],10,.6)),
'ribbon_purple':(600,160,PATH('M22 40 L577 40 L558 82 L578 120 L25 120 L42 81Z',P['purple'],P['ink'],9)),
'progress_track':(500,90,R(9,15,482,60,'url(#navy)',28,P['ink'],8)),
'progress_fill_green':(500,90,R(12,13,475,56,'url(#lime)',26,P['ink'],5)+PATH('M34 32 H453','none',P['cream'],8,.45)),
'progress_fill_yellow':(500,90,R(12,13,475,56,'url(#yellow)',26,P['ink'],5)+PATH('M34 32 H453','none',P['cream'],8,.35)),
'progress_fill_red':(500,90,R(12,13,475,56,'url(#danger)',26,P['ink'],5)+PATH('M34 32 H453','none',P['cream'],8,.35)),
'game_hud_panel':(850,115,R(8,14,834,89,'url(#navy)',32,P['cream'],6)+LINE(32,34,809,34,'#738194',5,.3)),
'menu_tab_active':(360,110,R(10,12,342,87,'url(#yellow)',26,P['ink'],7)),
'menu_tab_inactive':(360,110,R(10,12,342,87,'url(#navy)',26,P['ink'],7)),
'star_holder':(400,110,R(12,8,376,94,'url(#navy)',47,P['ink'],7))
}
for n,(w,h,s) in panels.items():asset('06_UI/panels',n,w,h,s,notes='Unlabeled scalable UI element. Use nine-slicing for corners when resizing.')

# FX
FX={
'splash':PATH('M15 131 Q82 89 134 111 Q177 53 247 123 Q219 142 158 147 L169 194 L131 165 L100 219 L87 155 Q41 167 15 131Z','#5AC3FC',P['cream'],9)+E(180,62,13,29,'#6ABDF0')+E(62,55,11,19,'#6ABDF0')+C(239,61,12,'#6ABDF0'),
'dust':E(65,179,44,35,'#BFC4CB')+E(124,146,62,56,'#D8DDE1')+E(189,173,51,43,'#BDC7D0')+E(237,187,35,26,'#E7E8E9'),
'impact':POLY('150,2 184,90 285,47 234,146 308,235 197,221 150,308 113,223 7,243 70,148 15,48 122,88',P['yellow'],P['ink'],11),
'speedlines':''.join([PATH(f'M{20+i*5} {45+i*55} L{270-i*14} {39+i*55}','none',P['cream'],max(3,14-i*2),0.9) for i in range(5)]),
'confetti':''.join([POLY(f'{x},{y} {x+18},{y-3} {x+12},{y+26} {x-5},{y+19}',[P['yellow'],P['red'],P['blue'],P['lime'],P['purple']][i%5]) for i,(x,y) in enumerate([(20,38),(84,120),(165,26),(234,92),(143,196),(73,243),(264,234)])]),
'glint':PATH('M150 5 L173 126 L293 150 L172 172 L150 293 L126 170 L5 150 L127 126Z',P['cream']),
'warning':E(150,150,132,132,'#FFCB3A',op=.24)+PATH('M150 16 L274 253 H26Z','url(#yellow)',P['red'],13)+T(150,219,'!',140,P['ink']),
'spark':PATH('M150 18 L161 111 L250 63 L190 145 L277 193 L177 182 L145 282 L130 179 L27 223 L107 151 L35 77 L135 117Z','#FEC741',P['orange'],6),
'leaf':PATH('M22 213 Q45 46 267 28 Q270 205 22 213Z','#67BA53',P['ink'],6)+PATH('M25 221 L245 44','none','#D6F68B',11),
}
for n,s in FX.items():asset('07_FX',n,320,320,s)

# background layers 4 scenes x 4 layers; procedural original stylized SVG, seamless horizontal-ish

def bg_layer(scene,layer,seed):
 r=random.Random(seed);W,H=2048,1024
 winter=scene=='winter';evening=scene=='evening'; construction=scene=='construction'
 if layer=='sky':
  s=R(0,0,W,H, 'url(#sky_winter)' if winter else 'url(#sky_evening)' if evening else 'url(#sky)')
  s+=C(1720,180,93,'#F1E7CF' if evening else '#FEF7CF',op=.7)
  for _ in range(20):
   x=r.randint(0,W);y=r.randint(50,540); sz=r.randint(34,95)
   s+=E(x,y,sz*1.5,sz*.47,'#F3F9FD',op=.55 if evening else .72)+E(x+sz*.7,y-20,sz*.9,sz*.5,'#F8FEFF',op=.6)
  return s
 if layer=='far':
  s=''
  for x in range(-10,W+200,140):
   h=r.randint(180,390);bw=r.randint(126,160);y=950-h
   fill=('#5E739A' if evening else '#9FB5D0' if winter else '#8FAED0')
   s+=R(x,y,bw,h,fill,3,opacity=.55)
   for xx in range(x+14,x+bw-10,26):
    for yy in range(y+25,950,40):s+=R(xx,yy,12,20,'#D6E4F0' if not evening else '#E6C7AE',1,opacity=.4)
  return s
 if layer=='mid':
  s='';x=-80
  while x<W+90:
   bw=r.randint(230,345); bh=r.randint(330,620); y=1015-bh
   fill=r.choice(['#D2D5D6','#C9BEAE','#E4D3BE','#C7D4D3']) if not evening else r.choice(['#8E8BA0','#ADA7AC','#776F88'])
   if winter:fill=r.choice(['#B7CBD4','#DCE4EB','#9FB9C9'])
   if construction:fill=r.choice(['#C4B6A5','#D4C5B0','#A8A6A2'])
   s+=R(x,y,bw,bh,fill,2,'#72818B',3)
   s+=R(x+6,y+5,bw-12,10,'#F7E2BC' if not winter else '#E8F6FF',2)
   for colx in range(x+23,x+bw-25,58):
    for yy in range(y+35,990,75):
     if r.random()<.05:continue
     glass='#769FBE' if not evening else '#F7CA91'
     s+=R(colx,yy,35,39,glass,2,'#ECF2EE',5)+LINE(colx+18,yy+2,colx+18,yy+37,'#E5F3FF',3)+R(colx-4,yy+40,43,9,'#8B9191')
   if construction:
    s+=PATH(f'M{x+50} {y} L{x+50} {y-130} L{x+225} {y-135} M{x+85} {y-130} L{x+85} {y+20}','none','#D1A447',9)
   x+=bw-8
  return s
 if layer=='near':
  s='';
  # Near foliage always transparency and no collision
  for x in range(90,W+200,410):
   off=r.randint(-55,55);sx=x+off
   if construction:
    s+=R(sx,748,140,230,'#79878D',3,opacity=.55)+R(sx+10,738,155,18,'#C5C9C3',2)
   else:
    s+=PATH(f'M{sx+35} 745 L{sx+76} 745 L{sx+85} 1006 L{sx+20} 1006Z','#806450')
    for xx,yy,rr in [(sx+23,730,100),(sx+97,707,116),(sx+57,647,115)]:
     s+=C(xx,yy,rr,'#6EA9A5' if winter else '#3D8056' if evening else '#448E4A',op=.92)+C(xx-25,yy-20,rr*.72,'#BDCFCA' if winter else '#87C55C',op=.65)
     if winter:s+=E(xx,yy-rr*.7,rr*.8,12,'#E8FAFF',op=.9)
  if construction:
   s+=PATH('M0 925 H2048','none','#BB966D',12)
  return s

for sc in ['courtyard','construction','winter','evening']:
 for i,layer in enumerate(['sky','far','mid','near']):
  p=asset(f'05_WORLD/backgrounds/{sc}',layer,2048,1024,bg_layer(sc,layer,333+i*37+['courtyard','construction','winter','evening'].index(sc)*811),notes='Parallax layer. Do not use collisions from artwork. Background layers are for visual depth only.',extra={'parallax_factor':{'sky':0,'far':0.15,'mid':0.35,'near':0.6}[layer],'scene':sc,'layer':layer})

# original AI transparent sheet cutouts
sheet=Path('/mnt/data/a_clean_high_detail_vector_style_cartoon_illustra.png')
if sheet.exists():
 image=Image.open(sheet).convert('RGBA')
 cropdefs={
 'scooter_full_ai_reference':(9,84,395,464),
 'rider_on_scooter_ai_reference':(395,68,791,470),
 'rider_seated_ai_reference':(784,70,1165,464),
 'rider_surprised_ai_reference':(1144,58,1536,459),
 'rider_crouch_ai_reference':(26,527,402,1006),
 'rider_standing_ai_reference':(410,504,791,1018),
 'backpack_ai_reference':(785,550,1144,1008),
 'wheel_ai_reference':(1135,548,1525,1019),
 }
 d=OUT/'02_CHARACTERS_AI_PNG';d.mkdir(parents=True,exist_ok=True)
 for n,bb in cropdefs.items():
  im=image.crop(bb)
  al=im.getchannel('A');threshold=al.point(lambda z: 0 if z<8 else z);box=threshold.getbbox()
  if box:im=im.crop(box)
  im.save(d/(n+'.png'))
  manifest.append({'path':str((d/(n+'.png')).relative_to(OUT)),'size':list(im.size),'category':'02_CHARACTERS_AI_PNG','source':'AI-generated illustration, manual crop','runtime_usable':True,'notes':'Transparent 2D concept sprite. Poses are NOT frame-consistent animation frames or rigged parts. For final production, redraw/rig as needed.'})
 # also copy original full source sheet
 (OUT/'00_REFERENCES').mkdir(exist_ok=True)
 shutil.copy2(sheet,OUT/'00_REFERENCES'/'character_sheet_uncut.png')

# copy earlier concept art and AI boards
source_refs=[
('/mnt/data/не_разлей_курьерский_переполох.png','concept_splash_v1.png'),
('/mnt/data/меню_игры_не_разлей.png','concept_main_menu_v1.png'),
('/mnt/data/яркая_доставка_кофе_на_грани.png','concept_gameplay_v1.png'),
('/mnt/data/гараж_курьера_улучшение_скутера.png','concept_garage_v1.png'),
('/mnt/data/a_vibrant_highly_detailed_stylized_2d_cartoon_ga.png','concept_splash_clean_v2.png'),
('/mnt/data/a_vivid_highly_polished_cartoon_3d_like_vector_il.png','concept_main_menu_clean_v2.png'),
('/mnt/data/a_comprehensive_polished_colorful_game_asset_pac.png','moodboard_system_a.png'),
('/mnt/data/a_highly_detailed_game_asset_complete_ui_art_pac.png','moodboard_system_b.png'),
('/mnt/data/a_large_highly_detailed_game_art_asset_pack_ui.png','moodboard_system_c.png')]
for a,b in source_refs:
 if Path(a).exists():shutil.copy2(a,OUT/'00_REFERENCES'/b)

# make a real gameplay composition from layered backgrounds and transparent assets
prev=OUT/'09_PREVIEW';prev.mkdir(exist_ok=True)
font_candidates=['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
font=font_candidates[0]
def resize_contain(im, size):
 im=im.copy();im.thumbnail(size,Image.Resampling.LANCZOS);return im

def load(rel): return Image.open(OUT/rel).convert('RGBA')
def composite_obj(dst,rel,box):
 im=load(rel);w,h=box[2:];im=resize_contain(im,(w,h));dst.alpha_composite(im,(int(box[0]+(w-im.width)//2),int(box[1]+(h-im.height)//2)))

def draw_text(d,xy,s,size,fill,stroke='#172338',st=0):
 f=ImageFont.truetype(font,size)
 d.text(xy,s,font=f,fill=fill,stroke_width=st,stroke_fill=stroke)

bg=Image.new('RGBA',(1600,900),(0,0,0,0))
for layer in ['sky','far','mid','near']:
 im=load(f'05_WORLD/backgrounds/courtyard/{layer}.png').resize((1600,900),Image.Resampling.LANCZOS);bg.alpha_composite(im)
# road overlay track using PIL polygons
D=ImageDraw.Draw(bg)
D.polygon([(0,665),(200,665),(320,610),(470,610),(600,675),(740,675),(870,570),(1000,570),(1150,690),(1600,690),(1600,900),(0,900)],fill='#485362',outline='#182135',width=8)
D.line([(0,665),(200,665),(320,610),(470,610),(600,675),(740,675),(870,570),(1000,570),(1150,690),(1600,690)],fill='#A3B1BB',width=10)
for x in range(40,1500,200):D.rounded_rectangle((x,795,x+70,810),8,fill='#F7D253')
composite_obj(bg,'05_WORLD/props/traffic_cone.png',(1044,490,85,125))
composite_obj(bg,'05_WORLD/props/wood_ramp.png',(1280,500,290,190))
composite_obj(bg,'05_WORLD/props/wood_pallet.png',(700,620,180,140))
composite_obj(bg,'02_CHARACTERS_AI_PNG/rider_on_scooter_ai_reference.png',(350,365,465,315))
composite_obj(bg,'06_UI/panels/hud_pill.png',(900,28,270,68))
composite_obj(bg,'06_UI/panels/progress_track.png',(85,35,320,57))
composite_obj(bg,'06_UI/panels/progress_fill_green.png',(90,39,290,47))
composite_obj(bg,'06_UI/buttons/square_dark_normal.png',(1475,20,91,91))
composite_obj(bg,'06_UI/icons/pause.png',(1494,42,53,53))
for i,x in enumerate([60,220,1215,1395]):
 composite_obj(bg,'06_UI/buttons/square_dark_normal.png',(x,728,135,140))
 composite_obj(bg,'06_UI/icons/'+['lean','brake','speed','lean'][i]+'.png',(x+35,766,65,65))
d=ImageDraw.Draw(bg)
draw_text(d,(106,49),'КОФЕ  94%',23,'white',st=2)
draw_text(d,(952,48),'00:28.42',22,'white',st=2)
composite_obj(bg,'06_UI/icons/star.png',(1230,23,63,63))
composite_obj(bg,'06_UI/icons/star.png',(1282,23,63,63))
composite_obj(bg,'06_UI/icons/star.png',(1334,23,63,63))
bg.convert('RGB').save(prev/'gameplay_landscape_reference.jpg',quality=90,optimize=True)

# mock menu using generated concept top? crop and overlay fresh UI
menu=Image.new('RGBA',(900,1600),'#7CC6FF')
src=Image.open('/mnt/data/a_vibrant_highly_detailed_stylized_2d_cartoon_ga.png').convert('RGB') if Path('/mnt/data/a_vibrant_highly_detailed_stylized_2d_cartoon_ga.png').exists() else None
if src:
 src=ImageOps.fit(src,(900,1600),method=Image.Resampling.LANCZOS)
 menu.alpha_composite(src.convert('RGBA'))
# large translucent shade bottom to increase readability
sh=Image.new('RGBA',(900,600),(10,17,28,0));sda=ImageDraw.Draw(sh)
for y in range(600):sda.line([(0,y),(900,y)],fill=(10,15,27,int(210*y/600)))
menu.alpha_composite(sh,(0,1000))
composite_obj(menu,'01_BRAND/logo_full.png',(100,90,700,400))
composite_obj(menu,'06_UI/buttons/button_primary_normal.png',(165,1030,565,180))
composite_obj(menu,'06_UI/buttons/button_secondary_normal.png',(92,1203,338,131))
composite_obj(menu,'06_UI/buttons/button_secondary_normal.png',(477,1203,338,131))
composite_obj(menu,'06_UI/buttons/button_dark_normal.png',(260,1347,376,135))
d=ImageDraw.Draw(menu);draw_text(d,(321,1096),'ИГРАТЬ',48,P['ink']);draw_text(d,(188,1243),'ГАРАЖ',31,P['ink']);draw_text(d,(548,1243),'ЗАКАЗЫ',31,P['ink']);draw_text(d,(344,1387),'НАСТРОЙКИ',24,P['cream'])
menu.convert('RGB').save(prev/'menu_portrait_reference.jpg',quality=88,optimize=True)

# Contact sheet with transparent items on tinted cards
assets_for_contact=[]
for sub in ['03_VEHICLES/parts','04_CARGO','05_WORLD/props','05_WORLD/tiles','06_UI/buttons','06_UI/icons','07_FX']:
 f=sorted((OUT/sub).glob('*.png'))
 assets_for_contact+=f[:20] if sub in ('06_UI/buttons','06_UI/icons') else f[:18]
card_w,card_h=238,196;columns=6
rows=math.ceil(len(assets_for_contact)/columns)
contact=Image.new('RGB',(columns*card_w,rows*card_h+115),'#101928');draw=ImageDraw.Draw(contact)
draw_text(draw,(40,22),'НЕ РАЗЛЕЙ!  /  ART KIT 01',42,P['cream'])
draw_text(draw,(40,78),f'{len(assets_for_contact)} selected assets  •  transparent PNG + editable SVG',17,'#BAC7D8')
for i,f in enumerate(assets_for_contact):
 x=(i%columns)*card_w;y=(i//columns)*card_h+115
 draw.rounded_rectangle((x+7,y+8,x+card_w-6,y+card_h-5),radius=18,fill='#283448',outline='#43536B',width=2)
 im=Image.open(f).convert('RGBA'); im.thumbnail((205,138),Image.Resampling.LANCZOS)
 contact.paste(im,(int(x+(card_w-im.width)/2),int(y+8+(139-im.height)/2)),im)
 name=f.stem.replace('_',' ')
 if len(name)>22:name=name[:21]+'…'
 draw_text(draw,(x+15,y+155),name,14,P['cream'])
contact.save(prev/'assets_contact_sheet.jpg',quality=87,optimize=True)

# compose alternate location strip preview
compare=Image.new('RGB',(1600,4*300),'#17253B')
D=ImageDraw.Draw(compare)
for idx,sc in enumerate(['courtyard','construction','winter','evening']):
 tmp=Image.new('RGBA',(1600,300))
 for layer in ['sky','far','mid','near']:
  im=load(f'05_WORLD/backgrounds/{sc}/{layer}.png').resize((1600,300),Image.Resampling.LANCZOS);tmp.alpha_composite(im)
 compare.paste(tmp.convert('RGB'),(0,idx*300))
 draw_text(D,(40,idx*300+16),sc.upper(),34,P['cream'],st=2)
compare.save(prev/'backgrounds_locations.jpg',quality=88)

# Metadata and codex usage instructions
meta=OUT/'10_FOR_CODEX';meta.mkdir(exist_ok=True)
(meta/'palette.json').write_text(json.dumps(P,ensure_ascii=False,indent=2),encoding='utf-8')
(meta/'manifest.json').write_text(json.dumps({'title':'Не Разлей! — visual asset kit v1','version':'1.0.0','build_date':'2026-11-17','assets':manifest},ensure_ascii=False,indent=2),encoding='utf-8')
(meta/'physics_art_anchors.json').write_text(json.dumps({'scooter_body_no_wheels':{'asset':'03_VEHICLES/parts/scooter_body_no_wheels.png','size':[700,370],'wheel_centers_px':[[170,286],[535,286]],'body_center_px':[350,185],'notes':'Visual reference anchors only. Planck physics fixture dimensions and transforms must be calibrated in-game.'},'wheel_side':{'asset':'03_VEHICLES/parts/wheel_side.png','size':[200,200],'center_px':[100,100]},'recommended_world_settings':{'pixels_per_meter':60,'simulation_step_seconds':0.0166666666667}},ensure_ascii=False,indent=2),encoding='utf-8')
(meta/'ui_nine_slice.json').write_text(json.dumps({'button_*':{'left':46,'top':42,'right':46,'bottom':42},'panel_dark':{'left':48,'top':48,'right':48,'bottom':48},'panel_cream':{'left':48,'top':48,'right':48,'bottom':48},'game_hud_panel':{'left':35,'top':35,'right':35,'bottom':35}},ensure_ascii=False,indent=2),encoding='utf-8')

readme='''# Не Разлей! — набор артов и визуальный фундамент v1

**Назначение:** исходники для Phaser + React + TypeScript; создан для ускорения работы Codex над 2D-аркадой курьерской доставки.

## Состав
- `00_REFERENCES/`: полноэкранные концепты и большие мудборды. **Это референсы, не готовые игровые интерфейсы.** Текст, кнопки и объекты на них сплющены в одно изображение.
- `01_BRAND/`: логотип и мастер иконки приложения — SVG + PNG.
- `02_CHARACTERS_AI_PNG/`: 8 прозрачных вырезок из AI-листа. Это игровые статичные cutouts/концепты. **Не использовать кадры как точную спрайтовую анимацию** — анатомия/ракурсы и позы различаются.
- `03_VEHICLES/parts/`: редактируемый раздельный скутер без колес, колёса, рюкзак, шлем и детали. Есть JSON c базовыми точками центров колёс.
- `04_CARGO/`: 15 самостоятельных PNG+SVG различных заказов и предметов.
- `05_WORLD/props/`: 27 препятствий и объектов городского окружения; каждое отдельно.
- `05_WORLD/tiles/`: 14 визуальных 512×160 тайлов поверхности.
- `05_WORLD/backgrounds/`: 4 локации × 4 прозрачных/непрозрачных слоя 2048×1024 для параллакса.
- `06_UI/icons/`: независимые 40+ контурных векторных иконок с PNG.
- `06_UI/buttons/`: кнопки и состояния (normal/pressed/disabled), отдельный текст добавлять в React/Phaser.
- `06_UI/panels/`: HUD, панели, табы, прогресс-бары и ленты.
- `07_FX/`: базовые эффекты (сплэш, искра, пыль, скорость, звездочки и др.).
- `09_PREVIEW/`: готовые примеры для визуального контроля (не для копирования как один интерфейс).
- `10_FOR_CODEX/`: манифест, палитра, якоря графики, рекомендации девелоперу.

## Приоритет импорта
1. Взять SVG/PNG из `03_VEHICLES/parts/`: scooter_body_no_wheels и wheel_side. Отдельные визуальные колёса должны повторять координаты физики Planck, не заменять физические тела.
2. `05_WORLD/backgrounds/courtyard/{sky,far,mid,near}.png` в Phaser с параллаксом [0,0.15,0.35,0.60]. Слои не должны блокировать управление/коллизии.
3. `05_WORLD/tiles/` + `05_WORLD/props/`: визуально оформить тестовую трассу; коллайдеры формируются данными уровня, **не по alpha-контуру картинок**.
4. В UI применить `06_UI/buttons/` и `06_UI/panels/` как 9-slice с указаниями в `ui_nine_slice.json`. Тексты/цифры/иконки — отдельные элементы, размеры под управление пальцем.
5. `04_CARGO/coffee.png` + HUD сохранности.
6. Использовать `00_REFERENCES/` только как арт-направление (цвет, настроение, композиция), не вставлять экран целиком вместо работающего UI.

## Визуальная система
- Желтый #FFD12B — основной action, курьер, доставка;
- графит #192437 — контрастный outline, тёмные панели;
- молочно-белый #FFF7E8 — вторичные панели и текст;
- зеленый #59D354 — положительный статус и целостность заказа;
- красный #FF5E57 — повреждение и опасность;
- голубой #36A6ED — город/небо;
- оранжевый #FF8300 — движение и солнечные блики.

Все арты ориентированы на **landscape gameplay**, сплэш / главное меню могут использовать portrait композицию при необходимости. Не смешивать несколько режимов ориентации на Android без отдельного UX-решения.

## Ограничения
- Это художественный стартовый набор, не финальный утвержденный коммерческий production art. Проверь читаемость и одинаковость масштаба в игре.
- PNG `02_CHARACTERS_AI_PNG` получены из генеративной иллюстрации: некоторые позы не совпадают полностью; нужны аниматор/риг или единая перерисовка.
- Профили света на векторных объектах намеренно упрощены относительно концептов. Не смешивать картинки с фотореалистичными деталями без коррекции.
- Иконки SVG текстом не содержат; локализуемый интерфейс надо рисовать настоящим текстом в движке.
- **Никакие изображения не содержат логотипов реальных служб доставки**. Используется оригинальная палитра и собственная графика.
- Фоновые SVG исходники могут быть тяжёлыми для мобильного рантайма; используйте PNG/WebP, SVG оставьте как редактируемый мастер.
- Физическая привязка спрайтов условная; центр масс и joint-анкер транспортного средства уточняйте на физическом прототипе.
- Для публикации сохраняйте исходники и дополнительно делайте оптимизированные WebP/KTX2/атласы с учётом платформ.
'''
(OUT/'README_FIRST.md').write_text(readme,encoding='utf-8')

codex='''# ЗАДАЧА CODEX: ИМПОРТ ART KIT v1 В ПРОЕКТ «НЕ РАЗЛЕЙ!»

1. Найди и прочти `README_FIRST.md`, `10_FOR_CODEX/manifest.json`, `physics_art_anchors.json`, `ui_nine_slice.json`, `palette.json`. Сохрани структуру основного проекта и работающую механику.
2. Установи `03_VEHICLES/parts/scooter_body_no_wheels.png` как визуал тела скутера. Оба `wheel_side.png` должны рендериться отдельно по позам Planck WheelJoint, с поворотом согласно физике. Не меняй физику только ради подгонки графики; используй пиксель-метр трансформ.
3. Подключи фон `05_WORLD/backgrounds/courtyard` четырьмя слоями с различными scrollFactor. Внутри runtime использовать PNG; SVG исходники как мастера.
4. Декорируй существующую тестовую трассу визуальными `tiles` и `props`; физические коллайдеры независимо от контуров и alpha спрайтов.
5. Подключи `04_CARGO/coffee.png` и единый HUD целостности. Кнопки React или Phaser сделай с отдельным текстом/иконками и 9-slice; нажатия видны через состояния pressed.
6. Используй logo_full.png и app_icon_master.png для временной визуальной идентичности. Не публикуй их как финальные app-icon assets без подготовки размеров/адаптивного foreground.
7. AI-позы персонажа из `02_CHARACTERS_AI_PNG` использовать лишь как временные статичные иллюстрации / референсы: не делать из разных поз автоматическую frame-by-frame анимацию.
8. Оптимизируй тяжёлые фоновые изображения под Android/Web, загружай лениво; проверь память и кадры. Без новых серверов, Docker, аналитики и рекламы.
9. Сохрани лицензионные заметки и атрибуцию сторонних ресурсов, если будут добавлены.
10. После импорта покажи 2 скриншота: меню и игровая сцена с отдельными колесами, фоном и HUD. Достаточно typecheck, web build, android debug build по доступности. Отчитайся, какие элементы заменены и какие остались заглушками.
'''
(meta/'CODEX_IMPORT_TASK.md').write_text(codex,encoding='utf-8')
(meta/'LICENSE_NOTES.md').write_text('''# Права и источники

- Большинство отдельных UI, пропсов, тайлов, фонов и логотипов в архиве — заново созданные программно SVG-иллюстрации для этой задачи.
- Растровые концепты и вырезанные персонажи созданы генеративным инструментом по заданию пользователя; не содержат сознательно внесённых чужих логотипов.
- Не распространяйте шрифтовые файлы. Векторный текст в logo.svg использует системный семейный fallback; PNG варианта логотипа зафиксирует визуал.
- Код для генерации в `11_SOURCE/` исходный скрипт без отдельных внешних коммерческих ассетов; используйте или редактируйте по желанию.
- Если добавляются сторонние ассеты, проверяйте их лицензии отдельно.
''',encoding='utf-8')
# include generator source for editing
srcdir=OUT/'11_SOURCE';srcdir.mkdir(exist_ok=True);shutil.copy2('/mnt/data/build_nerazley_artpack.py',srcdir/'build_nerazley_artpack.py')

# data report
stats={}
for obj in manifest:stats[obj['category']]=stats.get(obj['category'],0)+1
print('assets:',len(manifest),'categories:',stats)
print('archive_source_size_MB:',round(sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())/1e6,1))
zip_path=Path('/mnt/data/NeRazley_ArtKit_v1.zip')
if zip_path.exists():zip_path.unlink()
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for f in OUT.rglob('*'):
  if f.is_file():z.write(f,f.relative_to(OUT.parent))
print('ZIP:',zip_path,round(zip_path.stat().st_size/1e6,1),'MB')
