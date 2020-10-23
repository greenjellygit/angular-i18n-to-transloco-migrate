import {logging} from '@angular-devkit/core';
import {Rule, SchematicContext, Tree, TypedSchematicContext} from '@angular-devkit/schematics';
import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {ParsedTranslation} from '@angular/localize/src/utils';
import {camelize} from '@ngx-i18nsupport/tooling/src/schematics/schematics-core/utility/strings';
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

  function prepareTranslationText(parsedTranslation: ParsedTranslation, message: Message, parsedPlaceholdersMap: ParsedPlaceholdersMap,
                                  localeBundle: ParsedTranslationBundle, translationKey: TranslationKey) {

    if (!parsedTranslation) {
      throw new MissingTranslationError('Missing translation', translationKey, localeBundle.locale);
    }

    let translationText = parsedTranslation.text;
    const placeholders: string[] = parsedTranslation.placeholderNames.concat(Object.keys(message.placeholders));

    if (ArrayUtils.isNotEmpty(placeholders)) {
      placeholders.forEach(placeholder => {
        const placeholderType = placeholder.replace(/_\d+/g, '');
        switch (placeholderType) {
          case 'INTERPOLATION':
            const parsedPlaceholderInterpolation = parsedPlaceholdersMap[placeholder];
            translationText = translationText
              .replace(`{$${placeholder}}`, `{{${parsedPlaceholderInterpolation.variableName}}}`)
              .replace(new RegExp(`{${placeholder}}`, 'g'), ` {${parsedPlaceholderInterpolation.variableName}} `);
            break;
          case 'ICU':
            const icuMessage = message.placeholderToMessage[placeholder];
            const parsedIcuTranslation = localeBundle.translations[icuMessage.id];
            const icuToText = prepareTranslationText(parsedIcuTranslation, icuMessage, parsedPlaceholdersMap, localeBundle, translationKey);
            translationText = translationText.replace(`{$${placeholder}}`, icuToText);
            break;
          case 'VAR_SELECT':
          case 'VAR_PLURAL':
            const parsedPlaceholderPlural = parsedPlaceholdersMap[placeholder];
            const hasOthers = translationText.match(/(\S+)(?= {.+?})/g).some(e => e === 'other');
            translationText = hasOthers ? translationText : StringUtils.remove(translationText, translationText.length - 1, 1) + ' other {}}';
            translationText = translationText.replace(placeholder, `${parsedPlaceholderPlural.variableName}`);
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

  function generateTranslations(translationKey: TranslationKey, templateElement: TemplateElement, messageId: string,
                                localeConfigs: ParsedLocaleConfig, placeholdersMap: ParsedPlaceholdersMap, transLocoFiles: TransLocoFile[]): MissingTranslationError[] {
    const missingTranslations = [];
    for (const locoFile of transLocoFiles) {
      const localeBundle = localeConfigs[locoFile.lang].bundle;
      const parsedTranslation = localeBundle.translations[messageId];

      let translationText: string;
      try {
        translationText = prepareTranslationText(parsedTranslation, templateElement.message, placeholdersMap, localeBundle, translationKey);
      } catch (e) {
        if (e instanceof MissingTranslationError) {
          missingTranslations.push(e);
          translationText = 'MISSING TRANSLATION';
        }
      }

      locoFile.entries[translationKey.group] = locoFile.entries[translationKey.group] || {} as JsonKey;
      locoFile.entries[translationKey.group][translationKey.id] = translationText;
    }

    return missingTranslations;
  }

  function getSourceBounds(message: Message): { startOffset: number, endOffset: number } {
    const bounds: number[] = message.nodes.map(e => [e.sourceSpan, e['startSourceSpan'], e['endSourceSpan']])
      .reduce((acc, val) => [...acc, ...val], [])
      .filter(value => !!value)
      .map(value => [value.end.offset, value.start.offset])
      .reduce((acc, val) => [...acc, ...val], []);
    return {startOffset: Math.min(...bounds), endOffset: Math.max(...bounds)};
  }

  function mapPlaceholdersToTransLocoParams(parsedPlaceholdersMap: ParsedPlaceholdersMap) {
    const paramsArray: any[] = Object.entries(parsedPlaceholdersMap)
      .map(e => ({name: e[0], placeholder: e[1]}))
      .filter(e => e.name.startsWith('INTERPOLATION') || e.name.startsWith('VAR_SELECT') || e.name.startsWith('VAR_PLURAL'))
      .map((e) => ({[`${e.placeholder.variableName}`]: e.placeholder.expression}));

    const paramsObject = paramsArray.reduce((result, current) => Object.assign(result, current), {});

    return paramsArray.length === 0 ? '' : ':' + JSON.stringify(paramsObject)
      .replace(/\"/g, '')
      .replace(/\:/g, ': ')
      .replace(/,/g, ', ');
  }

  function removeInterpolation(expression: string): string {
    const stripInterpolationRegex = /(?<={{)(.*?)(?=}})/;
    if (stripInterpolationRegex.test(expression)) {
      expression = expression.match(stripInterpolationRegex)[0];
    }
    return expression;
  }

  function parsePlaceholders(message: Message): ParsedPlaceholdersMap {
    const placeholders = collectPlaceholders(message);
    const parsedPlaceholdersMap: ParsedPlaceholdersMap = {};

    const lastIndexOfVariableNameDifferentExpression: { [variableName: string]: number } = {};

    for (const placeholder of placeholders) {
      if (!!parsedPlaceholdersMap[placeholder.name]) {
        continue;
      }

      const expressionWithoutInterpolation = removeInterpolation(placeholder.expression);
      let variableName = StringUtils.prepareVariableName(expressionWithoutInterpolation);

      const lastIndex = lastIndexOfVariableNameDifferentExpression[variableName];
      if (lastIndex == null) {
        lastIndexOfVariableNameDifferentExpression[variableName] = 0;
      } else {
        lastIndexOfVariableNameDifferentExpression[variableName]++;
      }

      const differentExpressionSameVariableName = Object.values(parsedPlaceholdersMap)
        .some(e => e.variableName === variableName && e.expression !== placeholder.expression);
      if (differentExpressionSameVariableName) {
        variableName += lastIndexOfVariableNameDifferentExpression[variableName];
      }

      parsedPlaceholdersMap[placeholder.name] = {
        variableName,
        rawExpression: placeholder.expression,
        expression: expressionWithoutInterpolation
      };
    }

    return parsedPlaceholdersMap;
  }

  function collectPlaceholders(message: Message): { name: string, expression: string }[] {
    let placeholders = Object.entries(message.placeholders)
      .map(e => ({name: e[0], expression: e[1]}));

    if (ObjectUtils.isNotEmpty(message.placeholderToMessage)) {
      Object.values(message.placeholderToMessage).forEach(icuMessage => {
        placeholders = [...placeholders, ...collectPlaceholders(icuMessage)];
      });
    }

    return placeholders;
  }

  function prepareTagContent(translationKey: TranslationKey, templateElement: TemplateElement, parsedPlaceholdersMap: ParsedPlaceholdersMap) {
    const params = mapPlaceholdersToTransLocoParams(parsedPlaceholdersMap);
    if (templateElement.hasHtml) {
      return ` [innerHtml]="'${translationKey.group}.${translationKey.id}' | transloco${params}"`;
    } else {
      return `{{'${translationKey.group}.${translationKey.id}' | transloco${params ? params + ' ' : ''}}}`;
    }
  }

  function updateTemplates(translationKey: TranslationKey, templateElement: TemplateElement, messageId: string,
                           localeConfigs: ParsedLocaleConfig, parsedPlaceholdersMap: ParsedPlaceholdersMap, templateContent: string): string {
    const sourceBounds = getSourceBounds(templateElement.message);
    templateContent = StringUtils.remove(templateContent, sourceBounds.startOffset, sourceBounds.endOffset - sourceBounds.startOffset);
    if (templateElement.type === 'TAG') {
      const tagContent = prepareTagContent(translationKey, templateElement, parsedPlaceholdersMap);
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

  function findNotMigrateElements(message: Message): string[] {
    let notMigrateElements = [];

    if (ArrayUtils.isNotEmpty(message.nodes)) {
      message.nodes.forEach(node => {
        if (ObjectUtils.isNotEmpty(node['attrs'])) {
          Object.keys(node['attrs'])
            .filter(attrName => attrName.startsWith('*') || attrName.startsWith('[') || (attrName !== attrName.toLowerCase()))
            .forEach(attrName => {
              notMigrateElements.push(attrName);
            });
        }
      });
    }

    if (ObjectUtils.isNotEmpty(message.placeholderToMessage)) {
      Object.values(message.placeholderToMessage)
        .forEach(icuMessage => {
          notMigrateElements = [...notMigrateElements, ...findNotMigrateElements(icuMessage)];
        });
    }

    return notMigrateElements;
  }

  function analyzeMessage(message: Message, translationKey: TranslationKey): MessageInfo {
    const notMigrateElements = findNotMigrateElements(message);
    return {
      translationKey,
      notMigrateElements,
      needsManualChanges: notMigrateElements.length > 0
    };
  }

  function printErrors(missingTranslationsSummary: MissingTranslationError[], logger: logging.LoggerApi, migrationInfo: MessageInfo[]) {
    if (missingTranslationsSummary.length > 0) {
      logger.warn('Warning - Missing translations:');
      const groupedByLocale = ArrayUtils.groupByKey(missingTranslationsSummary, 'locale');
      Object.keys(groupedByLocale).forEach((locale) => {
        logger.info(`    Locale: ${locale}`);
        Object.values(groupedByLocale[locale]).forEach((e: MissingTranslationError, index) => {
          logger.info(`        ${index + 1}. ${e.translationKey.group}.${e.translationKey.id}`);
        });
      });
    }

    const needsManualChangesElements = migrationInfo.filter(value => value.needsManualChanges);
    if (needsManualChangesElements.length > 0) {
      logger.warn('Warning - Not supported attributes in translations:');
      needsManualChangesElements.forEach((value, index) => {
        logger.info(`    ${index + 1}. ${value.translationKey.group}.${value.translationKey.id}: ${value.notMigrateElements.join(', ')}`);
      });
    }
  }

  return (tree: Tree, _context: SchematicContext) => {
    const parsedTemplateFiles = FileUtils.findFiles('src/**/*.html')
      // .filter(value => value.indexOf('trial-info-bar') > -1)
      .map(filePath => AngularParseUtils.parseTemplateFile(filePath))
      .filter(parsedFile => parsedFile.parseStatus === 'SUCCESS');

    const localeConfigs: ParsedLocaleConfig = SchematicsUtils.getDefaultProjectLocales();
    const transLocoFiles = TransLocoUtils.initializeLocoFiles(localeConfigs);
    const migrationInfo: MessageInfo[] = [];
    const missingTranslationsSummary: MissingTranslationError[] = [];

    for (const parsedTemplate of parsedTemplateFiles) {
      let templateContent = parsedTemplate.content;
      for (const templateElement of parsedTemplate.i18nMap) {

        const messageId = templateElement.message.id;
        const translationKey = prepareTranslationKey(messageId);
        const placeholdersMap = parsePlaceholders(templateElement.message);

        migrationInfo.push(analyzeMessage(templateElement.message, translationKey));

        const missingTranslations = generateTranslations(translationKey, templateElement, messageId, localeConfigs, placeholdersMap, transLocoFiles);
        missingTranslationsSummary.push(...missingTranslations);
        templateContent = updateTemplates(translationKey, templateElement, messageId, localeConfigs, placeholdersMap, templateContent);
      }

      updateStyleFile(parsedTemplate);
      removeI18nTagsFromTemplate(parsedTemplate.filePath, templateContent);
    }

    TransLocoUtils.saveTransLocoFiles('src/assets/i18n/', transLocoFiles);
    printErrors(missingTranslationsSummary, _context.logger, migrationInfo);

    return tree;
  };

}

export interface TranslationKey {
  id: string;
  group: string;
}

export interface ParsedPlaceholdersMap {
  [name: string]: ParsedPlaceholder;
}

export interface ParsedPlaceholder {
  expression: string;
  rawExpression: string;
  variableName: string;
}

export interface MessageInfo {
  translationKey: TranslationKey;
  notMigrateElements: string[];
  needsManualChanges: boolean;
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

export interface GenerateTranslationsSummary {
  missingTranslations: MissingTranslationError[];
}
