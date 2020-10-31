import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {ParsedPlaceholder, ParsedPlaceholdersMap} from '../../../message/placeholder-parser';
import {PlaceholderFiller} from '../placeholder-filler';
import {FillPlaceholderStrategy} from './base/fill-placeholder.strategy';

export class FillIcuPlaceholder extends FillPlaceholderStrategy {

  fill(text: string, parsedPlaceholder: ParsedPlaceholder, message: Message, placeholdersMap: ParsedPlaceholdersMap, localeBundle: ParsedTranslationBundle): string {
    const icuMessage = message.placeholderToMessage[this.placeholder];
    const parsedIcuTranslation = localeBundle.translations[icuMessage.id];
    const placeholderFiller = new PlaceholderFiller();
    const icuToText = placeholderFiller.fillPlaceholders(parsedIcuTranslation, icuMessage, placeholdersMap, localeBundle);
    return text.replace(`{$${this.placeholder}}`, icuToText);
  }

}
