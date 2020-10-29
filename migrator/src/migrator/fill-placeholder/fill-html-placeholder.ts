import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedPlaceholder} from '../index';
import {FillPlaceholderStrategy} from './base/fill-placeholder.strategy';

export class FillHtmlPlaceholder extends FillPlaceholderStrategy {

  fill(text: string, parsedPlaceholder: ParsedPlaceholder, message: Message): string {
    return text
      .replace(`{$${this.placeholder}}`, message.placeholders[this.placeholder])
      .replace(new RegExp(`{${this.placeholder}}`, 'g'), message.placeholders[this.placeholder]);
  }

}
