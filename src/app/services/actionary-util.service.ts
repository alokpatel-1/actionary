import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ActionaryUtilService {
  isSideBarCloser: WritableSignal<boolean> = signal(false);

  constructor() { }
}
