import {logging} from '@angular-devkit/core';
import {ConfigurationReader, ParsedLocaleConfig} from './angular/configuration-reader';
import {TemplateParser} from './angular/template-parser';
import {Logger} from './logging/logger';
import {StyleMigrator} from './style/style-migrator';
import {TemplateMigrator} from './template/template-migrator';
import {TranslationGenerator} from './translation/translation-generator';
import {TranslocoWriter} from './transloco/transloco-writer';
import {FileUtils} from './utils/file.utils';

export class Migrator {

  private readonly logger: Logger;
  private configurationReader: ConfigurationReader = new ConfigurationReader();
  private templateParser: TemplateParser = new TemplateParser();
  private translationGenerator: TranslationGenerator = new TranslationGenerator();
  private templateMigrator: TemplateMigrator = new TemplateMigrator();
  private styleMigrator: StyleMigrator = new StyleMigrator();
  private translocoWriter = new TranslocoWriter();

  constructor(logger: logging.LoggerApi) {
    this.logger = new Logger(logger);
  }

  public migrateProject(): void {
    const parsedTemplateFiles = FileUtils.findFiles('src/**/*.html')
      .map(filePath => this.templateParser.parse(filePath));

    const localeConfigs: ParsedLocaleConfig = this.configurationReader.getLocales();
    const transLocoFiles = this.translocoWriter.initializeFiles(localeConfigs);

    const templatesWithMessages = parsedTemplateFiles.filter(e => e.templateMessages.length > 0);
    for (const parsedTemplate of templatesWithMessages) {
      let templateContent = parsedTemplate.content;

      for (const templateMessage of parsedTemplate.templateMessages) {
        this.translationGenerator.generate(templateMessage, transLocoFiles, localeConfigs);
        templateContent = this.templateMigrator.migrate(templateMessage, templateContent, this.configurationReader.getSelectorPrefix());
      }

      this.styleMigrator.updateStyleFile(parsedTemplate);
      FileUtils.writeToFile(this.templateMigrator.removeI18nAttributes(templateContent), parsedTemplate.filePath);
    }
    this.translocoWriter.saveFiles('src/assets/i18n/', transLocoFiles);

    this.logger.printTemplatesStats(parsedTemplateFiles, localeConfigs);
    this.logger.printTranslationSummary(this.translationGenerator.getSummary());
    this.logger.printMigrationSummary(this.templateMigrator.getSummary());
    this.logger.printMigrationTime();
  }

}
