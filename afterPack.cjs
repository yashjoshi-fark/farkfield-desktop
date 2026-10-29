// Apple Silicon Macs refuse to open an app that has no valid code signature and report it as "damaged".
// Without a paid Apple Developer ID we cannot notarize, but an ad-hoc signature ("-") gives the app a
// valid signature so macOS shows the normal "unidentified developer" prompt (System Settings >
// Privacy & Security > Open Anyway) instead of the "damaged" dialog.
const { execFileSync } = require('node:child_process');
const path = require('node:path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', app], { stdio: 'inherit' });
};
