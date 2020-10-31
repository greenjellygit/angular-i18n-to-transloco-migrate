import {DEFAULT_INTERPOLATION_CONFIG, parseTemplate} from '@angular/compiler';
import {ParseError} from '@angular/compiler/src/parse_util';
import * as t from '@angular/compiler/src/render3/r3_ast';
import * as fs from 'fs';
import {TemplateMessage, TemplateMessageVisitor} from './template-message-visitor';

export class TemplateParser {

  private templateMessageVisitor: TemplateMessageVisitor = new TemplateMessageVisitor();

  public parse(filePath: string): ParsedFile {
    const content = fs.readFileSync(filePath, {encoding: 'utf-8'});
    const template = this.getTemplate(content, filePath);
    const templateElements = this.templateMessageVisitor.visitNodes(template.nodes);
    return {filePath, templateElements, content, parseStatus: 'SUCCESS'};
  }

  private getTemplate(fileContent: string, filePath: string): ParsedTemplate {
    return parseTemplate(fileContent, filePath, {
      interpolationConfig: DEFAULT_INTERPOLATION_CONFIG,
      preserveWhitespaces: true,
      leadingTriviaChars: []
    });
  }

}

export interface ParsedFile {
  filePath: string;
  templateElements: TemplateMessage[];
  content: string;
  parseStatus: 'ERROR' | 'SUCCESS';
}

export interface ParsedTemplate {
  errors?: ParseError[];
  nodes: t.Node[];
  styleUrls: string[];
  styles: string[];
  ngContentSelectors: string[];
}
