import {DEFAULT_INTERPOLATION_CONFIG, parseTemplate} from '@angular/compiler';
import {TemplateAttrMessage, TemplateElementMessage, TemplateMessage, TemplateMessageVisitor} from './template-message-visitor';
import {ParsedTemplate} from './template-parser';

describe('TemplateMessageVisitor', () => {
  const templateMessageVisitor = new TemplateMessageVisitor();

  it('should found messages in attributes and elements', () => {
    const ATTR_TITLE_ID = 'attr_title_id';
    const ATTR_PLACEHOLDER_ID = 'attr_placeholder_id';
    const ATTR_CUSTOM_ID = 'attr_custom_id';
    const ELEMENT_ID = 'element_id';

    const templateSource = `<input title="hello"
                                   i18n-title="@@${ATTR_TITLE_ID}"
                                   placeholder="world"
                                   i18n-placeholder="@@${ATTR_PLACEHOLDER_ID}"/>
                            <app-test i18n="@@${ELEMENT_ID}"
                                      someBounded="asd"
                                      i18n-someBounded="@@${ATTR_CUSTOM_ID}">:)</app-test>`;

    const template = parse(templateSource);
    const result = templateMessageVisitor.visitNodes(template.nodes);
    const resultMessageIds = result.map(element => element.message.id);

    expect(resultMessageIds.length).toEqual(4);
    expect(resultMessageIds).toContain(ATTR_TITLE_ID);
    expect(resultMessageIds).toContain(ATTR_PLACEHOLDER_ID);
    expect(resultMessageIds).toContain(ATTR_CUSTOM_ID);
    expect(resultMessageIds).toContain(ELEMENT_ID);
  });

  it('should found attributes names in template attribute message', () => {
    const ATTR_TITLE_ID = 'attr_title_id';
    const ATTR_PLACEHOLDER_ID = 'attr_placeholder_id';

    const templateSource = `<input title="hello"
                                   i18n-title="@@${ATTR_TITLE_ID}"
                                   placeholder="world"
                                   i18n-placeholder="@@${ATTR_PLACEHOLDER_ID}"/>`;

    const template = parse(templateSource);
    const result = templateMessageVisitor.visitNodes(template.nodes);

    const attrTitleMessage = getByMessageId(result, ATTR_TITLE_ID) as TemplateAttrMessage;
    const attrPlaceholderMessage = getByMessageId(result, ATTR_PLACEHOLDER_ID) as TemplateAttrMessage;

    expect(attrTitleMessage.attrName).toEqual('title');
    expect(attrPlaceholderMessage.attrName).toEqual('placeholder');
  });

  it('should found message that contains icu, but not icu message directly', () => {
    const MESSAGE_1 = 'message_1';

    const templateSource = `<div i18n="@@${MESSAGE_1}">{users.length, plural, =1 {user} other {users}}</div>`;

    const template = parse(templateSource);
    const result = templateMessageVisitor.visitNodes(template.nodes);

    expect(result.length).toEqual(1);
    expect(result[0].message.id).toEqual(MESSAGE_1);
  });

  it('should detect if template element message has html', () => {
    const ELEMENT_ID = 'element_id';
    const ELEMENT_HTML_ID = 'element_html_id';

    const templateSource = `<div i18n="@@${ELEMENT_ID}">:)</div>
                            <div i18n="@@${ELEMENT_HTML_ID}"><span>:)</span></div>`;

    const template = parse(templateSource);
    const result = templateMessageVisitor.visitNodes(template.nodes);

    expect((getByMessageId(result, ELEMENT_ID) as TemplateElementMessage).hasHtml).toEqual(false);
    expect((getByMessageId(result, ELEMENT_HTML_ID) as TemplateElementMessage).hasHtml).toEqual(true);
  });

  it('should found all classes in template element message', () => {
    const ELEMENT_ID = 'element_id';
    const ELEMENT_SECOND_ID = 'element_second_id';

    const templateSource = `<div i18n="@@${ELEMENT_ID}"><span class="hello my"><span class="world"></span></span></div>
                            <div i18n="@@${ELEMENT_SECOND_ID}"><span>:)</span></div>`;

    const template = parse(templateSource);
    const result = templateMessageVisitor.visitNodes(template.nodes);

    const elementClasses = (getByMessageId(result, ELEMENT_ID) as TemplateElementMessage).classes;
    expect(elementClasses.length).toEqual(3);
    expect(elementClasses).toContain('hello');
    expect(elementClasses).toContain('my');
    expect(elementClasses).toContain('world');

    const elementSecondClasses = (getByMessageId(result, ELEMENT_SECOND_ID) as TemplateElementMessage).classes;
    expect(elementSecondClasses.length).toEqual(0);
  });

  it('should return element messages in order from bottom to top and i18n attribute should be before i18n-*', () => {
    const MESSAGE_1 = 'message_1';
    const MESSAGE_2 = 'message_2';
    const MESSAGE_3 = 'message_3';
    const MESSAGE_4 = 'message_4';
    const MESSAGE_5 = 'message_5';

    const templateSource = `<span i18n="@@${MESSAGE_4}" i18n-title="@@${MESSAGE_5}" title="title">hello</span>
                            <div>
                                <input placeholder="placeholder" i18n-placeholder="@@${MESSAGE_3}"/>
                                <div i18n-title="@@${MESSAGE_2}" title="title">
                                    <span i18n="@@${MESSAGE_1}">hello</span>
                                </div>
                            </div>`;

    const template = parse(templateSource);
    const result = templateMessageVisitor.visitNodes(template.nodes);

    expect(result.length).toEqual(5);
    result.forEach((templateMessage, arrayIndex) => {
      const messageIndex = Number(templateMessage.message.id.split('_')[1]);
      expect(messageIndex).toEqual(arrayIndex + 1);
    });
  });

  function parse(templateSource: string): ParsedTemplate {
    return parseTemplate(templateSource, null, {
      interpolationConfig: DEFAULT_INTERPOLATION_CONFIG,
      preserveWhitespaces: true,
      leadingTriviaChars: []
    });
  }

  function getByMessageId(result: TemplateMessage[], ELEMENT_ID: string): TemplateMessage {
    return result.find(t => t.message.id === ELEMENT_ID);
  }

});
