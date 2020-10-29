import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {AngularParseUtils} from './angular-parse.utils';
import {FileUtils} from './file.utils';
import {Logger} from './logging/logger';
import {MessageInfo, MessageUtils} from './message/message.utils';
import {PlaceholderParser} from './message/placeholder-parser';
import {SchematicsUtils} from './schematics.utils';
import {CssDeEncapsulator} from './style/css-de-encapsulator';
import {TemplateMigrator} from './template/template-migrator';
import {JsonKey, ParsedLocaleConfig, TransLocoUtils} from './trans-loco.utils';
import {GenerateTranslationSummary, TranslationGenerator} from './translation/translation-generator';

export function migrator(_options: any): Rule {

  return (tree: Tree, _context: SchematicContext) => {
    const start = process.hrtime();

    const placeholderParser: PlaceholderParser = new PlaceholderParser();
    const translationGenerator: TranslationGenerator = new TranslationGenerator();
    const templateMigrator: TemplateMigrator = new TemplateMigrator();
    const cssDeEncapsulator: CssDeEncapsulator = new CssDeEncapsulator();
    const logger: Logger = new Logger(_context.logger);

    const parsedTemplateFiles = FileUtils.findFiles('src/**/*.html')
      .map(filePath => AngularParseUtils.parseTemplateFile(filePath));

    const localeConfigs: ParsedLocaleConfig = SchematicsUtils.getDefaultProjectLocales();
    const transLocoFiles = TransLocoUtils.initializeLocoFiles(localeConfigs);
    const migrationInfo: MessageInfo[] = [];
    const generateTranslationSummaries: GenerateTranslationSummary[] = [];

    logger.printTemplatesStats(parsedTemplateFiles, localeConfigs);

    const templatesWithI18n = parsedTemplateFiles.filter(e => e.i18nMap.length > 0);
    for (const parsedTemplate of templatesWithI18n) {
      let templateContent = parsedTemplate.content;
      for (const templateElement of parsedTemplate.i18nMap) {

        const message = templateElement.message;
        const translationKey = MessageUtils.prepareTranslationKey(message.id);
        const placeholdersMap = placeholderParser.parse(message);

        migrationInfo.push(MessageUtils.analyzeMessage(message, translationKey));

        for (const locoFile of transLocoFiles) {
          const localeBundle = localeConfigs[locoFile.lang].bundle;
          const parsedTranslation = localeBundle.translations[message.id];
          const summary = translationGenerator.generate(message, placeholdersMap, localeBundle, parsedTranslation);
          locoFile.entries[translationKey.group] = locoFile.entries[translationKey.group] || {} as JsonKey;
          locoFile.entries[translationKey.group][translationKey.id] = summary.translationText;
          generateTranslationSummaries.push(summary);
        }
        templateContent = templateMigrator.migrate(translationKey, templateElement, placeholdersMap, templateContent);
      }

      cssDeEncapsulator.updateStyleFile(parsedTemplate);
      const cleanedTemplate = templateMigrator.removeI18nTags(templateContent);
      FileUtils.writeToFile(cleanedTemplate, parsedTemplate.filePath);
    }

    TransLocoUtils.saveTransLocoFiles('src/assets/i18n/', transLocoFiles);

    logger.printErrors(generateTranslationSummaries, migrationInfo);
    logger.printMigrationTime(start);

    return tree;
  };

}
