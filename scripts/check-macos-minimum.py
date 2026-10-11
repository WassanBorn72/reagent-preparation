"""Check both packaged architectures; an app plist cannot lower Electron's OS requirement."""
import plistlib
from pathlib import Path

apps = list(Path('dist').glob('mac*/*.app'))
if len(apps) != 2:
    raise SystemExit(f'Expected Intel and Apple Silicon app bundles, found {len(apps)}')
for app in apps:
    for relative in ['Contents/Info.plist', 'Contents/Frameworks/Electron Framework.framework/Resources/Info.plist']:
        with (app / relative).open('rb') as source:
            data = plistlib.load(source)
        minimum = data.get('LSMinimumSystemVersion')
        if not minimum:
            raise SystemExit(f'Missing minimum macOS version in {app / relative}')
        version = tuple(int(part) for part in minimum.split('.'))
        if version + (0,) * (3 - len(version)) > (12, 0, 0):
            raise SystemExit(f'{app / relative} requires macOS {minimum}; expected 12.0 or earlier')
        print(f'{app.name}: {relative}: minimum macOS {minimum}')
