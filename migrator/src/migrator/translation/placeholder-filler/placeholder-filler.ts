import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {ParsedTranslation} from '@angular/localize/src/utils';
import {MessageUtils, TranslationKey} from '../../message/message.utils';
import {ParsedPlaceholdersMap} from '../../message/placeholder-parser';
import {FillPlaceholderStrategyBuilder} from './fill-placeholder-strategy/base/fill-placeholder-strategy.builder';

export class PlaceholderFiller {

  public fill(message: Message, placeholdersMap: ParsedPlaceholdersMap, localeBundle: ParsedTranslationBundle, parsedTranslation: ParsedTranslation): GenerateTranslationSummary {
    try {
      return {
        translationText: this.fillPlaceholders(parsedTranslation, message, placeholdersMap, localeBundle)
      };
    } catch (error) {
      if (error instanceof MissingTranslationError) {
        return {
          translationText: 'MISSING TRANSLATION',
          error
        };
      }
    }
  }

  public fillPlaceholders(parsedTranslation: ParsedTranslation, message: Message, placeholdersMap: ParsedPlaceholdersMap, localeBundle: ParsedTranslationBundle) {
    if (!parsedTranslation) {
      const translationKey = MessageUtils.prepareTranslationKey(message.id);
      throw new MissingTranslationError('Missing translation', translationKey, localeBundle.locale);
    }

    const fillPlaceholderStrategyBuilder = new FillPlaceholderStrategyBuilder();
    const placeholderNames: string[] = parsedTranslation.placeholderNames.concat(Object.keys(message.placeholders));

    let text = parsedTranslation.text;
    for (const placeholder of placeholderNames) {
      const fillPlaceholderStrategy = fillPlaceholderStrategyBuilder.createStrategy(placeholder);
      text = fillPlaceholderStrategy.fill(text, placeholdersMap[placeholder], message, placeholdersMap, localeBundle);
    }
    return text;
  }

}

export interface GenerateTranslationSummary {
  translationText: string;
  error?: MissingTranslationError;
}

export class MissingTranslationError extends Error {
  translationKey: TranslationKey;
  locale: string;

  constructor(public message: string, translationKey: TranslationKey, locale: string) {
    super(message);

    this.name = 'MissingTranslationError';
    this.stack = (new Error() as any).stack;

    this.translationKey = translationKey;
    this.locale = locale;
  }
}
