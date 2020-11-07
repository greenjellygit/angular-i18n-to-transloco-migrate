import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import * as path from 'path';
import {SourceBounds} from '../angular/template-message-visitor';
import {StringUtils} from '../utils/string.utils';
import {ParsedPlaceholdersMap} from './placeholder-parser';

export class MessageUtils {

  public static prepareTranslationKey(message: Message): TranslationKey {
    return this.get(message);
    // return this.getWithCustomGroups(message);
  }

  public static getSourceBounds(message: Message): SourceBounds {
    const bounds: number[] = message.nodes.map(e => [e.sourceSpan, e['startSourceSpan'], e['endSourceSpan']])
      .flat(e => e)
      .filter(value => !!value)
      .map(value => [value.end.offset, value.start.offset])
      .flat(e => e);
    return {startOffset: Math.min(...bounds), endOffset: Math.max(...bounds)};
  }

  public static mapPlaceholdersToTranslocoParams(parsedPlaceholdersMap: ParsedPlaceholdersMap): string {
    const paramsArray: any[] = Object.entries(parsedPlaceholdersMap)
      .map(e => ({name: e[0], placeholder: e[1]}))
      .filter(e => e.name.startsWith('INTERPOLATION') || e.name.startsWith('VAR_SELECT') || e.name.startsWith('VAR_PLURAL'))
      .map((e) => ({[`${e.placeholder.variableName}`]: e.placeholder.expression}));

    const paramsObject = paramsArray.reduce((result, current) => Object.assign(result, current), {});

    return paramsArray.length === 0 ? '' : ':' + JSON.stringify(paramsObject)
      .replace(/\"/g, '')
      .replace(/([^ ])\:/g, '$1: ')
      .replace(/,/g, ', ');
  }

  private static get(message: Message): TranslationKey {
    const fileName = this.getFileName(message);
    return new TranslationKey(StringUtils.underscore(message.id), StringUtils.underscore(fileName));
  }

  private static getFileName(message: Message): string {
    if (!!message?.sources && !!message.sources[0] && !!message.sources[0].filePath) {
      return path.basename(message.sources[0].filePath, '.html');
    }
    return 'no_name';
  }

  private static getWithCustomGroups(message: Message): TranslationKey {
    const customGroups = ['component', 'filters', 'common.errors', 'common-headers', 'common-errors', 'common-buttons', 'common.buttons', 'common-placeholders', 'common.placeholders', 'common'];
    const group = customGroups.find(g => message.id.indexOf(g + '.') !== -1);
    const idParts = message.id.split(group + '.');

    if (!!idParts && idParts.length === 2) {
      return new TranslationKey(StringUtils.underscore(idParts[1]), StringUtils.underscore(idParts[0] + group));
    } else {
      return new TranslationKey(StringUtils.underscore(message.id), 'no_group');
    }
  }

}

export class TranslationKey {
  id: string;
  group: string;

  constructor(id: string, group: string) {
    this.id = id;
    this.group = group;
  }

  public asText(): string {
    return `${this.group}.${this.id}`;
  }
}

