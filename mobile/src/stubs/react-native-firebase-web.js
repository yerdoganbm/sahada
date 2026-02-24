/**
 * Web platformında @react-native-firebase paketleri çalışmaz (native-only).
 * Metro web bundle'ının kırılmaması için bu stub kullanılır.
 * Uygulama sadece iOS/Android için tasarlandı; web'de "Mobil uygulama gerekli" mesajı gösterilmeli.
 */
const noop = () => {};
const noopPromise = () => Promise.resolve(null);
const emptyObj = {};

module.exports = emptyObj;
module.exports.default = emptyObj;
module.exports.common = emptyObj;
module.exports.app = noop;
module.exports.firestore = noop;
module.exports.functions = noop;
module.exports.messaging = noop;
module.exports.storage = noop;
