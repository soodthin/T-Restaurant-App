import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';


const firebaseConfig = {
    apiKey: 'AIzaSyD2vZtq9q-LEhMjFZekBmoNf0qXWr3_obc',
    authDomain: 't-restaurant-app.firebaseapp.com',
    databaseURL: 'https://t-restaurant-app-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 't-restaurant-app',
    storageBucket: 't-restaurant-app.firebasestorage.app',
    messagingSenderId: '742189884828',
    appId: '1:742189884828:web:e80b34ce94e633b7065459',
    measurementId: 'G-HV0D036CYQ',
};


const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];


export const database = getDatabase(app);

export default app;
