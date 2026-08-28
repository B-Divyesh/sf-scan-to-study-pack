# Demo sandbox

Open `/demo` (or use **Try it with sample data** on the home page). It loads a
one-page history-seminar library note with one clear and one low-confidence
OCR block. The text is editable and all three export formats work immediately.

Demo records use IndexedDB database `scan-study-pack-demo-v1` with the
`demo:current` key. Real work uses the separate `scan-study-pack-v1` database
and `real:current` key; demo mode never reads or writes it. **Reset demo**
replaces only `demo:current`. **Start for real** returns to the empty local
workspace and leaves the demo database untouched.
