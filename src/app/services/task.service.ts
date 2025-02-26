import { inject, Injectable } from '@angular/core'; import {
  Firestore,
  getFirestore,
  collection,
  getDocs,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  where
} from '@angular/fire/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { Observable, throwError } from 'rxjs';
import { firebaseConfig } from '../app.config';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActionaryUtilService } from './actionary-util.service';
import { query } from '@firebase/firestore';
import { Task } from '../actionary/components/create-task/create-task.component';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private collectionName = 'items'; // Your Firestore collection name
  app = initializeApp(firebaseConfig);
  db = getFirestore(this.app); //Get an instance of Firestore

  constructor(private firestore: Firestore) { }
  private readonly spinner = inject(NgxSpinnerService);
  private readonly utilService = inject(ActionaryUtilService);

  async getAllItems() {
    this.spinner.show();
    try {
      const querySnapshot = await getDocs(collection(this.db, this.collectionName));
      let items: any[] = []; // Clear the array before pushing new data
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      this.spinner.hide();
      return items;
    } catch (error) {
      console.error('Error fetching cities:', error);
      this.spinner.hide();
      return [];
    }
  }

  // Create: Add a new item
  async createItem(data: any): Promise<any> {
    this.spinner.show();
    try {
      if (!data) throw new Error("Invalid data provided.");
      [data].forEach(data => this.utilService.setIsEditableFalse(data));
      const col = collection(this.firestore, this.collectionName);
      const resp = await addDoc(col, data);
      this.utilService.showSuccess("Item created successfully.");
      return resp;
    } catch (error: any) {
      this.utilService.showError(`Error creating item: ${error.message}`);
      throw error;
    } finally {
      this.spinner.hide();
    }
  }

  // Read: Get all items (with realtime updates)
  getItemsById(id: any): Observable<any[]> {
    this.spinner.show();
    try {
      if (!id) throw new Error("Invalid ID provided.");
      const col = collection(this.firestore, this.collectionName);
      return collectionData(col, { idField: id });
    } catch (error: any) {
      this.utilService.showError(`Error fetching items: ${error.message}`);
      return throwError(() => new Error("Failed to fetch items."));
    } finally {
      this.spinner.hide();
    }
  }

  // Update: Update an existing item by document ID
  async updateItem(itemId: string, data: any): Promise<void> {
    this.spinner.show();
    try {
      if (!itemId || !data) throw new Error("Invalid parameters provided.");
      [data].forEach(data => this.utilService.setIsEditableFalse(data));
      const docRef = doc(this.firestore, `${this.collectionName}/${itemId}`);
      await updateDoc(docRef, data);
      this.utilService.showSuccess("Item updated successfully.");
    } catch (error: any) {
      this.utilService.showError(`Error updating item: ${error.message}`);
      throw error;
    } finally {
      this.spinner.hide();
    }
  }

  // Delete: Delete an item by document ID
  async deleteItem(itemId: string): Promise<void> {
    this.spinner.show();
    try {
      if (!itemId) throw new Error("Invalid item ID.");
      const docRef = doc(this.firestore, `${this.collectionName}/${itemId}`);
      await deleteDoc(docRef);
      this.utilService.showSuccess("Item deleted successfully.");
    } catch (error: any) {
      this.utilService.showError(`Error deleting item: ${error.message}`);
      throw error;
    } finally {
      this.spinner.hide();
    }
  }

  // Filter items by email
  async getItesmsFilterByEmail(email?: string): Promise<any> {
    this.spinner.show();
    try {
      if (!email) {
        email = JSON.parse(sessionStorage.getItem('email') || 'null');
        if (!email) throw new Error("No email found in session storage.");
      }

      const filterData: any[] = [];
      const docRef = collection(this.db, this.collectionName);
      const queryJSON = query(docRef,
        where('user', '==', email),
        where('isDeleted', '==', false),
      );
      const querySnapshot = await getDocs(queryJSON);

      if (querySnapshot.empty) {
        this.utilService.showError(`No items found for email: ${email}`);
        return [];
      }

      querySnapshot.forEach((doc) => {
        filterData.push({ id: doc.id, ...doc.data() });
      });

      return filterData;
    } catch (error: any) {
      this.utilService.showError(`Error filtering items by email: ${error.message}`);
      throw error;
    } finally {
      this.spinner.hide();
    }
  }
}
