#!/usr/bin/env python3
"""Regenerates the bulk block of www/data.js and the AGGREGATOR_UNVERIFIED rows of
docs/vehicle-catalog-audit.csv. Offline at runtime: this script is a build-time tool only.

Sources (see docs/BULK_DATA_SOURCES.md):
  specs : ilyasozkurt/automobile-models-and-specs (scrape of autoevolution.com, 2024-10-23)
  US id : abhionlyone/us-car-models-data (CC BY 4.0) - restricts to US-market model/year and supplies body style

Rules: no value is invented. A row is imported only if wheelbase, curb weight and ground clearance
are all present for the variants grouped into it. Conservative aggregation across trims:
clearance = MIN, curb = MAX, wheelbase = median. The variant ranges are kept in the row note.
Everything is c:0 / agg-tagged and never carries a verified `source`.
"""
import csv, io, json, re, statistics, sys, urllib.request, zipfile, os, glob, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.environ.get('TOW_CACHE', '/tmp/tow-bulk-cache')
AE_ZIP = 'https://raw.githubusercontent.com/ilyasozkurt/automobile-models-and-specs/master/automobiles.csv.zip'
US_URL = 'https://raw.githubusercontent.com/abhionlyone/us-car-models-data/master/%d.csv'
AGG = 'autoevolution.com via ilyasozkurt/automobile-models-and-specs 2024-10-23'
BEGIN = '    // ===== BEGIN GENERATED BULK (tools/import-bulk.py) - do not hand-edit ====='
END = '    // ===== END GENERATED BULK ====='
csv.field_size_limit(10**9)


def fetch(url, name):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, name)
    if not os.path.exists(p):
        with urllib.request.urlopen(url) as r, open(p, 'wb') as f:
            f.write(r.read())
    return p


def norm_tokens(s):
    s = s.lower().replace('&amp;', '&')
    s = re.sub(r'[-\u2010-\u2015]', '', s)
    return re.findall(r'[a-z0-9]+', s)


def num_mm(s):
    m = re.search(r'\(([\d,\.]+)\s*Mm\)', s or '', re.I)
    return float(m.group(1).replace(',', '')) if m else None


def num_lb(s):
    m = re.search(r'([\d,\.]+)\s*Lbs', s or '', re.I)
    return float(m.group(1).replace(',', '')) if m else None


def power_class(spec, ename):
    fuel = (spec.get('Engine Specs', {}).get('Fuel:') or '').lower()
    n = ename.lower()
    if fuel == 'electric' or re.search(r'\b(electric|ev)\b', n) and 'hybrid' not in n: return 'EV'
    if 'plug-in' in fuel or 'plug-in' in n or 'phev' in n: return 'PHEV'
    if 'mild' in fuel or 'mild' in n: return 'ICE'
    if 'hybrid' in fuel or 'hybrid' in n or re.search(r'\bhev\b', n): return 'HEV'
    return 'ICE'


def trans_code(g, power):
    if power == 'EV': return 'EV'
    g = (g or '').lower()
    if not g or g == 'none': return None
    if 'manual' in g: return 'MT'
    if 'cvt' in g: return 'CVT'
    if re.search(r'dsg|dct|pdk|s tronic|dual|double', g): return 'DCT'
    if 'automatic' in g: return 'AT'
    if 'single' in g: return 'EV'
    return None


def drive_code(d):
    d = (d or '').lower()
    return {'front wheel drive': 'FWD', 'rear wheel drive': 'RWD', 'all wheel drive': 'AWD'}.get(d)


STYLE_HINTS = [('sedan', 'Sedan'), ('coupe', 'Coupe'), ('hatchback', 'Hatchback'), ('hatch', 'Hatchback'),
               ('wagon', 'Wagon'), ('estate', 'Wagon'), ('avant', 'Wagon'), ('convertible', 'Convertible'),
               ('cabrio', 'Convertible'), ('roadster', 'Convertible'), ('spyder', 'Convertible'), ('suv', 'SUV')]
FULLSIZE_VAN = re.compile(r'transit|express|savana|sprinter|promaster|nv\d|e-?series|econoline|ram van|metris|nv200', re.I)


def pick_body(model, styles):
    ml = model.lower()
    for k, v in STYLE_HINTS:
        if re.search(r'\b' + k, ml): return v
    s = [{'Van/Minivan': 'Minivan'}.get(x, x) for x in styles]
    s = [('Van' if x == 'Minivan' and FULLSIZE_VAN.search(model) else x) for x in s]
    if not s: return None
    # No explicit style in the model name: do not guess among several listed styles.
    return '/'.join(dict.fromkeys(s))


def main():
    z = zipfile.ZipFile(fetch(AE_ZIP, 'automobiles.csv.zip'))
    brands = [r['name'] for r in csv.DictReader(io.TextIOWrapper(z.open('brands.csv'), encoding='utf-8'))]
    brands.sort(key=len, reverse=True)
    autos = {}
    for r in csv.reader(io.TextIOWrapper(z.open('automobiles.csv'), encoding='utf-8')):
        if r[0] == 'id': continue
        autos[r[0]] = (r[2], r[4])  # url, title
    # US list: make_norm -> list of (year, model_tokens, model, styles, make)
    us = collections.defaultdict(list)
    for y in range(1992, 2027):
        for r in csv.DictReader(open(fetch(US_URL % y, 'us%d.csv' % y), encoding='utf-8')):
            try: st = json.loads(r['body_styles'])
            except Exception: st = []
            us[''.join(norm_tokens(r['make']))].append((int(r['year']), norm_tokens(r['model']), r['model'], st, r['make']))
    # existing curated rows (outside the generated block)
    src = open(os.path.join(ROOT, 'www/data.js'), encoding='utf-8').read()
    if BEGIN in src:
        src = src[:src.index(BEGIN)].rstrip('\n') + '\n' + src[src.index(END) + len(END):].lstrip('\n')
    cur = []
    for m in re.finditer(r"^\s*\[\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*(\d+),", src, re.M):
        cur.append((''.join(norm_tokens(m.group(1))), norm_tokens(re.sub(r'\(.*?\)', '', m.group(2))), int(m.group(3)), int(m.group(4)), m.group(1)))
    curmakes = {c[0]: c[4] for c in cur}

    groups = {}
    stats = collections.Counter()
    for r in csv.DictReader(io.TextIOWrapper(z.open('engines.csv'), encoding='utf-8')):
        a = autos.get(r['automobile_id'])
        if not a: continue
        url, title = a
        t = re.sub(r'\s*Photos,.*$', '', title.replace('&amp;', '&')).strip()
        m = re.match(r'^(.*?)\s+(\d{4})\s*-\s*(\d{4}|[Pp]resent)?\s*$', t)
        if m: head, y0, y1 = m.group(1), int(m.group(2)), (2025 if not m.group(3) or m.group(3).lower() == 'present' else int(m.group(3)))
        else:
            m = re.match(r'^(\d{4})\s+(.*)$', t)
            if not m: stats['title_unparsed'] += 1; continue
            head, y0, y1 = m.group(2), int(m.group(1)), int(m.group(1))
        y1 = min(y1, 2025)
        if y1 < 1992 or y0 > 2025: stats['out_of_years'] += 1; continue
        head = re.sub(r'\s+', ' ', head)
        brand = next((b for b in brands if head.lower().startswith(b.lower() + ' ')), None)
        if not brand: stats['no_brand'] += 1; continue
        model = head[len(brand):].strip()
        mk = ''.join(norm_tokens(brand))
        mt = norm_tokens(model)
        # match to US-market model list
        best = None
        for (uy, ut, um, ust, umake) in us.get(mk, []):
            if uy < max(y0, 1992) or uy > y1: continue
            n = min(len(ut), len(mt))
            if n == 0 or ut[:n] != mt[:n]: continue
            key = (n, -abs(len(ut) - len(mt)))
            if best is None or key > best[0]: best = (key, um, ust, umake)
        if not best: stats['not_us_listed'] += 1; continue
        make = curmakes.get(mk, best[3])
        try: spec = json.loads(r['specs'])
        except Exception: stats['bad_json'] += 1; continue
        d = spec.get('Dimensions', {}); w = spec.get('Weight Specs', {})
        gc = num_mm(d.get('Ground Clearance:')); wb = num_mm(d.get('Wheelbase:')); curb = num_lb(w.get('Unladen Weight:'))
        if gc is None or wb is None or curb is None: stats['variant_missing_dim'] += 1; continue
        gc, wb = round(gc / 25.4, 1), round(wb / 25.4, 1)
        if not (3.5 <= gc <= 18 and 70 <= wb <= 190 and 1500 <= curb <= 12000): stats['variant_out_of_range'] += 1; continue
        pw = power_class(spec, r['name'])
        k = (make, model, y0, y1, url)
        g = groups.setdefault(k, {'body': pick_body(model, best[2]), 'v': collections.defaultdict(list), 'umodel': best[1]})
        gl = num_lb(w.get('Gross Weight Limit:'))
        g['v'][pw].append({'gc': gc, 'wb': wb, 'curb': curb, 'gvwr': gl,
                           'drive': drive_code(spec.get('Transmission Specs', {}).get('Drive Type:')),
                           'trans': trans_code(spec.get('Transmission Specs', {}).get('Gearbox:'), pw)})

    rows, audit, seen = [], [], set()
    for (make, model, y0, y1, url), g in sorted(groups.items(), key=lambda x: (x[0][0], x[0][1], x[0][2])):
        if not g['body']: stats['no_body'] += 1; continue
        multi = len(g['v']) > 1
        for pw, vs in sorted(g['v'].items()):
            name = model + ({'EV': ' (Electric)', 'PHEV': ' (Plug-in hybrid)', 'HEV': ' (Hybrid)', 'ICE': ''}[pw] if multi and pw != 'ICE' else '')
            yf, yt = max(y0, 1980), y1
            # skip if a curated row covers this model/years
            ntok = norm_tokens(re.sub(r'\(.*?\)', '', name))
            if any(c[0] == ''.join(norm_tokens(make)) and not (c[3] < yf or c[2] > yt) and
                   (c[1][:len(ntok)] == ntok or ntok[:len(c[1])] == c[1]) for c in cur):
                stats['covered_by_curated'] += 1; continue
            key = (make, name, yf)
            if key in seen: stats['duplicate_key'] += 1; continue
            seen.add(key)
            gcs = [v['gc'] for v in vs]; wbs = [v['wb'] for v in vs]; cbs = [v['curb'] for v in vs]
            gc, curb, wb = min(gcs), max(cbs), round(statistics.median(wbs), 1)
            drives = {v['drive'] for v in vs if v['drive']}
            if g['body'] == 'Pickup' and 'AWD' in drives: drives.add('4WD')
            if not drives: stats['no_drive'] += 1; continue
            order = ['FWD', 'RWD', 'AWD', '4WD']
            drives = '|'.join(d for d in order if d in drives)
            ts = {v['trans'] for v in vs if v['trans']}
            tnote = ''
            if pw == 'EV': ts = {'EV'}
            if not ts: ts = {'AT', 'MT', 'CVT', 'DCT'}; tnote = ' Transmission not in source: all types offered, confirm on scene.'
            tord = ['AT', 'CVT', 'MT', 'DCT', 'EV']
            trans = '|'.join(t for t in tord if t in ts)
            gv = [v['gvwr'] for v in vs if v['gvwr']]
            opts = ['c: 0', 'agg: %s' % json.dumps(AGG)]
            if gv and max(gv) >= curb: opts.insert(0, 'gvwr: %d' % round(max(gv)))
            if gc < 5.0: opts.append('low: true')
            rng = 'Source variants: clearance %.1f-%.1f in (row uses lowest), curb %d-%d lb (row uses highest), wheelbase %.1f-%.1f in.' % (min(gcs), max(gcs), min(cbs), max(cbs), min(wbs), max(wbs))
            note = 'UNVERIFIED aggregator data (%d variant%s, model years %d-%d). %s%s Measure on scene.' % (len(vs), '' if len(vs) == 1 else 's', y0, y1, rng, tnote)
            opts.append('note: %s' % json.dumps(note))
            rows.append("    [%s, %s, %d, %d, %s, %s, %s, %s, %d, %s, %s, { %s }]," % (
                json.dumps(make), json.dumps(name), yf, yt, json.dumps(g['body']), json.dumps(drives), json.dumps(pw), json.dumps(trans),
                round(curb), wb, gc, ', '.join(opts)))
            audit.append([make, name, yf, yt, g['body'], drives, pw, trans, round(curb), wb, gc, 'LOW_UNVERIFIED', 'AGGREGATOR_UNVERIFIED',
                          url, 'aggregator-scrape (autoevolution via ilyasozkurt dataset 2024-10-23)', '%d-%d' % (y0, y1), '', '', '',
                          rng, 'Body style from abhionlyone/us-car-models-data (CC BY 4.0). Needs OEM verification per trim before any confidence upgrade.'])
    block = BEGIN + '\n    // Generated from aggregator data; every row is c:0 and carries agg provenance. ' + str(len(rows)) + ' rows.\n' + '\n'.join(rows) + '\n' + END + '\n'
    marker = '  ];\n\n  function toVehicle'
    assert marker in src
    src = src.replace(marker, block + marker, 1)
    open(os.path.join(ROOT, 'www/data.js'), 'w', encoding='utf-8').write(src)

    ap = os.path.join(ROOT, 'docs/vehicle-catalog-audit.csv')
    lines = list(csv.reader(open(ap, encoding='utf-8')))
    hdr = lines[0]; keep = [l for l in lines[1:] if l[12] != 'AGGREGATOR_UNVERIFIED']
    with open(ap, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, quoting=csv.QUOTE_ALL, lineterminator='\n')
        w.writerow(hdr); w.writerows(keep); w.writerows(audit)
    print('rows generated:', len(rows), 'curated kept:', len(keep)); print(dict(stats))


main()
