/**
 * Unified Expo config plugin for ALL Podfile build fixes.
 * Replaces withBoringSSLFix.js and withRNFBWarningsFix.js.
 *
 * CRITICAL: Injects at the END of the post_install block (before closing `end`).
 * Expo's own post_install code sets -Werror on targets. If we inject at the
 * beginning, Expo's code runs after us and overrides our settings.
 * By injecting at the END, our fixes run LAST and cannot be overridden.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PODFILE_FIXES = `
    # ============================================================
    # SAHADA: Unified Podfile Fixes (added by withPodfileFixes.js)
    # MUST be at END of post_install so Expo cannot override these.
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

    # Fix 2: Disable -Werror on ALL pod targets.
    # Expo post_install sets GCC_TREAT_WARNINGS_AS_ERRORS=YES on all targets.
    # Third-party pods (RNFB, etc.) have warnings that cascade into 40+ errors.
    # This MUST run after Expo's code to override it.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
      end
    end

    # Fix 3: Suppress ALL warnings specifically for RNFB pods
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB') || target.name.start_with?('RNNotifee')
        target.build_configurations.each do |config|
          config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        end
      end
    end

    # Fix 4: Disable non-modular-include warning at project level for static frameworks
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

      // Find the LAST 'end' at column 0 — this closes the post_install block.
      // We inject BEFORE it so our code runs LAST inside the block,
      // AFTER Expo's own post_install code that sets -Werror.
      const lines = contents.split('\n');
      let lastEndIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() === 'end') {
          lastEndIdx = i;
          break;
        }
      }

      if (lastEndIdx !== -1) {
        lines.splice(lastEndIdx, 0, PODFILE_FIXES);
        contents = lines.join('\n');
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withPodfileFixes;
