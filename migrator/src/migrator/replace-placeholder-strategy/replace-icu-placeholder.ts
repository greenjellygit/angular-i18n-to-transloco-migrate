import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {ParsedPlaceholder, ParsedPlaceholdersMap, prepareTranslationText, TranslationKey} from '../index';
import {ReplacePlaceholderStrategy} from './base/replace-placeholder.strategy';

export class ReplaceIcuPlaceholder extends ReplacePlaceholderStrategy {

  replace(text: string, parsedPlaceholder: ParsedPlaceholder, message: Message,
          placeholdersMap: ParsedPlaceholdersMap, localeBundle: ParsedTranslationBundle, translationKey: TranslationKey): string {
    const icuMessage = message.placeholderToMessage[this.placeholder];
    const parsedIcuTranslation = localeBundle.translations[icuMessage.id];
    const icuToText = prepareTranslationText(parsedIcuTranslation, icuMessage, placeholdersMap, localeBundle, translationKey);
    return text.replace(`{$${this.placeholder}}`, icuToText);
  }

}
