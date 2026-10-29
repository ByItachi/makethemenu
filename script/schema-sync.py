import subprocess, sys

REF, TARGET = sys.argv[1], sys.argv[2]
APPLY = "--apply" in sys.argv


def q(sql, db=None):
    args = ["mysql", "-N", "-B", "--raw"]
    if db:
        args.append(db)
    out = subprocess.run(args + ["-e", sql], capture_output=True, text=True, check=True).stdout
    return [line.split("\t") for line in out.splitlines() if line]


def tables(db):
    return {r[0] for r in q(f"SELECT table_name FROM information_schema.tables WHERE table_schema='{db}' AND table_type='BASE TABLE'")}


def columns(db, t):
    return [r[0] for r in q(f"SELECT column_name FROM information_schema.columns WHERE table_schema='{db}' AND table_name='{t}' ORDER BY ordinal_position")]


def show_create(db, t):
    out = subprocess.run(["mysql", "-N", "-B", "--raw", db, "-e", f"SHOW CREATE TABLE `{t}`"], capture_output=True, text=True, check=True).stdout
    return out.split("\t", 1)[1].rstrip("\n")


def column_def(db, t, c):
    ddl = show_create(db, t)
    for line in ddl.splitlines():
        s = line.strip().rstrip(",")
        if s.startswith(f"`{c}` "):
            return s
    raise RuntimeError(f"tanim bulunamadi {t}.{c}")


def indexes(db, t):
    rows = q(f"SELECT index_name, non_unique, GROUP_CONCAT(CONCAT('`',column_name,'`') ORDER BY seq_in_index) FROM information_schema.statistics WHERE table_schema='{db}' AND table_name='{t}' AND index_name<>'PRIMARY' GROUP BY index_name, non_unique")
    return {r[0]: (r[1] == "0", r[2]) for r in rows}


ref_t, tgt_t = tables(REF), tables(TARGET)
stmts = []
for t in sorted(ref_t - tgt_t):
    ddl = show_create(REF, t)
    stmts.append(ddl.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS", 1))
for t in sorted(ref_t & tgt_t):
    have = set(columns(TARGET, t))
    for c in columns(REF, t):
        if c not in have:
            d = column_def(REF, t, c)
            if " NOT NULL" in d and " DEFAULT " not in d and "AUTO_INCREMENT" not in d:
                d = d.replace(" NOT NULL", " NULL")
            stmts.append(f"ALTER TABLE `{t}` ADD COLUMN IF NOT EXISTS {d}")
    tgt_idx = indexes(TARGET, t)
    tgt_sigs = {v for v in tgt_idx.values()}
    for name, (uniq, cols) in indexes(REF, t).items():
        if name in tgt_idx or (uniq, cols) in tgt_sigs:
            continue
        stmts.append(f"ALTER TABLE `{t}` ADD {'UNIQUE ' if uniq else ''}INDEX IF NOT EXISTS `{name}` ({cols})")

print(f"eksik tablo: {len(ref_t - tgt_t)}, toplam ifade: {len(stmts)}")
for s in stmts:
    print("  " + s.splitlines()[0][:160])
if APPLY and stmts:
    sql = "SET FOREIGN_KEY_CHECKS=0;\n" + ";\n".join(stmts) + ";\nSET FOREIGN_KEY_CHECKS=1;\n"
    r = subprocess.run(["mysql", TARGET], input=sql, capture_output=True, text=True)
    print("apply exit", r.returncode, r.stderr[-2000:])
    sys.exit(r.returncode)
