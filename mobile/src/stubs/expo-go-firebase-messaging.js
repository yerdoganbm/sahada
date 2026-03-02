/**
 * Expo Go: Messaging native modülü yok. Stub – token/izin no-op.
 */
function messagingStub() {
  return {
    getToken: () => Promise.resolve(null),
    requestPermission: () => Promise.resolve(0),
    hasPermission: () => Promise.resolve(0),
    onMessage: () => () => {},
    onNotificationOpenedApp: () => () => {},
    getInitialNotification: () => Promise.resolve(null),
  };
}

module.exports = { default: messagingStub };
