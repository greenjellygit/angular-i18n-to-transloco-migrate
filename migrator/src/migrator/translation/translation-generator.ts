import {TranslationKey} from '../message/message.utils';
import {ParsedPlaceholdersMap} from '../message/placeholder-parser';
import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {JsonKey, ParsedLocaleConfig, TransLocoFile} from '../transloco/transloco-writer';
import {GenerateTranslationSummary, PlaceholderFiller} from './placeholder-filler/placeholder-filler';

export class TranslationGenerator {

  private placeholderFiller: PlaceholderFiller = new PlaceholderFiller();

  public generate(message: Message, translationKey: TranslationKey, transLocoFiles: TransLocoFile[], localeConfigs: ParsedLocaleConfig, placeholdersMap: ParsedPlaceholdersMap) {
    const translations: GenerateTranslationSummary[] = [];
    for (const locoFile of transLocoFiles) {
      const localeBundle = localeConfigs[locoFile.lang].bundle;
      const parsedTranslation = localeBundle.translations[message.id];
      const translation = this.placeholderFiller.fill(message, placeholdersMap, localeBundle, parsedTranslation);
      locoFile.entries[translationKey.group] = locoFile.entries[translationKey.group] || {} as JsonKey;
      locoFile.entries[translationKey.group][translationKey.id] = translation.translationText;
      translations.push(translation);
    }
    return translations;
  }

}
