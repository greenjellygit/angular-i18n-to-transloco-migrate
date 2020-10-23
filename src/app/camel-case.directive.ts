import {Directive, Input} from '@angular/core';

@Directive({
  selector: '[appCamelCase]'
})
export class CamelCaseDirective {

  @Input('appCamelCase')
  public set appCamelCase(text: string) {
    console.log(`appCamelCase - input - ${text}!`);
  }

  constructor() {
    console.log(`appCamelCase - constructor!`);
  }

}
