const firebaseConfig = {
  apiKey: "AIzaSyCcwehXlg60aakv-ManZnhd_hKYRZrxRGw",
  authDomain: "hats-ny-46068.firebaseapp.com",
  projectId: "hats-ny-46068",
  storageBucket: "hats-ny-46068.firebasestorage.app",
  messagingSenderId: "621376188378",
  appId: "1:621376188378:web:cd280dafbe96077d2f9ae3",
  measurementId: "G-PCSGLNDD0K"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();