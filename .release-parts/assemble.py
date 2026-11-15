import gzip, hashlib, json, os, subprocess
from pathlib import Path
m=json.loads(Path(".release-parts/manifest.json").read_text())
parts=[]
for row in m["parts"]:
    p=Path(row["path"])
    assert p.parent==Path(".release-parts")
    b=p.read_bytes()
    assert len(b)==row["bytes"] and hashlib.sha256(b).hexdigest()==row["sha256"]
    parts.append(b)
blob=b"".join(parts)
assert len(blob)==m["gzipBytes"] and hashlib.sha256(blob).hexdigest()==m["gzipSHA256"]
data=gzip.decompress(blob)
assert len(data)==m["fullBytes"] and hashlib.sha256(data).hexdigest()==m["fullSHA256"]
gitsha=hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
assert gitsha==m["fullGitBlob"]
Path("index-full.html").write_bytes(data)
Path("FULL_ASSEMBLY.json").write_text(json.dumps({"status":"verified","bytes":len(data),"sha256":m["fullSHA256"],"gitBlob":gitsha,"assemblyInputCommit":os.environ["GITHUB_SHA"]},indent=2)+"\n")
print("Verified full HTML:",gitsha,len(data))
