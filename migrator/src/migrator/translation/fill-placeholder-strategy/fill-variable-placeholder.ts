import {ParsedPlaceholder} from '../../message/placeholder-parser';
import {StringUtils} from '../../string.utils';
import {FillPlaceholderStrategy} from './base/fill-placeholder.strategy';

export class FillVariablePlaceholder extends FillPlaceholderStrategy {

  fill(text: string, parsedPlaceholder: ParsedPlaceholder): string {
    const hasOthers = text.match(/(\S+)(?= {.+?})/g).some(e => e === 'other');
    text = hasOthers ? text : StringUtils.remove(text, text.length - 1, 1) + ' other {}}';
    return text.replace(this.placeholder, `${parsedPlaceholder.variableName}`);
  }

}
