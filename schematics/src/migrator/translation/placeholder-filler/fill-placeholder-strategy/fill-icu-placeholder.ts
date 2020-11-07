import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {LocaleConfig} from '../../../angular/configuration-reader';
import {ParsedPlaceholder, ParsedPlaceholdersMap} from '../../../message/placeholder-parser';
import {PlaceholderFiller} from '../placeholder-filler';
import {FillPlaceholderStrategy} from './base/fill-placeholder.strategy';

export class FillIcuPlaceholder extends FillPlaceholderStrategy {

  fill(text: string, parsedPlaceholder: ParsedPlaceholder, message: Message, placeholdersMap: ParsedPlaceholdersMap, localeConfig: LocaleConfig): string {
    const icuMessage = message.placeholderToMessage[this.placeholder];
    const placeholderFiller = new PlaceholderFiller();
    const icuToText = placeholderFiller.fillPlaceholders(icuMessage, placeholdersMap, localeConfig);
    return text.replace(`{$${this.placeholder}}`, icuToText);
  }

}
