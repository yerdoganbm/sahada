const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const RNFB_WARNINGS_FIX = `
  # RNFB fix: suppress non-modular-include warnings for @react-native-firebase pods
  # These warnings are treated as errors with -Werror and break the build
  # when using useFrameworks: "static"
  installer.pods_project.targets.each do |target|
    if target.name.start_with?('RNFB')
      target.build_configurations.each do |config|
        existing = config.build_settings['OTHER_CFLAGS'] || '$(inherited)'
        unless existing.include?('-Wno-non-modular-include-in-framework-module')
          config.build_settings['OTHER_CFLAGS'] = existing + ' -Wno-non-modular-include-in-framework-module'
        end
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

      // Inject RNFB warnings fix at start of post_install block
      const postInstallRegex = /(post_install do \|installer\|)\s*\n/;
      if (postInstallRegex.test(contents)) {
        contents = contents.replace(postInstallRegex, `$1\n${RNFB_WARNINGS_FIX}\n`);
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withRNFBWarningsFix;
