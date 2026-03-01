const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const RNFB_WARNINGS_FIX = `
  # RNFB fix: suppress ALL warnings for @react-native-firebase pods
  # With useFrameworks: "static", RNFB headers trigger non-modular-include warnings.
  # These warnings cascade into 40+ errors (unknown type RCT_EXTERN, implicit-int, etc.)
  # because -Werror stops compilation before React macros are resolved.
  # GCC_WARN_INHIBIT_ALL_WARNINGS fully suppresses warnings so the build succeeds.
  installer.pods_project.targets.each do |target|
    if target.name.start_with?('RNFB')
      target.build_configurations.each do |config|
        config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
      end
    end
  end
`;

function withRNFBWarningsFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      // Find the 'end' of post_install block and inject before it.
      // This approach works regardless of what other plugins have already injected.
      const marker = '# RNFB_WARNINGS_FIX';
      if (contents.includes(marker)) {
        return config; // Already injected
      }

      // Strategy 1: Find post_install block and inject at the beginning
      const postInstallMatch = contents.match(/post_install do \|installer\|/);
      if (postInstallMatch) {
        const insertIdx = contents.indexOf(postInstallMatch[0]) + postInstallMatch[0].length;
        contents =
          contents.slice(0, insertIdx) +
          '\n' + marker + '\n' + RNFB_WARNINGS_FIX +
          contents.slice(insertIdx);
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withRNFBWarningsFix;
