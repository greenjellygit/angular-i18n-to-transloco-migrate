import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {LocaleConfig} from '../../angular/configuration-reader';
import {TemplateAttrMessage, TemplateMessage} from '../../angular/template-message-visitor';
import {MessageUtils, TranslationKey} from '../../message/message.utils';
import {ParsedPlaceholdersMap} from '../../message/placeholder-parser';
import {FillPlaceholderStrategyBuilder} from './fill-placeholder-strategy/base/fill-placeholder-strategy.builder';

export class PlaceholderFiller {

  private fillPlaceholderStrategyBuilder = new FillPlaceholderStrategyBuilder();

  public fill(templateMessage: TemplateMessage, localeConfig: LocaleConfig, templateContent: string): GenerateTranslationSummary {
    let result: string;
    let error: MissingTranslationError;

    try {
      result = this.fillPlaceholders(templateMessage.message, templateMessage.placeholders, localeConfig);
    } catch (e) {
      if (e instanceof MissingTranslationError) {
        result = this.getOriginalPartOfTemplate(templateMessage, templateContent);
        error = e;
      } else {
        throw e;
      }
    }
    return {
      translationText: result,
      error
    };
  }

  public fillPlaceholders(message: Message, placeholdersMap: ParsedPlaceholdersMap, localeConfig: LocaleConfig): string {
    const parsedTranslation = localeConfig.translations[message.id];

    if (!parsedTranslation) {
      const translationKey = MessageUtils.prepareTranslationKey(message);
      throw new MissingTranslationError('Missing translation', translationKey, localeConfig.lang);
    }

    const placeholderNames: string[] = parsedTranslation.placeholderNames.concat(Object.keys(message.placeholders));

    let text = parsedTranslation.text;
    for (const placeholder of placeholderNames) {
      if (!placeholdersMap[placeholder] && !message.placeholderToMessage[placeholder]) {
        continue;
      }

      const fillPlaceholderStrategy = this.fillPlaceholderStrategyBuilder.createStrategy(placeholder);
      text = fillPlaceholderStrategy.fill(text, placeholdersMap[placeholder], message, placeholdersMap, localeConfig);
    }
    return text;
  }

  private getOriginalPartOfTemplate(templateMessage: TemplateMessage, templateContent: string): string {
    let partOfTemplate = templateContent.substring(templateMessage.sourceBounds.startOffset, templateMessage.sourceBounds.endOffset);
    if (templateMessage instanceof TemplateAttrMessage) {
      partOfTemplate = partOfTemplate.replace(/^.*="(.*)"$/g, '$1');
    }
    return partOfTemplate;
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
