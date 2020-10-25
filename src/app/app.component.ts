import {Component} from '@angular/core';
import {$e} from 'codelyzer/angular/styles/chars';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  maxNumberOfInvitations: number = 1;
  numberOfUsersLimit: number = 100;
  objSelect: any = {
    context: {
      value: 'UNIT'
    }
  };
  list: string[] = ['a', 'b', 'c'];
  public value = 'zxc';
  addon = {requestsCount: 2, requestsCountAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: 'asd'};
  post = {important: true, showNewFlag: true};
  formGroup: {
    get: (asd: string) => ({value: 0});
  };
  formattedAvg: any;
  data: {userCount: number} = {userCount: 15};
  usersPercentage: any = 10;

  updateInvitationsNUmber($event: Event) {
    this.maxNumberOfInvitations = +$event.target['value'];
  }

  updateSelectValue($event: Event) {
    this.objSelect.context.value = $event.target['value'];
  }

  updateValue($event: Event) {
    this.value = $event.target['value'];
    this.addon.requestsCount = Number(this.value);
  }

  filterByImportant() {

  }

  filterByNew() {

  }

  getStyle() {

  }
}
