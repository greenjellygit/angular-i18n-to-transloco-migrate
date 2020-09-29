import { Directive } from '@angular/core';

@Directive({
  selector: '[appCamelCase]'
})
export class CamelCaseDirective {

  constructor() { }

}
