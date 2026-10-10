import base64, pathlib
root = pathlib.Path(__file__).parent
(root/'build').mkdir(parents=True, exist_ok=True)
sim = ''.join(f.read_text() for f in sorted((root/'src/sim').glob('*.js')))
api = "\nconst api = { T, DT, PH, SUITS, SUIT_ORDER, LEVELS, PARSED, parseLevel, createState, step, tileAt, isSolid, cloneState, overlap };\n"
umd = "(function(root){\n'use strict';\n" + sim + api + "root.NeonSim = api;\nif (typeof module !== 'undefined' && module.exports) module.exports = api;\n})(typeof window !== 'undefined' ? window : globalThis);\n"
(root/'build/sim.js').write_text(umd)
tpl_p = root/'src/index.template.html'
if tpl_p.exists():
    tpl = tpl_p.read_text()
    js = ''.join(f.read_text() for f in sorted((root/'src/parts').glob('*.js')))
    b64 = lambda n: 'data:image/jpeg;base64,' + base64.b64encode((root/'assets'/n).read_bytes()).decode()
    out = tpl.replace('__STREETIMG__', b64('tokyo_street.jpg')).replace('__ROOFIMG__', b64('tokyo_roof.jpg')).replace('__SIMJS__', umd).replace('__GAMEJS__', js)
    (root/'index.html').write_text(out)
    print('index.html', len(out.encode()), 'bytes')
print('sim.js', len(umd), 'bytes')
