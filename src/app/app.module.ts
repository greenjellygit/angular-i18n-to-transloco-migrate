import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {TranslocoMessageFormatModule} from '@ngneat/transloco-messageformat';

import {AppComponent} from './app.component';
import {CamelCaseDirective} from './camel-case.directive';
import {TranslocoRootModule} from './transloco/transloco-root.module';

@NgModule({
  declarations: [
    AppComponent,
    CamelCaseDirective
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    TranslocoRootModule,
    TranslocoMessageFormatModule.init()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
