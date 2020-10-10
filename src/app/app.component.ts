import {Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  maxNumberOfInvitations: number = 1;
  numberOfUsersLimit: number = 100;
  objSelect: any = {context: {
    value: 'UNIT'
    }};
  list: string[] = ['a', 'b', 'c'];

  updateInvitationsNUmber($event: Event) {
    this.maxNumberOfInvitations = +$event.target['value'];
  }

  updateSelectValue($event: Event) {
    this.objSelect.context.value = $event.target['value'];
  }
}
