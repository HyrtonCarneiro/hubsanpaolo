// js/firebase-init.js
// Firebase Compat SDK initializer - works on file:// protocol without CORS issues
// Provides modular-API-compatible wrapper functions as window globals

const firebaseConfig = {
    apiKey: "AIzaSyCCseCGga6bcujJS_kdsiD52mr3GUjP8lE",
    authDomain: "acompanhamento-ti.firebaseapp.com",
    projectId: "acompanhamento-ti",
    storageBucket: "acompanhamento-ti.firebasestorage.app",
    messagingSenderId: "791239998085",
    appId: "1:791239998085:web:308ba5164aea8102be47ec",
    measurementId: "G-W8L9PJDR1F"
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

console.log("[Firebase] Inicializado com sucesso via Compat SDK.");
