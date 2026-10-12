"""Assemble assets/calc.js from _src/js parts."""
import os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "js")
parts = ["head.js", "specs_fin.js", "specs_math.js", "specs_health.js", "specs_other.js", "tail.js"]
out = "\n".join(open(os.path.join(D, p)).read() for p in parts)
open(os.path.join(os.path.dirname(D), "..", "assets", "calc.js"), "w").write(out)
print("calc.js", len(out))
