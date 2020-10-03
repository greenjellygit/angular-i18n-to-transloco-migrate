import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {AngularParseUtils, TemplateElement} from './angular-parse.utils';
import {FileUtils} from './file.utils';
import {SchematicsUtils} from './schematics.utils';
import {StringUtils} from './string.utils';
import {LocaleConfig, TransLocoFile, TransLocoUtils} from './trans-loco.utils';

export function migrator(_options: any): Rule {

  function updateTransLocoFiles(messageId: string, translationKey: string, transLocoFiles: TransLocoFile[], localeConfigs: LocaleConfig[]) {
    for (const locoFile of transLocoFiles) {
      const localeElement = localeConfigs.find(locale => locale.lang === locoFile.lang).bundle.translations[messageId];
      locoFile.entries[translationKey] = localeElement.text;
    }
  }

  function updateTemplateFile(translationKey: string, templateElement: TemplateElement) {
      console.log(templateElement);
  }

  return (tree: Tree, _context: SchematicContext) => {

    const parsedTemplateFiles = FileUtils.findFiles('src/**/*.html')
      .map(filePath => AngularParseUtils.parseTemplateFile(filePath))
      .filter(parsedFile => parsedFile.parseStatus === 'SUCCESS');

    const localeConfigs: LocaleConfig[] = SchematicsUtils.getDefaultProjectLocales();
    const transLocoFiles = TransLocoUtils.initializeLocoFiles(localeConfigs);

    for (const parsedTemplate of parsedTemplateFiles) {
      for (const messageId of Object.keys(parsedTemplate.i18nMap)) {
        const templateElement = parsedTemplate.i18nMap[messageId];
        const translationKey = StringUtils.underscore(messageId);
        updateTransLocoFiles(messageId, translationKey, transLocoFiles, localeConfigs);
        updateTemplateFile(translationKey, templateElement);
      }
    }

    // TransLocoUtils.saveTransLocoFiles('src/transloco/', transLocoFiles);

    return tree;
  };

}
