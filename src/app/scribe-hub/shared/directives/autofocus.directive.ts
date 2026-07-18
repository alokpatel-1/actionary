import { Directive, ElementRef, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
  standalone: false
})
export class AutofocusDirective implements OnInit {
  private el = inject(ElementRef);

  ngOnInit() {
    setTimeout(() => {
      this.el.nativeElement.focus();
    }, 100);
  }
}
