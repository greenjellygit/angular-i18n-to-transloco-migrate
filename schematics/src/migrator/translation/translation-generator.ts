import {TemplateMessage} from '../angular/template-message-visitor';
import {JsonKey, ParsedLocaleConfig, TransLocoFile} from '../transloco/transloco-writer';
import {GenerateTranslationSummary, PlaceholderFiller} from './placeholder-filler/placeholder-filler';

export class TranslationGenerator {

  private placeholderFiller: PlaceholderFiller = new PlaceholderFiller();
  private generateTranslationSummaries: GenerateTranslationSummary[] = [];

  public generate(templateMessage: TemplateMessage, transLocoFiles: TransLocoFile[], localeConfigs: ParsedLocaleConfig): void {
    for (const locoFile of transLocoFiles) {
      const localeBundle = localeConfigs[locoFile.lang].bundle;
      const parsedTranslation = localeBundle.translations[templateMessage.message.id];
      const translation = this.placeholderFiller.fill(templateMessage, localeBundle, parsedTranslation);
      locoFile.entries[templateMessage.key.group] = locoFile.entries[templateMessage.key.group] || {} as JsonKey;
      locoFile.entries[templateMessage.key.group][templateMessage.key.id] = translation.translationText;
      this.generateTranslationSummaries.push(translation);
    }
  }

  public getSummary(): GenerateTranslationSummary[] {
    return this.generateTranslationSummaries;
  }

}
