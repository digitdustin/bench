#!/usr/bin/env python3
"""Nucleo icons for Bench pages, read from the local Nucleo library (macOS app) (Nucleo UI family).

  python3 ~/.claude/skills/bench/scripts/icons.py --search eye     # list matching icon names and sizes
  python3 ~/.claude/skills/bench/scripts/icons.py eye caret-up:12:fill  # export to icons/<name>[-12][-fill].svg
      spec = name[:12|18][:fill]; size defaults to 18, style to outline (fill = Nucleo "glyph")

build.mjs calls this automatically for any <!--icon:NAME[:12|18][:fill]--> marker whose SVG is not
in icons/ yet, so pages only need the marker. Exported SVGs use currentColor and are cached in icons/.
"""
import re, sqlite3, sys
from pathlib import Path

HOME = Path.home()
DB = HOME / "Library/Application Support/Nucleo/icons/data.sqlite3"
SETS = HOME / "Library/Application Support/Nucleo/icons/sets"
OUT = Path(__file__).resolve().parent.parent / "icons"
FAMILY = "Nucleo UI"

def connect():
    if not DB.exists(): sys.exit(f"Icon not in icons/ and no Nucleo library at {DB}. Pick a name from the icons/ folder, or install the Nucleo app (nucleoapp.com, paid license) and sync the Nucleo UI set.")
    return sqlite3.connect(f"file:{DB}?mode=ro", uri=True)

def search(term):
    rows = connect().execute("""select distinct i.name, i.grid from icons i join sets s on s.id=i.set_id
        join groups g on g.id=s.group_id where g.title=? and i.klass in ('outline','glyph') and i.name like ?
        order by length(i.name), i.name, i.grid""", (FAMILY, f"%{term}%")).fetchall()
    rows = connect().execute("""select i.name, group_concat(distinct i.grid || case i.klass when 'glyph' then ':fill' else '' end)
        from icons i join sets s on s.id=i.set_id join groups g on g.id=s.group_id
        where g.title=? and i.klass in ('outline','glyph') and i.name like ? group by i.name order by length(i.name), i.name""", (FAMILY, f"%{term}%")).fetchall()
    for name, variants in rows: print(f"{name:40s} {variants}")
    print(f"{len(rows)} matches")

def normalise(svg):
    svg = re.sub(r'(fill|stroke)="(?!none"|currentColor")[^"]*"', r'\1="currentColor"', svg)
    svg = re.sub(r'\s*data-color="[^"]*"', '', svg)
    svg = re.sub(r'\s*class="nc-icon-wrapper"', '', svg)
    svg = re.sub(r'<svg[^>]*>', lambda m: re.sub(r'\s(width|height)="[^"]*"', '', m.group(0)), svg, count=1)
    svg = re.sub(r'<title>.*?</title>', '', svg, flags=re.S)
    return svg.replace("<svg ", '<svg aria-hidden="true" ', 1).strip()

def export(specs):
    con = connect(); OUT.mkdir(exist_ok=True); missing = []
    for spec in specs:
        parts = spec.split(":"); name = parts[0]
        size = int(next((p for p in parts[1:] if p in ("12", "18")), 18)); fill = "fill" in parts[1:]
        row = con.execute("""select i.id, i.set_id from icons i join sets s on s.id=i.set_id join groups g on g.id=s.group_id
            where g.title=? and i.name=? and i.grid=? and i.klass=? order by i.id limit 1""", (FAMILY, name, size, "glyph" if fill else "outline")).fetchone()
        src = SETS / str(row[1]) / f"{row[0]}.svg" if row else None
        if not src or not src.exists(): missing.append(spec); continue
        (OUT / f"{name}{'' if size == 18 else '-12'}{'-fill' if fill else ''}.svg").write_text(normalise(src.read_text()))
    if missing: sys.exit("not in Nucleo UI: " + ", ".join(missing) + " (try --search)")

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    search(a[1]) if a[0] == "--search" else export(a)
