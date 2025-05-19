// shared/directives/body/body.directive.ts
import { Directive } from '@angular/core';

@Directive({
  selector: '[body]',
  standalone: true,
})
export class BodyDirective {
  constructor() {}
}