import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import * as XRegExp from 'xregexp';
import {AngularParseUtils, TemplateElement} from './angular-parse.utils';
import {FileUtils} from './file.utils';
import {SchematicsUtils} from './schematics.utils';
import {StringUtils} from './string.utils';
import {JsonKey, ParsedLocaleConfig, TransLocoFile, TransLocoUtils} from './trans-loco.utils';
import jsBeautify = require('js-beautify');

export function migrator(_options: any): Rule {

  function getPlaceholderIndex(placeholder: string) {
    const numberMatches = placeholder.match(/\d+/g);
    return numberMatches ? +numberMatches[0] : 0;
  }

  function prepareTranslationText(elementText: string, placeholderNames: string[], localeElement: any, templateElement: TemplateElement, localeBundle: ParsedTranslationBundle) {
    if (!!placeholderNames && placeholderNames.length > 0) {
      placeholderNames.forEach(placeholder => {
        const placeholderType = placeholder.split('_')[0];
        switch (placeholderType) {
          case 'INTERPOLATION':
            const interpolationPlaceholderIndex = getPlaceholderIndex(placeholder);
            elementText = elementText.replace(`{$${placeholder}}`, `{{var${interpolationPlaceholderIndex}}}`);
            break;
          case 'ICU':
            const icuMessageId = templateElement.message.placeholderToMessage[placeholder].id;
            let icuExpressionText = localeBundle.translations[icuMessageId].text;
            const hasOthers = icuExpressionText.match(/(\S+)(?= {.+?})/g).some(e => e === 'other');
            icuExpressionText = hasOthers ? icuExpressionText : StringUtils.remove(icuExpressionText, icuExpressionText.length - 1, 1) + ' other {?}}';
            elementText = elementText.replace(`{$${placeholder}}`, `${icuExpressionText}`);

            const icuPlaceholderIndex = getPlaceholderIndex(placeholder);
            const icuMessagePlaceholders = Object.keys(templateElement.message.placeholderToMessage[placeholder].placeholders);
            for (const icuPlaceholder of icuMessagePlaceholders) {
              const icuMessagePlaceholderIndex = getPlaceholderIndex(icuPlaceholder) + icuPlaceholderIndex;
              elementText = elementText.replace(`${icuPlaceholder}`, `icu${icuMessagePlaceholderIndex}`);
            }
            break;
          default:
            elementText = elementText.replace(`{$${placeholder}}`, templateElement.message.placeholders[placeholder]);
            break;
        }
      });
    }
    return elementText;
  }

  function updateTransLocoFiles(translationKey: TranslationKey, templateElement: TemplateElement, messageId: string, localeConfigs: ParsedLocaleConfig, transLocoFiles: TransLocoFile[]) {
    for (const locoFile of transLocoFiles) {
      const localeBundle = localeConfigs[locoFile.lang].bundle;
      const localeElement = localeBundle.translations[messageId];
      const translationText = prepareTranslationText(localeElement.text, localeElement.placeholderNames, localeElement, templateElement, localeBundle);

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

  function mapPlaceholdersToTransLocoParams(templateElement: TemplateElement) {
    const interpolationParams = Object.entries(templateElement.message.placeholders)
      .filter(e => e[0].indexOf('INTERPOLATION') > -1)
      .map((e, index) => ({[`var${index}`]: e[1].match(/(?<={{)(.*?)(?=}})/g)[0]}))
      .reduce((result, current) => {
        return Object.assign(result, current);
      }, {});

    const icuParams = Object.entries(templateElement.message.placeholderToMessage)
      .filter(e => e[0].indexOf('ICU') > -1)
      .map((e, index) => {
        return Object.values(e[1].placeholders).map(k => ({[`icu${index}`]: k})).reduce((result, current) => {
          return Object.assign(result, current);
        }, {});
      })
      .reduce((result, current) => {
        return Object.assign(result, current);
      }, {});

    const mergedParamsObject = Object.assign(interpolationParams, icuParams);
    const isEmpty = Object.keys(mergedParamsObject).length === 0;

    return isEmpty ? '' : ':' + JSON.stringify(Object.assign(interpolationParams, icuParams))
      .replace(/\"/g, '')
      .replace(/\:/g, ': ')
      .replace(/,/g, ', ');
  }

  function prepareTagContent(translationKey: TranslationKey, templateElement: TemplateElement) {
    const params = mapPlaceholdersToTransLocoParams(templateElement);
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
    templateContent = templateContent.replace(XRegExp(/<[a-z 0-9-]+(.|\s)*?(?<!\?)>/g), (a, b, c) => {
      return a.replace(/\s*i18n-?[a-z]*=".+?"\s*|i18n[-a-z]*\s*/g, ' ');
    });
    templateContent = jsBeautify.html(templateContent, {wrap_attributes: 'preserve-aligned', indent_size: 2});
    FileUtils.writeToFile(templateContent, filePath);
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

      for (const messageId of Object.keys(parsedTemplate.i18nMap)) {
        const templateElement = parsedTemplate.i18nMap[messageId];
        const translationKey = prepareTranslationKey(messageId);

        updateTransLocoFiles(translationKey, templateElement, messageId, localeConfigs, transLocoFiles);
        templateContent = updateTemplateFile(translationKey, templateElement, messageId, localeConfigs, templateContent);
      }

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
