import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DialogConfig } from '../../../app/core/services/dialog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss'
})
export class DialogComponent implements OnInit, OnDestroy {
  dialog: DialogConfig | null = null;
  private subscription?: Subscription;

  constructor(private dialogService: DialogService) {}

  ngOnInit(): void {
    this.subscription = this.dialogService.getDialog().subscribe(
      dialog => {
        this.dialog = dialog;
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  confirm(): void {
    this.dialogService.close(true);
  }

  cancel(): void {
    this.dialogService.close(false);
  }

  get isConfirm(): boolean {
    return this.dialog?.type === 'confirm';
  }
}