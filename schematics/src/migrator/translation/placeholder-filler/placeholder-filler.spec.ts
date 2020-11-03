import {ParsedTranslationBundle} from '@angular/localize/src/tools/src/translate/translation_files/translation_parsers/translation_parser';
import {ParsedTranslation} from '@angular/localize/src/utils';
import {TemplateElementMessage, TemplateMessage} from '../../angular/template-message-visitor';
import {ParsedPlaceholdersMap} from '../../message/placeholder-parser';
import {MessageHelper} from '../../utils/test.utils';
import {PlaceholderFiller} from './placeholder-filler';


describe('PlaceholderFiller', () => {
  const placeholderFiller = new PlaceholderFiller();

  it('should fill interpolation placeholders', () => {
    const message = MessageHelper.builder()
      .id('hello.world')
      .placeholders({
        INTERPOLATION: '{{company.name}}',
        INTERPOLATION_1: '{{accountBalance}}'
      })
      .build();

    const placeholdersMap: ParsedPlaceholdersMap = {
      INTERPOLATION: {
        variableName: 'userNameUppercase',
        expression: 'user.name | uppercase',
      },
      INTERPOLATION_1: {
        variableName: 'accountBalance',
        expression: 'accountBalance',
      }
    };

    const localeBundle: ParsedTranslationBundle = {} as ParsedTranslationBundle;

    const parsedTranslation: ParsedTranslation = {
      placeholderNames: ['INTERPOLATION', 'INTERPOLATION_1'],
      text: 'Hello {$INTERPOLATION}! Your account balance is {$INTERPOLATION_1}.'
    } as ParsedTranslation;

    const templateMessage: TemplateMessage = new TemplateElementMessage(message, placeholdersMap, true, []);

    const result = placeholderFiller.fill(templateMessage, localeBundle, parsedTranslation);
    expect(result.translationText)
      .toEqual('Hello {{userNameUppercase}}! Your account balance is {{accountBalance}}.');
  });

  it('should fill html placeholders', () => {
    const message = MessageHelper.builder()
      .id('hello.world')
      .placeholders({
        START_TAG_SPAN: '<span class="welcome-container">',
        CLOSE_TAG_SPAN: '</span>'
      })
      .build();

    const placeholdersMap: ParsedPlaceholdersMap = {};
    const localeBundle: ParsedTranslationBundle = {} as ParsedTranslationBundle;

    const parsedTranslation: ParsedTranslation = {
      placeholderNames: ['START_TAG_SPAN', 'CLOSE_TAG_SPAN'],
      text: '{$START_TAG_SPAN}Greetings! Have a nice day!{$CLOSE_TAG_SPAN}'
    } as ParsedTranslation;

    const templateMessage: TemplateMessage = new TemplateElementMessage(message, placeholdersMap, true, []);

    const result = placeholderFiller.fill(templateMessage, localeBundle, parsedTranslation);
    expect(result.translationText)
      .toEqual('<span class="welcome-container">Greetings! Have a nice day!</span>');
  });

  it('should fill icu placeholder', () => {
    const icuMessage = MessageHelper.builder()
      .id('adf9567b8964v83c')
      .placeholders({
        VAR_PLURAL: '{{usersCount}}}'
      })
      .build();

    const usersCountPlaceholder = {
      variableName: 'usersCount',
      expression: 'users.count',
    };

    const message = MessageHelper.builder()
      .id('hello.world')
      .placeholders({
        INTERPOLATION: usersCountPlaceholder.expression
      })
      .placeholderToMessage({
        ICU: icuMessage
      })
      .build();

    const placeholdersMap: ParsedPlaceholdersMap = {
      VAR_PLURAL: usersCountPlaceholder,
      INTERPOLATION: usersCountPlaceholder
    };
    const localeBundle: ParsedTranslationBundle = {
      translations: {
        adf9567b8964v83c: {
          text: '{VAR_PLURAL, plural, =1 {user} other {users}',
          placeholderNames: ['VAR_PLURAL']
        } as ParsedTranslation
      },
      locale: null,
      diagnostics: null
    } as ParsedTranslationBundle;

    const parsedTranslation: ParsedTranslation = {
      placeholderNames: ['INTERPOLATION', 'ICU'],
      text: 'You can invite {$INTERPOLATION} {$ICU} to your account.'
    } as ParsedTranslation;

    const templateMessage: TemplateMessage = new TemplateElementMessage(message, placeholdersMap, false, []);

    const result = placeholderFiller.fill(templateMessage, localeBundle, parsedTranslation);
    expect(result.translationText)
      .toEqual('You can invite {{usersCount}} {usersCount, plural, =1 {user} other {users} to your account.');
  });

});
