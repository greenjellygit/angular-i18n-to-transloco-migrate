import {ParsedLocaleConfig} from '../angular/configuration-reader';
import {TemplateMessage} from '../angular/template-message-visitor';
import {JsonKey, TransLocoFile} from '../transloco/transloco-writer';
import {GenerateTranslationSummary, PlaceholderFiller} from './placeholder-filler/placeholder-filler';

export class TranslationGenerator {

  private placeholderFiller: PlaceholderFiller = new PlaceholderFiller();
  private generateTranslationSummaries: GenerateTranslationSummary[] = [];

  public generate(templateMessage: TemplateMessage, transLocoFiles: TransLocoFile[], localeConfigs: ParsedLocaleConfig, templateContent: string): void {
    for (const locoFile of transLocoFiles) {
      const parsedLocaleConfig = localeConfigs[locoFile.lang];
      const translation = this.placeholderFiller.fill(templateMessage, parsedLocaleConfig, templateContent);
      this.addToTranslocoFile(locoFile, templateMessage, translation);
      this.generateTranslationSummaries.push(translation);
    }
  }

  private addToTranslocoFile(locoFile: TransLocoFile, templateMessage: TemplateMessage, translation: GenerateTranslationSummary): void {
    locoFile.entries[templateMessage.key.group] = locoFile.entries[templateMessage.key.group] || {} as JsonKey;
    locoFile.entries[templateMessage.key.group][templateMessage.key.id] = translation.translationText;
  }

  public getSummary(): GenerateTranslationSummary[] {
    return this.generateTranslationSummaries;
  }

}
