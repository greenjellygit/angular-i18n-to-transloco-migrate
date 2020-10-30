import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {AngularParseUtils} from './angular-parse.utils';
import {ConfigurationReader} from './angular/configuration-reader';
import {FileUtils} from './file.utils';
import {Logger} from './logging/logger';
import {MessageInfo, MessageUtils} from './message/message.utils';
import {PlaceholderParser} from './message/placeholder-parser';
import {StyleMigrator} from './style/style-migrator';
import {TemplateMigrator} from './template/template-migrator';
import {ParsedLocaleConfig, TransLocoUtils} from './trans-loco.utils';
import {GenerateTranslationSummary} from './translation/placeholder-filler/placeholder-filler';
import {TranslationGenerator} from './translation/translation-generator';

export function migrator(_options: any): Rule {

  return (tree: Tree, _context: SchematicContext) => {
    const start = process.hrtime();

    const configurationReader: ConfigurationReader = new ConfigurationReader();
    const placeholderParser: PlaceholderParser = new PlaceholderParser();
    const templateMigrator: TemplateMigrator = new TemplateMigrator();
    const styleMigrator: StyleMigrator = new StyleMigrator();
    const translationGenerator: TranslationGenerator = new TranslationGenerator();
    const logger: Logger = new Logger(_context.logger);

    const parsedTemplateFiles = FileUtils.findFiles('src/**/*.html')
      .map(filePath => AngularParseUtils.parseTemplateFile(filePath));

    const localeConfigs: ParsedLocaleConfig = configurationReader.getLocales();
    const transLocoFiles = TransLocoUtils.initializeLocoFiles(localeConfigs);
    const migrationInfo: MessageInfo[] = [];
    const summary: GenerateTranslationSummary[] = [];

    logger.printTemplatesStats(parsedTemplateFiles, localeConfigs);

    const templatesWithI18n = parsedTemplateFiles.filter(e => e.i18nMap.length > 0);
    for (const parsedTemplate of templatesWithI18n) {
      let templateContent = parsedTemplate.content;
      for (const templateElement of parsedTemplate.i18nMap) {

        const message = templateElement.message;
        const translationKey = MessageUtils.prepareTranslationKey(message.id);
        const placeholdersMap = placeholderParser.parse(message);

        migrationInfo.push(MessageUtils.analyzeMessage(message, translationKey));

        summary.push(...translationGenerator.generate(message, translationKey, transLocoFiles, localeConfigs, placeholdersMap));
        templateContent = templateMigrator.migrate(translationKey, templateElement, placeholdersMap, templateContent);
      }
      styleMigrator.updateStyleFile(parsedTemplate);

      const cleanedTemplate = templateMigrator.removeI18nTags(templateContent);
      FileUtils.writeToFile(cleanedTemplate, parsedTemplate.filePath);
    }

    TransLocoUtils.saveTransLocoFiles('src/assets/i18n/', transLocoFiles);

    logger.printErrors(summary, migrationInfo);
    logger.printMigrationTime(start);

    return tree;
  };

}
