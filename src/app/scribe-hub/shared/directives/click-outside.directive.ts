import { Directive, ElementRef, Output, EventEmitter, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: false
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();
  private el = inject(ElementRef);

  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement: any) {
    const isClickedInside = this.el.nativeElement.contains(targetElement);
    if (!isClickedInside) {
      this.clickOutside.emit();
    }
  }
}
