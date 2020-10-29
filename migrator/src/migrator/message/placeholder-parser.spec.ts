import {Message} from '@angular/compiler/src/i18n/i18n_ast';
import {ParsedPlaceholdersMap, PlaceholderParser} from './placeholder-parser';

describe('parsePlaceholders', () => {
  const placeholderParser = new PlaceholderParser();

  it('should parse all placeholders for simple message', () => {
    const message: Message = {
      id: 'id',
      customId: 'customId',
      legacyIds: null,
      meaning: '',
      description: '',
      placeholders: {
        INTERPOLATION: '{{company.name}}',
        INTERPOLATION_1: '{{accountBalance}}',
        VAR_SELECT: '{{userName | uppercase}}',
        VAR_PLURAL: `notification[5].text + ' :)'`
      },
      placeholderToMessage: {},
      nodes: [],
      sources: []
    };

    const result: ParsedPlaceholdersMap = {
      INTERPOLATION: {
        variableName: 'companyName',
        expression: 'company.name',
        rawExpression: '{{company.name}}'
      },
      INTERPOLATION_1: {
        variableName: 'accountBalance',
        expression: 'accountBalance',
        rawExpression: '{{accountBalance}}'
      },
      VAR_SELECT: {
        variableName: 'userNameUppercase',
        expression: 'userName | uppercase',
        rawExpression: '{{userName | uppercase}}'
      },
      VAR_PLURAL: {
        variableName: 'notification5Text',
        expression: `notification[5].text + ' :)'`,
        rawExpression: `notification[5].text + ' :)'`
      }
    };

    expect(placeholderParser.parse(message))
      .toEqual(result);
  });

  it('should parse all placeholders for nested icu placeholders', () => {
    const message: Message = {
      id: 'id',
      customId: 'customId',
      legacyIds: null,
      meaning: '',
      description: '',
      placeholders: {
        INTERPOLATION: '{{company.name}}'
      },
      placeholderToMessage: {
        ICU: {
          id: 'id',
          customId: 'customId',
          legacyIds: null,
          meaning: '',
          description: '',
          placeholders: {
            VAR_SELECT: '{{user.firstName}}'
          },
          nodes: [],
          sources: [],
          placeholderToMessage: {
            ICU: {
              id: 'id',
              customId: 'customId',
              legacyIds: null,
              meaning: '',
              description: '',
              placeholders: {
                VAR_PLURAL: '{{user.lastName}}'
              },
              nodes: [],
              sources: [],
              placeholderToMessage: {}
            }
          }
        }
      },
      nodes: [],
      sources: []
    };

    const result: ParsedPlaceholdersMap = {
      INTERPOLATION: {
        variableName: 'companyName',
        expression: 'company.name',
        rawExpression: '{{company.name}}'
      },
      VAR_SELECT: {
        variableName: 'userFirstName',
        expression: 'user.firstName',
        rawExpression: '{{user.firstName}}'
      },
      VAR_PLURAL: {
        variableName: 'userLastName',
        expression: 'user.lastName',
        rawExpression: '{{user.lastName}}'
      }
    };

    expect(placeholderParser.parse(message))
      .toEqual(result);
  });

  it('should create same variable names for same expressions', () => {
    const message: Message = {
      id: 'id',
      customId: 'customId',
      legacyIds: null,
      meaning: '',
      description: '',
      placeholders: {
        INTERPOLATION: '{{company.id}}',
        INTERPOLATION_1: 'company.id',
        INTERPOLATION_2: 'company.postalCodes',
        INTERPOLATION_3: 'company.postalCodesssssssssssssss'
      },
      placeholderToMessage: {
        ICU: {
          id: 'id',
          customId: 'customId',
          legacyIds: null,
          meaning: '',
          description: '',
          placeholders: {
            VAR_SELECT: '{{company.id}}'
          },
          nodes: [],
          sources: [],
          placeholderToMessage: {}
        }
      },
      nodes: [],
      sources: []
    };

    const parsed = placeholderParser.parse(message);

    expect(parsed['INTERPOLATION'].variableName).toEqual('companyId');
    expect(parsed['INTERPOLATION_1'].variableName).toEqual('companyId');
    expect(parsed['VAR_SELECT'].variableName).toEqual('companyId');
    expect(parsed['INTERPOLATION_2'].variableName).toEqual('companyPostalCodes');
    expect(parsed['INTERPOLATION_3'].variableName).toEqual('companyPostalCodes1');
  });
});
