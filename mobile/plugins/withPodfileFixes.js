/**
 * Unified Expo config plugin for Podfile build fixes.
 *
 * Uses TWO separate injection points:
 * 1. TOP-LEVEL: `inhibit_all_warnings!` — suppresses all pod warnings.
 *    This is a CocoaPods directive, NOT inside post_install. No `installer` needed.
 * 2. INSIDE post_install: BoringSSL compiler flag fix — injected right after
 *    the line containing `post_install do`.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withPodfileFixes(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      const marker = '# SAHADA_PODFILE_FIXES';
      if (contents.includes(marker)) {
        return config; // Already applied
      }

      const lines = contents.split('\n');
      const result = [];

      for (let i = 0; i < lines.length; i++) {
        result.push(lines[i]);

        // After "platform :ios" line, inject top-level directives
        if (lines[i].match(/^platform\s+:ios/)) {
          result.push('');
          result.push(marker);
          result.push('# Suppress ALL warnings on ALL third-party pods.');
          result.push('# Prevents RNFB non-modular-include warnings from cascading into 40+ errors.');
          result.push('inhibit_all_warnings!');
          result.push('');
        }

        // After "post_install do |installer|" line, inject BoringSSL fix
        if (lines[i].match(/post_install\s+do\s+\|installer\|/)) {
          result.push('');
          result.push('  # SAHADA: BoringSSL-GRPC fix — remove -GCC_WARN_INHIBIT_ALL_WARNINGS flag');
          result.push('  # Xcode 16+ misinterprets this flag as -G, causing build errors.');
          result.push('  installer.pods_project.targets.each do |target|');
          result.push('    if target.name == \'BoringSSL-GRPC\'');
          result.push('      target.source_build_phase.files.each do |file|');
          result.push('        if file.settings && file.settings[\'COMPILER_FLAGS\']');
          result.push('          flags = file.settings[\'COMPILER_FLAGS\'].split');
          result.push('          flags.reject! { |flag| flag == \'-GCC_WARN_INHIBIT_ALL_WARNINGS\' }');
          result.push('          file.settings[\'COMPILER_FLAGS\'] = flags.join(\' \')');
          result.push('        end');
          result.push('      end');
          result.push('    end');
          result.push('  end');
          result.push('');
          result.push('  # SAHADA: Disable -Werror on all pod targets');
          result.push('  installer.pods_project.targets.each do |target|');
          result.push('    target.build_configurations.each do |config|');
          result.push('      config.build_settings[\'GCC_TREAT_WARNINGS_AS_ERRORS\'] = \'NO\'');
          result.push('    end');
          result.push('  end');
          result.push('');
        }
      }

      contents = result.join('\n');
      fs.writeFileSync(podfilePath, contents);

      return config;
    },
  ]);
}

module.exports = withPodfileFixes;
