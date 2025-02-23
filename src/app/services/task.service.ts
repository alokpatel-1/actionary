// src/app/services/crud.service.ts
import { inject, Injectable } from '@angular/core'; import {
  Firestore,
  getFirestore,
  collection,
  getDocs,
  getDoc,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getFirestore, collection, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { firebaseConfig } from '../app.config';
import { Task } from '../actionary/components/create-task/create-task.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActionaryUtilService } from './actionary-util.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private collectionName = 'items'; // Your Firestore collection name
  items: any = []
  app = initializeApp(firebaseConfig);
  db = getFirestore(this.app); //Get an instance of Firestore

  constructor(private firestore: Firestore) { }
  private readonly spinner = inject(NgxSpinnerService);
  private readonly utilService = inject(ActionaryUtilService);

  async getItems() {
    this.spinner.show();
    try {
      const querySnapshot = await getDocs(collection(this.db, this.collectionName));
      this.items = []; // Clear the array before pushing new data
      querySnapshot.forEach((doc) => {
        this.items.push({ id: doc.id, ...doc.data() });
      });
      this.spinner.hide();
      return this.items;
    } catch (error) {
      console.error('Error fetching cities:', error);
      this.spinner.hide();
      return [];
    }
  }

  // async addCity(newCity: Task[]) {
  //   try {
  //     const docRef = await addDoc(collection(this.db, this.collectionName), newCity);
  //     console.log('Document written with ID:', docRef.id);
  //   } catch (error) {
  //     console.error('Error adding document:', error);
  //   }
  // }



  // // Get all documents in collection "cities"
  // async getAllCities() {
  //   try {
  //     const querySnapshot = await getDocs(collection(this.db, this.collectionName));

  //     if (querySnapshot.empty) {
  //       console.log("No cities found.");
  //       return null;
  //     }

  //     const cities: any[] = [];
  //     querySnapshot.forEach((doc) => {
  //       cities.push({ id: doc.id, ...doc.data() });
  //     });

  //     console.log("Fetched Cities:", cities);
  //     return cities; // Return the array if needed
  //   } catch (error) {
  //     console.error("Error getting documents:", error);
  //     return error;
  //   }
  // }


  // //Get single document
  // async getSingleCity(cityId: string) {
  //   const docRef = doc(this.db, this.collectionName, cityId)
  //   try {
  //     const docSnap = await getDoc(docRef)
  //     if (docSnap.exists()) {
  //       console.log("Document data:", docSnap.data())
  //     } else {
  //       console.log("No such document!")
  //     }
  //   } catch (e) {
  //     console.error("Error getting document: ", e)
  //   }
  // }



  // Create: Add a new item
  async createItem(data: any): Promise<any> {
    this.spinner.show();
    [data].forEach(data => this.utilService.setIsEditableFalse(data));
    const col = collection(this.firestore, this.collectionName);
    const resp = await addDoc(col, data);
    this.spinner.hide();
    return resp;
  }

  // // Read: Get all items (with realtime updates)
  getItemsBtId(id: any): Observable<any[]> {
    this.spinner.show();
    const col = collection(this.firestore, this.collectionName);
    const resp = collectionData(col, { idField: id });
    this.spinner.hide();
    return resp;
  }

  // Update: Update an existing item by document ID
  async updateItem(itemId: string, data: any): Promise<void> {
    this.spinner.hide();
    const docRef = doc(this.firestore, `${this.collectionName}/${itemId}`);
    const resp = await updateDoc(docRef, data);
    this.spinner.hide();
    return resp;
  }

  // Delete: Delete an item by document ID
  async deleteItem(itemId: string): Promise<void> {
    this.spinner.show();
    const docRef = doc(this.firestore, `${this.collectionName}/${itemId}`);
    const resp = await deleteDoc(docRef);
    this.spinner.hide();
    return
  }
}
