import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import * as XRegExp from 'xregexp';
import {AngularParseUtils, TemplateElement} from './angular-parse.utils';
import {FileUtils} from './file.utils';
import {SchematicsUtils} from './schematics.utils';
import {StringUtils} from './string.utils';
import {JsonKey, ParsedLocaleConfig, TransLocoFile, TransLocoUtils} from './trans-loco.utils';
import jsBeautify = require('js-beautify');

export function migrator(_options: any): Rule {

  function prepareTranslationText(elementText: string, placeholderNames: string[], localeElement: any, templateElement: TemplateElement) {
    if (!!placeholderNames && placeholderNames.length > 0) {
      placeholderNames.forEach(placeholder => {
        if (placeholder.indexOf('INTERPOLATION') > -1) {
          const numberMatches = placeholder.match(/\d+/g);
          const interpolationIndex = numberMatches ? +numberMatches[0] : 0;
          elementText = elementText.replace(`{$${placeholder}}`, `{{var${interpolationIndex}}}`);
        } else {
          elementText = elementText.replace(`{$${placeholder}}`, templateElement.message.placeholders[placeholder]);
        }
      });
    }
    return elementText;
  }

  function updateTransLocoFiles(translationKey: TranslationKey, templateElement: TemplateElement, messageId: string, localeConfigs: ParsedLocaleConfig, transLocoFiles: TransLocoFile[]) {
    for (const locoFile of transLocoFiles) {
      const localeElement = localeConfigs[locoFile.lang].bundle.translations[messageId];
      const translationText = prepareTranslationText(localeElement.text, localeElement.placeholderNames, localeElement, templateElement);

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

  function mapInterpolationPlaceholdersToTransLocoParams(templateElement: TemplateElement) {
    if (!templateElement.hasInterpolation) {
      return '';
    }

    const paramsObject = Object.entries(templateElement.message.placeholders)
      .filter(e => e[0].indexOf('INTERPOLATION') > -1)
      .map((e, index) => ({[`var${index}`]: e[1].match(/(?<={{)(.*?)(?=}})/g)[0]}))
      .reduce((result, current) => {
        return Object.assign(result, current);
      }, {});

    return ':' + JSON.stringify(paramsObject)
      .replace(/\"/g, '')
      .replace(/\:/g, ': ')
      .replace(/,/g, ', ');
  }

  function prepareTagContent(translationKey: TranslationKey, templateElement: TemplateElement) {
    const params = mapInterpolationPlaceholdersToTransLocoParams(templateElement);
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
      templateContent = StringUtils.insertLeft(templateContent, sourceBounds.startOffset - (templateElement.hasHtml ? 1 : 0), tagContent);
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
