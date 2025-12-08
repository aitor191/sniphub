import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert';
}

export interface DialogResult {
  confirmed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialog$ = new BehaviorSubject<DialogConfig | null>(null);
  private result$ = new BehaviorSubject<DialogResult | null>(null);

  getDialog(): Observable<DialogConfig | null> {
    return this.dialog$.asObservable();
  }

  getResult(): Observable<DialogResult | null> {
    return this.result$.asObservable();
  }

  confirm(config: DialogConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialog$.next({ ...config, type: 'confirm' });
      
      const subscription = this.result$.subscribe(result => {
        if (result !== null) {
          subscription.unsubscribe();
          this.dialog$.next(null);
          this.result$.next(null);
          resolve(result.confirmed);
        }
      });
    });
  }

  alert(config: DialogConfig): Promise<void> {
    return new Promise((resolve) => {
      this.dialog$.next({ ...config, type: 'alert' });
      
      const subscription = this.result$.subscribe(result => {
        if (result !== null) {
          subscription.unsubscribe();
          this.dialog$.next(null);
          this.result$.next(null);
          resolve();
        }
      });
    });
  }

  close(confirmed: boolean): void {
    this.result$.next({ confirmed });
  }
}