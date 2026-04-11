import { Component, inject, signal, NgZone, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  authService = inject(AuthService);
  sidebarService = inject(SidebarService);
  private ngZone = inject(NgZone);

  mobileOpen = signal(false);

  @Output() menuToggle = new EventEmitter<boolean>();

  ngOnInit() {}

  get collapsed() {
    return this.sidebarService.isCollapsed();
  }

  toggle() {
    this.ngZone.run(() => {
      this.sidebarService.toggle();
    });
  }

  toggleMobile() {
    this.ngZone.run(() => {
      this.mobileOpen.update((v) => !v);
      this.menuToggle.emit(this.mobileOpen());
    });
  }

  closeMobile() {
    this.ngZone.run(() => {
      this.mobileOpen.set(false);
      this.menuToggle.emit(false);
    });
  }
}
