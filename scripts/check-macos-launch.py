"""Verify both app signatures, then launch the app matching the Mac runner CPU."""
import platform
import subprocess
import tempfile
from pathlib import Path

apps = list(Path('dist').glob('mac*/*.app'))
if len(apps) != 2:
    raise SystemExit('Expected two macOS app bundles')
architecture = 'arm64' if platform.machine() == 'arm64' else 'x64'
matching = []
for app in apps:
    subprocess.run(['codesign', '--verify', '--deep', '--strict', '--verbose=2', str(app)], check=True)
    executable = app / 'Contents/MacOS/Reagent Calculator'
    architectures = subprocess.check_output(['lipo', '-archs', str(executable)], text=True).split()
    if ('arm64' if architecture == 'arm64' else 'x86_64') in architectures:
        matching.append(executable)
if len(matching) != 1:
    raise SystemExit('Could not find exactly one app matching the runner CPU')
with tempfile.TemporaryDirectory() as profile:
    subprocess.run([str(matching[0].resolve()), '--smoke-test', f'--user-data-dir={profile}'], check=True, timeout=45)
print(f'PASS: both signatures and {architecture} packaged app startup')
# CI has no download quarantine. This does not prove Gatekeeper/notarization acceptance.
