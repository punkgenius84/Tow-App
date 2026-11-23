"""Merge agent outputs into tow-app www/data.js ROWS + docs/VEHICLE_SOURCES.md."""
import json, glob, re, sys, subprocess
import os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'data'); APP = os.path.abspath(os.path.join(HERE, '..', '..'))
ORDER = ['Ford','Lincoln','Chevrolet','GMC','Buick','Cadillac','Ram','Dodge','Chrysler','Jeep','Toyota','Lexus','Honda','Acura',
         'Nissan','Infiniti','Hyundai','Kia','Genesis','Subaru','Mazda','Mitsubishi','Volkswagen','BMW','Mercedes-Benz','Audi',
         'Porsche','Volvo','Land Rover','MINI','Tesla','Rivian','Lucid','Polestar','Fisker','Isuzu','Hino']
rows, problems = [], []
for f in sorted(glob.glob(OUT + '/b*.json')):
    r = subprocess.run(['python3', os.path.join(HERE, 'validate.py'), f], capture_output=True, text=True)
    if r.returncode: problems.append(f + '\n' + r.stdout)
    for x in json.load(open(f)):
        x['_batch'] = f.split('/')[-1][:-5]; rows.append(x)
# carry over existing rows the batches did not cover (same make+model+power), kept as unverified
have = {(x['make'], x['model'], x['power']) for x in rows}
carried = []
for x in json.load(open(os.path.join(HERE, 'data', 'carried_over.json'))):
    if (x['make'], x['model'], x['power']) not in have:
        x = dict(x); x['verified'] = False; x['_batch'] = 'existing'
        x.setdefault('check', 'Carried over from the previous database; not re-checked yet.')
        rows.append(x); carried.append(f"{x['make']} {x['model']}")
# manual overrides after review
for x in rows:
    if x['make'] == 'Honda' and x['model'] in ('Accord', 'Accord Hybrid') and x['yFrom'] == 2018 and x['gc'] > 5.3:
        x['gc'] = 5.3; x['verified'] = False
        x['check'] = 'Honda Canada lists 149 mm (5.9 in); kept the previous 5.3 in until a US source confirms. ' + x.get('check', '')
    if x['gc'] < 4.8: x['low'] = True
# duplicates / overlapping years for the same make+model
key = {}
for x in rows:
    k = (x['make'], x['model'], x['power'])
    for y in key.get(k, []):
        if not (x['yTo'] < y['yFrom'] or y['yTo'] < x['yFrom']):
            problems.append(f"overlap: {x['make']} {x['model']} {x['power']} {x['yFrom']}-{x['yTo']} vs {y['yFrom']}-{y['yTo']} ({x['_batch']}/{y['_batch']})")
    key.setdefault(k, []).append(x)
rank = {m: i for i, m in enumerate(ORDER)}
rows.sort(key=lambda x: (rank.get(x['make'], 99), x['make'], x['model'], -x['yTo'], -x['yFrom']))
def js(v):
    return json.dumps(v, ensure_ascii=False).replace('"', "'") if isinstance(v, str) else json.dumps(v)
def jstr(s):
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"
lines, cur = [], None
for x in rows:
    if x['make'] != cur:
        cur = x['make']; lines.append(('\n' if lines else '') + f"    // ---------- {cur} ----------")
    o = []
    if x.get('gvwr'): o.append(f"gvwr: {int(x['gvwr'])}")
    if x.get('dually'): o.append('dually: true')
    if x.get('air') is True: o.append('air: true')
    elif x.get('air') == 'opt': o.append("air: 'opt'")
    if x.get('low'): o.append('low: true')
    if not x.get('verified'): o.append('c: 0')
    if x.get('note'): o.append('note: ' + jstr(x['note'].strip()))
    opts = (', { ' + ', '.join(o) + ' }') if o else ''
    lines.append(f"    [{jstr(x['make'])}, {jstr(x['model'])}, {x['yFrom']}, {x['yTo']}, {jstr(x['body'])}, {jstr(x['drives'])}, "
                 f"{jstr(x['power'])}, {jstr(x['trans'])}, {int(round(x['curb']))}, {float(x['wb']):.1f}, {float(x['gc']):.1f}{opts}],")
lines[-1] = lines[-1].rstrip(',')
src = open(APP + '/www/data.js').read()
a = src.index('  var ROWS = [') + len('  var ROWS = [\n'); b = src.index('\n  ];', a)
src = src[:a] + '\n'.join(lines) + src[b:]
open(APP + '/www/data.js', 'w').write(src)
# sources document
md = ['# Vehicle database sources', '',
      'Every row in `www/data.js` with the pages its numbers came from. Values follow the conservative rules in the header of',
      '`www/data.js`: lowest common ground clearance, longest common wheelbase, heaviest common curb weight for the range.',
      '"Verified" = ground clearance, wheelbase and curb weight each confirmed on a published spec page (ground clearance from',
      'the maker or two sources that agree within 0.3 in). Unverified rows are shown in the app as lower-confidence estimates.', '',
      f'{len(rows)} model ranges, {sum(1 for x in rows if x.get("verified"))} verified.', '',
      '| Vehicle | Years | GC in | WB in | Curb lb | Verified | Where the numbers came from | Sources |', '|---|---|---|---|---|---|---|---|']
for x in rows:
    s = ' '.join(f'[{i+1}]({u})' for i, u in enumerate(x.get('sources', [])))
    md.append(f"| {x['make']} {x['model']} | {x['yFrom']}-{x['yTo']} | {x['gc']} | {x['wb']} | {int(x['curb'])} | "
              f"{'yes' if x.get('verified') else 'no'} | {x.get('check','').replace('|','/')} | {s} |")
import os; os.makedirs(APP + '/docs', exist_ok=True)
open(APP + '/docs/VEHICLE_SOURCES.md', 'w').write('\n'.join(md) + '\n')
print(f"{len(rows)} rows, {sum(1 for x in rows if x.get('verified'))} verified, makes {len(set(x['make'] for x in rows))}")
print('carried over:', len(carried), ', '.join(carried))
print('\n'.join(problems) if problems else 'no problems')
