import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { DialogComponent } from '../shared/components/dialog/dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, DialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  constructor(private themeService: ThemeService) { }

  ngOnInit(): void {
    this.themeService.currentTheme$.subscribe();
  }
}
