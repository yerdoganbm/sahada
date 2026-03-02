/**
 * Expo Go: Storage native modülü yok. Stub – upload/download no-op.
 */
function refStub() {
  return {
    putFile: () => Promise.resolve(),
    getDownloadURL: () => Promise.resolve(''),
    put: () => Promise.resolve(),
    getMetadata: () => Promise.resolve({}),
    delete: () => Promise.resolve(),
  };
}

function storageStub() {
  return { ref: (path) => refStub(path) };
}

module.exports = { default: storageStub };
