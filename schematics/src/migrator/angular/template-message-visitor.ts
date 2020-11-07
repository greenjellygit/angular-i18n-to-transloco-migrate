import {computeDigest} from '@angular/compiler/src/i18n/digest';
import {Message, Node as I18nNode, TagPlaceholder} from '@angular/compiler/src/i18n/i18n_ast';
import {
  BoundAttribute,
  BoundEvent,
  BoundText,
  Content,
  Element,
  Icu,
  Node,
  Reference,
  Template,
  Text,
  TextAttribute,
  Variable,
  visitAll,
  Visitor
} from '@angular/compiler/src/render3/r3_ast';
import {MessageUtils, TranslationKey} from '../message/message.utils';
import {ParsedPlaceholdersMap, PlaceholderParser} from '../message/placeholder-parser';
import {ObjectUtils} from '../utils/object.utils';

export class TemplateMessageVisitor implements Visitor<TemplateMessage[]> {

  private placeholderParser = new PlaceholderParser();

  visitNodes(nodes: Node[]): TemplateMessage[] {
    const result = [];
    for (const node of nodes) {
      const nodeResult = node.visit(this);
      if (!!nodeResult && Array.isArray(nodeResult)) {
        result.push(...nodeResult);
      }
    }
    return result.reverse();
  }

  visitBoundAttribute(attribute: BoundAttribute): TemplateMessage[] {
    if (attribute.i18n) {
      const message = attribute.i18n as Message;
      const parsedPlaceholders = this.placeholderParser.parse(message);
      if (ObjectUtils.isNotEmpty(parsedPlaceholders)) {
        console.log(123);
      }
      return [new TemplateAttrMessage(message, parsedPlaceholders, attribute.name)];
    }
  }

  visitElement(element: Element): TemplateMessage[] {
    const result: TemplateMessage[] = [];
    this.pushIfNotEmpty(visitAll(this, element.attributes), result);
    this.pushIfNotEmpty(visitAll(this, element.children), result);
    this.pushIfNotEmpty(visitAll(this, element.inputs), result);

    if (!!element.i18n && element.i18n.constructor.name === Message.name) {
      const message = element.i18n as Message;
      message.id = this.prepareMessageId(message);
      const hasHtml = this.hasHtml(message);
      const classes = this.getClasses(message.nodes);
      this.setMessageIds(message.placeholderToMessage);
      const parsedPlaceholders = this.placeholderParser.parse(message);
      result.push(new TemplateElementMessage(message, parsedPlaceholders, hasHtml, classes));
    }

    return result;
  }

  visitTemplate(template: Template): TemplateMessage[] {
    const result: TemplateMessage[] = [];
    this.pushIfNotEmpty(visitAll(this, template.children), result);
    return result;
  }

  visitTextAttribute(attribute: TextAttribute): TemplateMessage[] {
    if (attribute.i18n) {
      const message = attribute.i18n as Message;
      message.id = this.prepareMessageId(message);
      const parsedPlaceholders = this.placeholderParser.parse(message);
      if (ObjectUtils.isNotEmpty(parsedPlaceholders)) {
        console.log(123);
      }
      return [new TemplateAttrMessage(message, parsedPlaceholders, attribute.name)];
    }
  }

  visitVariable(variable: Variable): any { }

  visitBoundEvent(attribute: BoundEvent): any { }

  visitBoundText(text: BoundText): any { }

  visitContent(content: Content): any { }

  visitText(text: Text): any { }

  visitIcu(icu: Icu): any { }

  visitReference(reference: Reference): any { }

  private setMessageIds(placeholderToMessage: { [name: string]: Message }): void {
    Object.values(placeholderToMessage)
      .forEach((icuMessage: Message) => {
        icuMessage.id = this.prepareMessageId(icuMessage);
      });
  }

  private hasHtml(message: Message): boolean {
    return Object.keys(message.placeholders).some(placeholder => placeholder.startsWith('START_') || placeholder === 'LINE_BREAK');
  }

  private getClasses(nodes: I18nNode[]): string[] {
    return nodes
      .filter(n => n.constructor.name === TagPlaceholder.name)
      .map(n => n as TagPlaceholder)
      .filter((n: TagPlaceholder) => ObjectUtils.isNotEmpty(n.attrs) && ObjectUtils.isNotEmpty(n.attrs.class))
      .map(n => [n.attrs.class.split(' '), this.getClasses(n.children)].flat(childNode => childNode))
      .flat(n => n);
  }

  private pushIfNotEmpty(attributes: TemplateMessage[][], result: TemplateMessage[]): void {
    if (Array.isArray(attributes) && attributes.length > 0) {
      result.push(...attributes.flat(e => e));
    }
  }

  private prepareMessageId(element: Message): string {
    return element.customId || computeDigest(element);
  }

}

export abstract class TemplateMessage {
  key: TranslationKey;
  message: Message;
  placeholders: ParsedPlaceholdersMap;

  protected constructor(message: Message, placeholders: ParsedPlaceholdersMap) {
    this.key = MessageUtils.prepareTranslationKey(message);
    this.message = message;
    this.placeholders = placeholders;
  }
}

export class TemplateAttrMessage extends TemplateMessage {
  attrName: string;

  constructor(message: Message, placeholders: ParsedPlaceholdersMap, attrName: string) {
    super(message, placeholders);
    this.attrName = attrName;
  }
}

export class TemplateElementMessage extends TemplateMessage {
  hasHtml: boolean;
  classes: string[];

  constructor(message: Message, placeholders: ParsedPlaceholdersMap, hasHtml: boolean, classes: string[]) {
    super(message, placeholders);
    this.hasHtml = hasHtml;
    this.classes = classes;
  }
}
