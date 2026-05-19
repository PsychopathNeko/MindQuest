import json, os

DIR = r"C:Users83	estwebpublicdatascales"

def w(name, data):
    with open(os.path.join(DIR, name), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(name)
