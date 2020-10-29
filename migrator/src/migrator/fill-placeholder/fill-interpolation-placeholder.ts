import {ParsedPlaceholder} from '../index';
import {FillPlaceholderStrategy} from './base/fill-placeholder.strategy';

export class FillInterpolationPlaceholder extends FillPlaceholderStrategy {

  fill(text: string, parsedPlaceholder: ParsedPlaceholder): string {
    return text
      .replace(`{$${this.placeholder}}`, `{{${parsedPlaceholder.variableName}}}`)
      .replace(new RegExp(`{${this.placeholder}}`, 'g'), ` {${parsedPlaceholder.variableName}} `);
  }

}
