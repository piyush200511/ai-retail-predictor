import re
import pathlib

apps_dir = pathlib.Path('apps')

for app in apps_dir.iterdir():
    if not app.is_dir() or app.name == '__pycache__':
        continue
    apps_py = app / 'apps.py'
    if not apps_py.exists():
        continue
    content = apps_py.read_text(encoding='utf-8')
    new_content = re.sub(
        r"name\s*=\s*['\"]" + re.escape(app.name) + r"['\"]",
        f"name = 'apps.{app.name}'",
        content
    )
    if new_content != content:
        apps_py.write_text(new_content, encoding='utf-8')
        print(f'FIXED: {apps_py}')
    else:
        print(f'OK (no change): {apps_py}')