import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {ParsedTranslation} from '@angular/localize/src/utils';
import {AngularParseUtils, ParsedFile, TemplateElement} from './angular-parse.utils';
import {ArrayUtils} from './array.utils';
import {CssUtil} from './css.util';
import {FileUtils} from './file.utils';
import {ObjectUtils} from './object.utils';
import {SchematicsUtils} from './schematics.utils';
import {StringUtils} from './string.utils';
import {JsonKey, ParsedLocaleConfig, TransLocoFile, TransLocoUtils} from './trans-loco.utils';
import jsBeautify = require('js-beautify');

export function migrator(_options: any): Rule {

  function getOrCreateVariableName(placeholderValue: string, variables: { index: number; map: {} }) {
    if (!!placeholderValue) {
      const stripInterpolationRegex = /(?<={{)(.*?)(?=}})/;
      if (stripInterpolationRegex.test(placeholderValue)) {
        placeholderValue = placeholderValue.match(stripInterpolationRegex)[0];
      }
    }

    if (!variables.map[placeholderValue]) {
      variables.map[placeholderValue] = `var${variables.index++}`;
    }

    return variables.map[placeholderValue];
  }

  function prepareTranslationText(parsedTranslation: ParsedTranslation, message: Message, localeBundle: ParsedTranslationBundle, variables = {
    index: 0,
    map: {}
  }) {
    let translationText = parsedTranslation.text;
    const placeholders: string[] = parsedTranslation.placeholderNames.concat(Object.keys(message.placeholders));

    if (ArrayUtils.isNotEmpty(placeholders)) {
      placeholders.forEach(placeholder => {
        const placeholderType = placeholder.replace(/_\d+/g, '');
        switch (placeholderType) {
          case 'INTERPOLATION':
            const interpolationVariableName = getOrCreateVariableName(message.placeholders[placeholder], variables);
            translationText = translationText
              .replace(`{$${placeholder}}`, `{{${interpolationVariableName}}}`)
              .replace(new RegExp(`{${placeholder}}`, 'g'), ` {${interpolationVariableName}} `);
            break;
          case 'ICU':
            const icuMessage = message.placeholderToMessage[placeholder];
            const parsedIcuTranslation = localeBundle.translations[icuMessage.id];
            const icuToText = prepareTranslationText(parsedIcuTranslation, icuMessage, localeBundle, variables);
            translationText = translationText.replace(`{$${placeholder}}`, icuToText);
            break;
          case 'VAR_SELECT':
          case 'VAR_PLURAL':
            const icuVariableName = getOrCreateVariableName(message.placeholders[placeholder], variables);
            const hasOthers = translationText.match(/(\S+)(?= {.+?})/g).some(e => e === 'other');
            translationText = hasOthers ? translationText : StringUtils.remove(translationText, translationText.length - 1, 1) + ' other {}}';
            translationText = translationText.replace(placeholder, `${icuVariableName}`);
            break;
          default:
            translationText = translationText
              .replace(`{$${placeholder}}`, message.placeholders[placeholder])
              .replace(new RegExp(`{${placeholder}}`, 'g'), message.placeholders[placeholder]);
            break;
        }
      });
    }

    return translationText;
  }

  function updateTransLocoFiles(translationKey: TranslationKey, templateElement: TemplateElement, messageId: string, localeConfigs: ParsedLocaleConfig, transLocoFiles: TransLocoFile[]) {
    for (const locoFile of transLocoFiles) {
      const localeBundle = localeConfigs[locoFile.lang].bundle;
      const parsedTranslation = localeBundle.translations[messageId];
      const translationText = prepareTranslationText(parsedTranslation, templateElement.message, localeBundle);

      locoFile.entries[translationKey.group] = locoFile.entries[translationKey.group] || {} as JsonKey;
      locoFile.entries[translationKey.group][translationKey.id] = translationText;
    }
  }

  function getSourceBounds(message: Message): { startOffset: number, endOffset: number } {
    const bounds: number[] = message.nodes.map(e => [e.sourceSpan, e['startSourceSpan'], e['endSourceSpan']])
      .reduce((acc, val) => [...acc, ...val], [])
      .filter(value => !!value)
      .map(value => [value.end.offset, value.start.offset])
      .reduce((acc, val) => [...acc, ...val], []);
    return {startOffset: Math.min(...bounds), endOffset: Math.max(...bounds)};
  }

  function mapPlaceholdersToTransLocoParams(message: Message) {
    let paramsArray: any[] = collectPlaceholders(message)
      .filter(e => e.name.startsWith('INTERPOLATION') || e.name.startsWith('VAR_SELECT') || e.name.startsWith('VAR_PLURAL'))
      .map((e, index) => {
        const stripInterpolationRegex = /(?<={{)(.*?)(?=}})/;
        if (stripInterpolationRegex.test(e.value)) {
          e.value = e.value.match(stripInterpolationRegex)[0];
        }
        return e;
      });
    paramsArray = ArrayUtils.removeDuplicates(paramsArray, 'value')
      .map((e, index) => ({[`var${index}`]: e.value}));

    const paramsObject = paramsArray.reduce((result, current) => Object.assign(result, current), {});

    return paramsArray.length === 0 ? '' : ':' + JSON.stringify(paramsObject)
      .replace(/\"/g, '')
      .replace(/\:/g, ': ')
      .replace(/,/g, ', ');
  }

  function collectPlaceholders(message: Message): { name: string, value: string }[] {
    let placeholders = Object.entries(message.placeholders)
      .map(e => ({name: e[0], value: e[1]}));
    if (ObjectUtils.isNotEmpty(message.placeholderToMessage)) {
      Object.values(message.placeholderToMessage).forEach(icuMessage => {
        placeholders = [...placeholders, ...collectPlaceholders(icuMessage)];
      });
    }
    return placeholders;
  }

  function prepareTagContent(translationKey: TranslationKey, templateElement: TemplateElement) {
    const params = mapPlaceholdersToTransLocoParams(templateElement.message);
    if (templateElement.hasHtml) {
      return ` [innerHtml]="'${translationKey.group}.${translationKey.id}' | transloco${params}"`;
    } else {
      return `{{'${translationKey.group}.${translationKey.id}' | transloco${params ? params + ' ' : ''}}}`;
    }
  }

  function updateTemplateFile(translationKey: TranslationKey, templateElement: TemplateElement, messageId: string, localeConfigs: ParsedLocaleConfig, templateContent: string) {
    const sourceBounds = getSourceBounds(templateElement.message);
    templateContent = StringUtils.remove(templateContent, sourceBounds.startOffset, sourceBounds.endOffset - sourceBounds.startOffset);
    if (templateElement.type === 'TAG') {
      const tagContent = prepareTagContent(translationKey, templateElement);
      templateContent = StringUtils.insertLeft(templateContent, templateElement.hasHtml ? sourceBounds.startOffset - 1 : sourceBounds.startOffset, tagContent);
    } else if (templateElement.type === 'ATTR') {
      const tagContent = `[${templateElement.name}]="'${translationKey.group}.${translationKey.id}' | transloco"`;
      templateContent = StringUtils.insertLeft(templateContent, sourceBounds.startOffset, tagContent);
    }
    return templateContent;
  }

  function prepareTranslationKey(messageId: string): TranslationKey {
    const customGroups = ['component', 'filters', 'common.errors', 'common-headers', 'common-errors', 'common-buttons', 'common.buttons', 'common-placeholders', 'common.placeholders', 'common'];
    const group = customGroups.find(g => messageId.indexOf(g + '.') !== -1);
    const idParts = messageId.split(group + '.');

    if (!!idParts && idParts.length === 2) {
      return {id: StringUtils.underscore(idParts[1]), group: StringUtils.underscore(idParts[0] + group)};
    } else {
      return {id: StringUtils.underscore(messageId), group: 'no_group'};
    }
  }

  function removeI18nTagsFromTemplate(filePath: string, templateContent: string) {
    const i18nAttributes = AngularParseUtils.findI18nAttributes(templateContent);
    for (const attr of i18nAttributes) {
      templateContent = StringUtils.removeRange(templateContent, attr.sourceSpan.start.offset, attr.sourceSpan.end.offset);
      templateContent = StringUtils.removeWhitespacesAtIndex(templateContent, attr.sourceSpan.start.offset);
    }
    templateContent = jsBeautify.html(templateContent, {wrap_attributes: 'preserve-aligned', indent_size: 2});
    FileUtils.writeToFile(templateContent, filePath);
  }

  function updateStyleFile(parsedFile: ParsedFile) {
    const styleFilePath = ['.scss', '.css']
      .map(fileType => parsedFile.filePath.split('.html')[0] + fileType)
      .filter(filePath => FileUtils.isFileExists(filePath))[0];

    const classessToEncapsule = Object.values(parsedFile.i18nMap)
      .map(value => value.classes)
      .reduce((x, y) => x.concat(y), []);

    if (!!styleFilePath && classessToEncapsule.length > 0) {
      const styleFileContent = FileUtils.loadFile(styleFilePath);
      const updatedContent = CssUtil.encapsulateClasses(styleFileContent, [...new Set(classessToEncapsule)]);
      FileUtils.writeToFile(updatedContent, styleFilePath);
    }
  }

  return (tree: Tree, _context: SchematicContext) => {
    const parsedTemplateFiles = FileUtils.findFiles('src/**/*.html')
      // .filter(value => value.indexOf('trial-info-bar') > -1)
      .map(filePath => AngularParseUtils.parseTemplateFile(filePath))
      .filter(parsedFile => parsedFile.parseStatus === 'SUCCESS');

    const localeConfigs: ParsedLocaleConfig = SchematicsUtils.getDefaultProjectLocales();
    const transLocoFiles = TransLocoUtils.initializeLocoFiles(localeConfigs);

    for (const parsedTemplate of parsedTemplateFiles) {
      let templateContent = parsedTemplate.content;

      for (const templateElement of parsedTemplate.i18nMap) {
        const messageId = templateElement.message.id;
        const translationKey = prepareTranslationKey(messageId);

        updateTransLocoFiles(translationKey, templateElement, messageId, localeConfigs, transLocoFiles);
        templateContent = updateTemplateFile(translationKey, templateElement, messageId, localeConfigs, templateContent);
      }

      updateStyleFile(parsedTemplate);
      removeI18nTagsFromTemplate(parsedTemplate.filePath, templateContent);
    }

    TransLocoUtils.saveTransLocoFiles('src/assets/i18n/', transLocoFiles);

    return tree;
  };

}

export interface TranslationKey {
  id: string;
  group: string;
}
