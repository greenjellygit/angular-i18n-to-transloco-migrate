import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {ParsedPlaceholder, ParsedPlaceholdersMap} from '../../../../message/placeholder-parser';

export abstract class FillPlaceholderStrategy {

  constructor(protected placeholder: string) { }

  abstract fill(text: string, parsedPlaceholder: ParsedPlaceholder, message?: Message, placeholdersMap?: ParsedPlaceholdersMap, localeBundle?: ParsedTranslationBundle): string;

}
