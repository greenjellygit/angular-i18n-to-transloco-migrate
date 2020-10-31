import {logging} from '@angular-devkit/core';
import {ConfigurationReader} from './angular/configuration-reader';
import {TemplateParser} from './angular/template-parser';
import {Logger} from './logging/logger';
import {MessageInfo, MessageUtils} from './message/message.utils';
import {PlaceholderParser} from './message/placeholder-parser';
import {StyleMigrator} from './style/style-migrator';
import {TemplateMigrator} from './template/template-migrator';
import {GenerateTranslationSummary} from './translation/placeholder-filler/placeholder-filler';
import {TranslationGenerator} from './translation/translation-generator';
import {ParsedLocaleConfig, TranslocoWriter} from './transloco/transloco-writer';
import {FileUtils} from './utils/file.utils';

export class Migrator {

  private configurationReader: ConfigurationReader = new ConfigurationReader();
  private templateParser: TemplateParser = new TemplateParser();
  private translationGenerator: TranslationGenerator = new TranslationGenerator();
  private placeholderParser: PlaceholderParser = new PlaceholderParser();
  private templateMigrator: TemplateMigrator = new TemplateMigrator();
  private styleMigrator: StyleMigrator = new StyleMigrator();
  private translocoWriter = new TranslocoWriter();
  private logger: Logger;

  constructor(logger: logging.LoggerApi) {
    this.logger = new Logger(logger);
  }

  public migrateProject(): void {
    const start = process.hrtime();

    const parsedTemplateFiles = FileUtils.findFiles('src/**/*.html')
      .map(filePath => this.templateParser.parse(filePath));

    const localeConfigs: ParsedLocaleConfig = this.configurationReader.getLocales();
    const transLocoFiles = this.translocoWriter.initializeFiles(localeConfigs);
    const migrationInfo: MessageInfo[] = [];
    const summary: GenerateTranslationSummary[] = [];

    this.logger.printTemplatesStats(parsedTemplateFiles, localeConfigs);

    const templatesWithI18n = parsedTemplateFiles.filter(e => e.templateElements.length > 0);
    for (const parsedTemplate of templatesWithI18n) {
      let templateContent = parsedTemplate.content;
      for (const templateElement of parsedTemplate.templateElements) {

        const message = templateElement.message;
        const translationKey = MessageUtils.prepareTranslationKey(message.id);
        const placeholdersMap = this.placeholderParser.parse(message);

        migrationInfo.push(MessageUtils.analyzeMessage(message, translationKey));

        summary.push(...this.translationGenerator.generate(message, translationKey, transLocoFiles, localeConfigs, placeholdersMap));
        templateContent = this.templateMigrator.migrate(translationKey, templateElement, placeholdersMap, templateContent);
      }
      this.styleMigrator.updateStyleFile(parsedTemplate);

      const cleanedTemplate = this.templateMigrator.removeI18nTags(templateContent);
      FileUtils.writeToFile(cleanedTemplate, parsedTemplate.filePath);
    }

    this.translocoWriter.saveFiles('src/assets/i18n/', transLocoFiles);

    this.logger.printErrors(summary, migrationInfo);
    this.logger.printMigrationTime(start);
  }

}
