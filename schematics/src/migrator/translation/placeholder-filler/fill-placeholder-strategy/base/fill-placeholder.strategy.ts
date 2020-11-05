import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {LocaleConfig} from '../../../../angular/configuration-reader';
import {ParsedPlaceholder, ParsedPlaceholdersMap} from '../../../../message/placeholder-parser';

export abstract class FillPlaceholderStrategy {

  constructor(protected placeholder: string) { }

  abstract fill(text: string, parsedPlaceholder: ParsedPlaceholder, message?: Message, placeholdersMap?: ParsedPlaceholdersMap, localeConfig?: LocaleConfig): string;

}
