import {ParsedPlaceholder} from '../index';
import {StringUtils} from '../string.utils';
import {ReplacePlaceholderStrategy} from './base/replace-placeholder.strategy';

export class ReplaceVariablePlaceholder extends ReplacePlaceholderStrategy {

  replace(text: string, parsedPlaceholder: ParsedPlaceholder): string {
    const hasOthers = text.match(/(\S+)(?= {.+?})/g).some(e => e === 'other');
    text = hasOthers ? text : StringUtils.remove(text, text.length - 1, 1) + ' other {}}';
    return text.replace(this.placeholder, `${parsedPlaceholder.variableName}`);
  }

}
