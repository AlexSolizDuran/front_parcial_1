import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private _collapsed = signal(false);

  collapsed = computed(() => this._collapsed());

  toggle() {
    this._collapsed.update((v) => !v);
  }

  setCollapsed(value: boolean) {
    this._collapsed.set(value);
  }

  isCollapsed(): boolean {
    return this._collapsed();
  }
}
