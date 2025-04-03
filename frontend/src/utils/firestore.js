import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Generic CRUD operations
export const createDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id: docId, ...data };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return docId;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Query operations
export const getCollection = async (collectionName, options = {}) => {
  try {
    let q = collection(db, collectionName);
    
    // Apply filters if provided
    if (options.where) {
      q = query(q, where(...options.where));
    }
    
    // Apply ordering if provided
    if (options.orderBy) {
      q = query(q, orderBy(...options.orderBy));
    }
    
    // Apply limit if provided
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    // Apply pagination if provided
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    throw error;
  }
};

// Specific collection operations
export const getProducts = async (options = {}) => {
  return getCollection('products', options);
};

export const getSales = async (options = {}) => {
  return getCollection('sales', options);
};

export const getCustomers = async (options = {}) => {
  return getCollection('customers', options);
};

// Real-time updates (if needed)
export const subscribeToCollection = (collectionName, callback, options = {}) => {
  let q = collection(db, collectionName);
  
  if (options.where) {
    q = query(q, where(...options.where));
  }
  
  if (options.orderBy) {
    q = query(q, orderBy(...options.orderBy));
  }
  
  if (options.limit) {
    q = query(q, limit(options.limit));
  }

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
}; 