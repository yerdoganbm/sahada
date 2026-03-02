/**
 * Expo Go: Firestore native modülü yok. Stub – tüm okuma/yazma no-op veya boş sonuç döner.
 */
const emptySnap = {
  exists: false,
  data: () => undefined,
  id: '',
};
const emptyQuerySnap = { empty: true, docs: [], size: 0 };
const resolveEmpty = () => Promise.resolve(emptyQuerySnap);
const resolveDoc = () => Promise.resolve(emptySnap);
const resolveRef = () => Promise.resolve({ id: 'expo-go-stub' });
const resolveVoid = () => Promise.resolve();

function docRef() {
  return {
    get: resolveDoc,
    set: resolveVoid,
    update: resolveVoid,
    delete: resolveVoid,
    onSnapshot: () => () => {},
    collection: () => collectionRef(),
  };
}

function queryRef() {
  return {
    get: resolveEmpty,
    limit: () => queryRef(),
    where: () => queryRef(),
    orderBy: () => queryRef(),
    startAfter: () => queryRef(),
  };
}

function collectionRef() {
  return {
    doc: () => docRef(),
    add: resolveRef,
    get: resolveEmpty,
    where: () => queryRef(),
    limit: () => queryRef(),
    orderBy: () => queryRef(),
  };
}

function firestoreStub() {
  return {
    collection: (name) => collectionRef(),
    batch: () => ({ set: resolveVoid, update: resolveVoid, commit: resolveVoid }),
    runTransaction: (fn) => fn({ get: resolveDoc, set: resolveVoid, update: resolveVoid }),
  };
}

module.exports = { default: firestoreStub };
