/**
 * Unified Expo config plugin for ALL Podfile build fixes.
 * Replaces withBoringSSLFix.js and withRNFBWarningsFix.js.
 *
 * Injects Ruby code INSIDE the existing post_install block
 * (right after the opening line) using string indexOf — no regex.
 * CocoaPods does NOT support multiple post_install blocks.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PODFILE_FIXES = `
    # ============================================================
    # SAHADA: Unified Podfile Fixes (added by withPodfileFixes.js)
    # ============================================================

    # Fix 1: BoringSSL-GRPC — remove -GCC_WARN_INHIBIT_ALL_WARNINGS flag
    # Xcode 16+ misinterprets this flag as -G, causing build errors.
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

    # Fix 2: Suppress ALL warnings for @react-native-firebase pods (RNFB*)
    # and any other pods that have non-modular-include issues with useFrameworks: static.
    # Without this, -Werror promotes non-modular-include warnings to errors,
    # which cascade into 40+ build failures (unknown type RCT_EXTERN, implicit-int, etc.)
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB') || target.name.start_with?('RNNotifee')
        target.build_configurations.each do |config|
          config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
          config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
        end
      end
    end

    # Fix 3: Disable non-modular-include warning at project level for static frameworks
    installer.pods_project.build_configurations.each do |config|
      config.build_settings['CLANG_WARN_NON_MODULAR_INCLUDE_IN_FRAMEWORK_MODULE'] = 'NO'
    end
`;

function withPodfileFixes(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      const marker = '# SAHADA: Unified Podfile Fixes';
      if (contents.includes(marker)) {
        return config; // Already applied
      }

      // Find "post_install do |installer|" and inject right after that line.
      // Uses indexOf (not regex) so it works regardless of what other
      // plugins have already injected before or after this line.
      const postInstallStr = 'post_install do |installer|';
      const idx = contents.indexOf(postInstallStr);
      if (idx !== -1) {
        const insertAt = idx + postInstallStr.length;
        contents =
          contents.slice(0, insertAt) +
          '\n' + PODFILE_FIXES +
          contents.slice(insertAt);
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withPodfileFixes;
