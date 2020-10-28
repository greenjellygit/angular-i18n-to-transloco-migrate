import {ParsedPlaceholder} from '../index';
import {ReplacePlaceholderStrategy} from './base/replace-placeholder.strategy';

export class ReplaceInterpolationPlaceholder extends ReplacePlaceholderStrategy {

  replace(text: string, parsedPlaceholder: ParsedPlaceholder): string {
    return text
      .replace(`{$${this.placeholder}}`, `{{${parsedPlaceholder.variableName}}}`)
      .replace(new RegExp(`{${this.placeholder}}`, 'g'), ` {${parsedPlaceholder.variableName}} `);
  }

}
