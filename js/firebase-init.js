// js/firebase-init.js
// Firebase Compat SDK initializer - works on file:// protocol without CORS issues
// Provides modular-API-compatible wrapper functions as window globals

// Preencha as credenciais do seu projeto Firebase abaixo:
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.firebasestorage.app",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID",
    measurementId: "SEU_MEASUREMENT_ID"
};

const app = firebase.initializeApp(firebaseConfig);
try { firebase.analytics(); } catch(e) { /* analytics may fail on file:// */ }
const db = firebase.firestore();

// ============================================================
// Modular-API-compatible wrapper functions
// These allow all existing code to work WITHOUT changing any 
// Firebase function calls — only import/export lines are removed.
// ============================================================

window.db = db;

/** collection(db, "name") → db.collection("name") */
window.collection = function(dbRef, name) {
    return dbRef.collection(name);
};

/** doc(db, "collection", "id") → db.collection("collection").doc("id") */
window.doc = function(dbRef, collName, docId) {
    return dbRef.collection(collName).doc(docId);
};

/** addDoc(collectionRef, data) → collectionRef.add(data) */
window.addDoc = function(collRef, data) {
    return collRef.add(data);
};

/** getDocs(queryOrCollectionRef) → ref.get() */
window.getDocs = function(ref) {
    return ref.get();
};

/** updateDoc(docRef, data) → docRef.update(data) */
window.updateDoc = function(docRef, data) {
    return docRef.update(data);
};

/** deleteDoc(docRef) → docRef.delete() */
window.deleteDoc = function(docRef) {
    return docRef.delete();
};

/** setDoc(docRef, data, options?) → docRef.set(data, options?) */
window.setDoc = function(docRef, data, options) {
    if (options) return docRef.set(data, options);
    return docRef.set(data);
};

/** onSnapshot(ref, callback, errCallback?) → ref.onSnapshot(cb, err?) */
window.onSnapshot = function(ref, callback, errCallback) {
    if (errCallback) return ref.onSnapshot(callback, errCallback);
    return ref.onSnapshot(callback);
};

/**
 * query(collectionRef, ...constraints) 
 * Chains .where() and .orderBy() from constraint objects
 */
window.query = function(collRef) {
    let q = collRef;
    for (let i = 1; i < arguments.length; i++) {
        const c = arguments[i];
        if (!c) continue;
        if (c._type === 'where') {
            q = q.where(c.field, c.op, c.value);
        } else if (c._type === 'orderBy') {
            q = q.orderBy(c.field, c.direction || 'asc');
        } else if (c._type === 'limit') {
            q = q.limit(c.value);
        }
    }
    return q;
};

/** where(field, op, value) → constraint object */
window.where = function(field, op, value) {
    return { _type: 'where', field: field, op: op, value: value };
};

/** orderBy(field, direction?) → constraint object */
window.orderBy = function(field, direction) {
    return { _type: 'orderBy', field: field, direction: direction || 'asc' };
};

/** limit(count) → constraint object */
window.limit = function(count) {
    return { _type: 'limit', value: count };
};

/** serverTimestamp() → firebase.firestore.FieldValue.serverTimestamp() */
window.serverTimestamp = function() {
    return firebase.firestore.FieldValue.serverTimestamp();
};

/** deleteField() → firebase.firestore.FieldValue.delete() */
window.deleteField = function() {
    return firebase.firestore.FieldValue.delete();
};

console.log("[Firebase] Inicializado com sucesso via Compat SDK.");
