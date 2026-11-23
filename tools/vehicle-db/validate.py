import json, sys, re
p = sys.argv[1]
rows = json.load(open(p))
errs = []; seen = set()
BODY = {'Pickup','SUV','Sedan','Coupe','Hatchback','Minivan','Van'}
for i, r in enumerate(rows):
    tag = f"#{i} {r.get('make')} {r.get('model')} {r.get('yFrom')}"
    def e(m): errs.append(tag + ': ' + m)
    for k in ['make','model','yFrom','yTo','body','drives','power','trans','curb','wb','gc','verified','sources','check']:
        if k not in r: e('missing ' + k)
    if errs and errs[-1].startswith(tag + ': missing'): continue
    key = (r['make'], r['model'], r['yFrom'])
    if key in seen: e('duplicate make+model+yFrom')
    seen.add(key)
    if not (1990 <= r['yFrom'] <= r['yTo'] <= 2026): e('years')
    if r['body'] not in BODY: e('body ' + str(r['body']))
    d = r['drives'].split('|')
    if not d or any(x not in ('FWD','RWD','AWD','4WD') for x in d): e('drives')
    if r['power'] not in ('ICE','HEV','PHEV','EV'): e('power')
    t = r['trans'].split('|')
    if any(x not in ('AT','CVT','MT','DCT','EV') for x in t): e('trans')
    if r['power'] == 'EV' and t != ['EV']: e('EV rows must have trans "EV"')
    if r['power'] != 'EV' and 'EV' in t: e('only EV rows use trans EV')
    if not (2000 <= r['curb'] <= 12000): e('curb out of range')
    if not (85 <= r['wb'] <= 190): e('wb out of range')
    if not (3.5 <= r['gc'] <= 12): e('gc out of range')
    g = r.get('gvwr')
    if g is not None and g != 0 and g < r['curb']: e('gvwr below curb')
    if r['body'] in ('Pickup','Van') and not g: e('pickups/vans need gvwr')
    if r.get('air') not in (None, False, True, 'opt'): e('air must be true/false/"opt"')
    if not isinstance(r['sources'], list) or (r['verified'] and len(r['sources']) < 1): e('verified rows need sources')
    if any(not re.match(r'https?://', s) for s in r['sources']): e('sources must be URLs')
    if len(r.get('note','')) > 200: e('note too long')
print(f"{len(rows)} rows, {sum(1 for r in rows if r.get('verified'))} verified, {len(errs)} errors")
for x in errs[:60]: print('  ' + x)
sys.exit(1 if errs else 0)
