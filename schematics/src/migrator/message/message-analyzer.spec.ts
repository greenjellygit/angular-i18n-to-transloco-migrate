import {DEFAULT_INTERPOLATION_CONFIG, parseTemplate} from '@angular/compiler';
import {TemplateMessageVisitor} from '../angular/template-message-visitor';
import {ParsedTemplate} from '../angular/template-parser';
import {MessageAnalyzer, MessageInfo} from './message-analyzer';

describe('MessageAnalyzer', () => {

  const messageAnalyzer: MessageAnalyzer = new MessageAnalyzer();

  it('should found not migrated elements in i18n tag', () => {
    const source = `<div i18n>
                        <span myDirective></span>
                        <app-test></app-test>
                        <mat-input></mat-input>
                        <span [innerHTML]="html" (click)="onClick()"></span>
                    </div>`;

    const parsedSource = parse(source);
    const messages = new TemplateMessageVisitor().visitNodes(parsedSource.nodes);
    const messageInfo: MessageInfo = messageAnalyzer.analyze(messages[0], 'app');

    expect(messageInfo.notMigrateElements).toContain('myDirective');
    expect(messageInfo.notMigrateElements).toContain('app-test');
    expect(messageInfo.notMigrateElements).toContain('mat-input');
    expect(messageInfo.notMigrateElements).toContain('(click)');
    expect(messageInfo.notMigrateElements).toContain('[innerHTML]');
  });

});

function parse(templateSource: string): ParsedTemplate {
  return parseTemplate(templateSource, 'test.html', {
    interpolationConfig: DEFAULT_INTERPOLATION_CONFIG,
    preserveWhitespaces: true,
    leadingTriviaChars: []
  });
}
