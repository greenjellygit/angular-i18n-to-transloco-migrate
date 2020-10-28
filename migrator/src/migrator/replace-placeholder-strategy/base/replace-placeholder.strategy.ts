import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {ParsedPlaceholder, ParsedPlaceholdersMap, TranslationKey} from '../../index';

export abstract class ReplacePlaceholderStrategy {

  constructor(protected placeholder: string) { }

  abstract replace(text: string, parsedPlaceholder: ParsedPlaceholder, message?: Message,
                   placeholdersMap?: ParsedPlaceholdersMap, localeBundle?: ParsedTranslationBundle, translationKey?: TranslationKey): string;

}
