import {ParsedPlaceholder} from '../../../message/placeholder-parser';
import {FillPlaceholderStrategy} from './base/fill-placeholder.strategy';

export class FillHtmlPlaceholder extends FillPlaceholderStrategy {

  fill(text: string, parsedPlaceholder: ParsedPlaceholder): string {
    return text
      .replace(`{$${this.placeholder}}`, parsedPlaceholder.expression)
      .replace(new RegExp(`{${this.placeholder}}`, 'g'), parsedPlaceholder.expression);
  }

}
