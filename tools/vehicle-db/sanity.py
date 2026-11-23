import json, glob
ex = {(r['make'], r['model']): r for r in json.load(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'data','carried_over.json')))}
RANGE = {'Sedan': (4.0, 6.8), 'Coupe': (3.5, 6.0), 'Hatchback': (4.0, 7.5), 'SUV': (5.0, 11.5), 'Pickup': (6.0, 12.0),
         'Minivan': (4.5, 7.5), 'Van': (5.0, 9.0)}
flags = []
for f in sorted(glob.glob(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'data','b*.json'))):
    for r in json.load(open(f)):
        t = f"{f[-8:-5]} {r['make']} {r['model']} {r['yFrom']}-{r['yTo']}"
        lo, hi = RANGE[r['body']]
        if not lo <= r['gc'] <= hi: flags.append(f"{t}: gc {r['gc']} unusual for {r['body']}")
        if r['body'] in ('Sedan', 'Coupe', 'Hatchback') and r['curb'] > 5500 and r['power'] != 'EV': flags.append(f"{t}: curb {r['curb']} heavy for {r['body']}")
        if r['gc'] < 4.8 and not r.get('low'): flags.append(f"{t}: gc {r['gc']} but low not set")
        if r['power'] == 'EV' and 'FWD' in r['drives'] and r['make'] == 'Tesla': flags.append(f"{t}: Tesla FWD?")
        o = ex.get((r['make'], r['model']))
        if o and o['yFrom'] <= r['yTo'] and r['yFrom'] <= o['yTo']:
            d = []
            if abs(o['gc'] - r['gc']) > 0.5: d.append(f"gc {o['gc']}->{r['gc']}")
            if abs(o['wb'] - r['wb']) > 3: d.append(f"wb {o['wb']}->{r['wb']}")
            if abs(o['curb'] - r['curb']) > 400: d.append(f"curb {o['curb']}->{r['curb']}")
            if d: flags.append(f"{t}: changed vs current: {', '.join(d)}  [{r.get('check','')[:140]}]")
print('\n'.join(flags) if flags else 'no flags')
