import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {AngularParseUtils, TemplateElement} from './angular-parse.utils';
import {FileUtils} from './file.utils';
import {SchematicsUtils} from './schematics.utils';
import {StringUtils} from './string.utils';
import {JsonKey, LocaleConfig, TransLocoFile, TransLocoUtils} from './trans-loco.utils';

export function migrator(_options: any): Rule {

  function prepareTranslationText(elementText: string, placeholderNames: string[], localeElement: any, templateElement: TemplateElement) {
    if (!!placeholderNames && placeholderNames.length > 0) {
      placeholderNames.forEach(placeholder => {
        elementText = elementText.replace(`{$${placeholder}}`, templateElement.message.placeholders[placeholder]);
      });
    }
    return elementText;
  }

  function updateTransLocoFiles(translationKey: TranslationKey, templateElement: TemplateElement, messageId: string, transLocoFiles: TransLocoFile[], localeConfigs: LocaleConfig[]) {
    for (const locoFile of transLocoFiles) {
      const localeElement = localeConfigs.find(locale => locale.lang === locoFile.lang).bundle.translations[messageId];
      const translationText = prepareTranslationText(localeElement.text, localeElement.placeholderNames, localeElement, templateElement);

      locoFile.entries[translationKey.group] = locoFile.entries[translationKey.group] || {} as JsonKey;
      locoFile.entries[translationKey.group][translationKey.id] = translationText;
    }
  }

  function updateTemplateFile(translationKey: TranslationKey, templateElement: TemplateElement, parsedTemplateContent: string, tree: Tree) {
    const message = templateElement.message;
    const startOffset = message.nodes[0].sourceSpan.start.offset;
    const endOffset = message.nodes[message.nodes.length - 1].sourceSpan.end.offset;
    const filePath = message.sources[0].filePath;

    if (templateElement.type === 'TAG') {
      const tagContent = `{{'${translationKey.group}.${translationKey.id}' | transloco}}`;
      const recorder = tree.beginUpdate(filePath);
      recorder.remove(startOffset, endOffset - startOffset);
      recorder.insertLeft(startOffset, tagContent);
      tree.commitUpdate(recorder);
    }
  }

  function prepareTranslationKey(messageId: string): TranslationKey {
    const customGroups = ['component', 'filters', 'common.errors', 'common-headers', 'common-errors', 'common-buttons', 'common.buttons', 'common-placeholders', 'common.placeholders', 'common'];
    const group = customGroups.find(g => messageId.indexOf(g + '.') !== -1);
    const idParts = messageId.split(group + '.');

    if (!!idParts && idParts.length === 2) {
      return {id: StringUtils.underscore(idParts[1]), group: StringUtils.underscore(idParts[0] + group)};
    } else  {
      return {id: StringUtils.underscore(messageId), group: 'no_group'};
    }
  }

  return (tree: Tree, _context: SchematicContext) => {

    const parsedTemplateFiles = FileUtils.findFiles('src/**/*.html')
      .map(filePath => AngularParseUtils.parseTemplateFile(filePath))
      .filter(parsedFile => parsedFile.parseStatus === 'SUCCESS');

    const localeConfigs: LocaleConfig[] = SchematicsUtils.getDefaultProjectLocales();
    const transLocoFiles = TransLocoUtils.initializeLocoFiles(localeConfigs);

    for (const parsedTemplate of parsedTemplateFiles) {
      const parsedTemplateContent = parsedTemplate.content;

      for (const messageId of Object.keys(parsedTemplate.i18nMap)) {
        const templateElement = parsedTemplate.i18nMap[messageId];
        const translationKey = prepareTranslationKey(messageId);

        updateTransLocoFiles(translationKey, templateElement, messageId, transLocoFiles, localeConfigs);
        updateTemplateFile(translationKey, templateElement, parsedTemplateContent, tree);
      }
    }

    TransLocoUtils.saveTransLocoFiles('src/transloco/', transLocoFiles);

    return tree;
  };

}

export interface TranslationKey {
  id: string;
  group: string;
}
