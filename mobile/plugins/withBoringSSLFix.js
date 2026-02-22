const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const BORINGSSL_FIX = `
  # BoringSSL-GRPC fix: remove -GCC_WARN_INHIBIT_ALL_WARNINGS (Xcode 16+ interprets as -G)
  installer.pods_project.targets.each do |target|
    if target.name == 'BoringSSL-GRPC'
      target.source_build_phase.files.each do |file|
        if file.settings && file.settings['COMPILER_FLAGS']
          flags = file.settings['COMPILER_FLAGS'].split
          flags.reject! { |flag| flag == '-GCC_WARN_INHIBIT_ALL_WARNINGS' }
          file.settings['COMPILER_FLAGS'] = flags.join(' ')
        end
      end
    end
  end
`;

function withBoringSSLFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      // Inject BoringSSL fix at start of post_install block
      const postInstallRegex = /(post_install do \|installer\|)\s*\n/;
      if (postInstallRegex.test(contents)) {
        contents = contents.replace(postInstallRegex, `$1\n${BORINGSSL_FIX}\n`);
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withBoringSSLFix;
