import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedPlaceholder} from '../index';
import {ReplacePlaceholderStrategy} from './base/replace-placeholder.strategy';

export class ReplaceDefaultPlaceholder extends ReplacePlaceholderStrategy {

  replace(text: string, parsedPlaceholder: ParsedPlaceholder, message: Message): string {
    return text
      .replace(`{$${this.placeholder}}`, message.placeholders[this.placeholder])
      .replace(new RegExp(`{${this.placeholder}}`, 'g'), message.placeholders[this.placeholder]);
  }

}
