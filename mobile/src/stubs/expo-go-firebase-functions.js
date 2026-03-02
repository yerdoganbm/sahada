/**
 * Expo Go: Functions native modülü yok. Stub – callable boş sonuç döner.
 */
function httpsCallableStub() {
  return () => Promise.resolve({ data: null });
}

function functionsStub() {
  return { httpsCallable: (name) => httpsCallableStub(name) };
}

module.exports = { default: functionsStub };
