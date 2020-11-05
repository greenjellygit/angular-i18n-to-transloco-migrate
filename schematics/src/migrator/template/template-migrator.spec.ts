import {ParseSourceSpan} from '@angular/compiler';
import {Node} from '@angular/compiler/src/i18n/i18n_ast';
import {TemplateAttrMessage, TemplateElementMessage} from '../angular/template-message-visitor';
import {ParsedPlaceholdersMap} from '../message/placeholder-parser';
import {MessageHelper} from '../utils/test.utils';
import {TemplateMigrator} from './template-migrator';

describe('TemplateMigrator', () => {
  const templateMigrator = new TemplateMigrator();

  it('should migrate template element with text', () => {
    const source = `<div i18n="@@hello">hello!</div>`;
    const result = `<div>{{'user_component.hello' | transloco}}</div>`;

    const message = MessageHelper.builder()
      .id('hello')
      .nodes([{sourceSpan: {start: {offset: 20, file: {}}, end: {offset: 26}} as ParseSourceSpan} as Node])
      .sources([{filePath: 'user.component.html'} as any])
      .build();

    const templateMessage: TemplateElementMessage = new TemplateElementMessage(message, {}, false, []);

    const migratedTemplate = templateMigrator.migrate(templateMessage, source);
    const cleanedTemplate = templateMigrator.removeI18nAttributes(migratedTemplate);

    expect(cleanedTemplate)
      .toEqual(result);
  });

  it('should migrate template element with interpolation', () => {
    const source = `<div i18n="@@7653c58cv3n98n">{{user.name}}</div>`;
    const result = `<div>{{'user_component.first_name' | transloco:{userName: user.name} }}</div>`;

    const message = MessageHelper.builder()
      .id('first_name')
      .nodes([{sourceSpan: {start: {offset: 29, file: {}}, end: {offset: 42}} as ParseSourceSpan} as Node])
      .sources([{filePath: 'user.component.html'} as any])
      .build();

    const parsedPlaceholdersMap: ParsedPlaceholdersMap = {
      INTERPOLATION: {
        expression: 'user.name', variableName: 'userName'
      }
    };

    const templateMessage: TemplateElementMessage = new TemplateElementMessage(message, parsedPlaceholdersMap, false, []);

    const migratedTemplate = templateMigrator.migrate(templateMessage, source);
    const cleanedTemplate = templateMigrator.removeI18nAttributes(migratedTemplate);

    expect(cleanedTemplate)
      .toEqual(result);
  });

  it('should migrate template element with html as innerHtml', () => {
    const source = `<div i18n="@@hello"><span>hello world in span</span></div>`;
    const result = `<div [innerHtml]="'user_component.hello' | transloco"></div>`;

    const message = MessageHelper.builder()
      .id('hello')
      .nodes([{sourceSpan: {start: {offset: 20, file: {}}, end: {offset: 52}} as ParseSourceSpan} as Node])
      .sources([{filePath: 'user.component.html'} as any])
      .build();

    const templateMessage: TemplateElementMessage = new TemplateElementMessage(message, {}, true, []);

    const migratedTemplate = templateMigrator.migrate(templateMessage, source);
    const cleanedTemplate = templateMigrator.removeI18nAttributes(migratedTemplate);

    expect(cleanedTemplate)
      .toEqual(result);
  });

  it('should migrate template attribute with text', () => {
    const source = `<div title="this is title" i18n-title="@@title"></div>`;
    const result = `<div [title]="'user_component.title' | transloco"></div>`;

    const message = MessageHelper.builder()
      .id('title')
      .nodes([{sourceSpan: {start: {offset: 5, file: {}}, end: {offset: 26}} as ParseSourceSpan} as Node])
      .sources([{filePath: 'user.component.html'} as any])
      .build();

    const templateMessage: TemplateAttrMessage = new TemplateAttrMessage(message, {}, 'title');

    const migratedTemplate = templateMigrator.migrate(templateMessage, source);
    const cleanedTemplate = templateMigrator.removeI18nAttributes(migratedTemplate);

    expect(cleanedTemplate)
      .toEqual(result);
  });

});
