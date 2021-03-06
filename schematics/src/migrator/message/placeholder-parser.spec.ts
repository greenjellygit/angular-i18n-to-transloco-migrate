import {MessageHelper} from '../utils/test.utils';
import {ParsedPlaceholdersMap, PlaceholderParser} from './placeholder-parser';

describe('PlaceholderParser', () => {
  const placeholderParser = new PlaceholderParser();

  it('should parse all placeholders for simple message', () => {
    const message = MessageHelper.builder()
      .id('id')
      .placeholders({
        INTERPOLATION: '{{company.name}}',
        INTERPOLATION_1: '{{accountBalance}}',
        VAR_SELECT: '{{userName | uppercase}}',
        VAR_PLURAL: `notification[5].text + ' :)'`
      })
      .build();

    const result: ParsedPlaceholdersMap = {
      INTERPOLATION: {
        variableName: 'companyName',
        expression: 'company.name',
      },
      INTERPOLATION_1: {
        variableName: 'accountBalance',
        expression: 'accountBalance',
      },
      VAR_SELECT: {
        variableName: 'userNameUppercase',
        expression: 'userName | uppercase',
      },
      VAR_PLURAL: {
        variableName: 'notification5Text',
        expression: `notification[5].text + ' :)'`,
      }
    };

    expect(placeholderParser.parse(message))
      .toEqual(result);
  });

  it('should parse all placeholders for nested icu placeholders', () => {

    const pluralMessage = MessageHelper.builder()
      .id('id')
      .placeholders({
        VAR_PLURAL: '{{user.lastName}}'
      })
      .build();

    const selectMessage = MessageHelper.builder()
      .id('id')
      .placeholders({
        VAR_SELECT: '{{user.firstName}}'
      })
      .placeholderToMessage({
        ICU: pluralMessage
      })
      .build();

    const message = MessageHelper.builder()
      .id('id')
      .placeholders({
        INTERPOLATION: '{{company.name}}'
      })
      .placeholderToMessage({
        ICU: selectMessage
      })
      .build();

    const result: ParsedPlaceholdersMap = {
      INTERPOLATION: {
        variableName: 'companyName',
        expression: 'company.name',
      },
      VAR_SELECT: {
        variableName: 'userFirstName',
        expression: 'user.firstName',
      },
      VAR_PLURAL: {
        variableName: 'userLastName',
        expression: 'user.lastName',
      }
    };

    expect(placeholderParser.parse(message))
      .toEqual(result);
  });

  it('should create same variable names for same expressions', () => {
    const nestedIcu = MessageHelper.builder()
      .id('id')
      .placeholders({
        VAR_SELECT: '{{company.id}}'
      })
      .build();

    const message = MessageHelper.builder()
      .id('id')
      .placeholders({
        INTERPOLATION: '{{company.id}}',
        INTERPOLATION_1: 'company.id',
        INTERPOLATION_2: 'company.postalCodes',
        INTERPOLATION_3: 'company.postalCodesssssssssssssss'
      })
      .placeholderToMessage({
        ICU: nestedIcu
      })
      .build();

    const parsed = placeholderParser.parse(message);

    expect(parsed['INTERPOLATION'].variableName).toEqual('companyId');
    expect(parsed['INTERPOLATION_1'].variableName).toEqual('companyId');
    expect(parsed['VAR_SELECT'].variableName).toEqual('companyId');
    expect(parsed['INTERPOLATION_2'].variableName).toEqual('companyPostalCodes');
    expect(parsed['INTERPOLATION_3'].variableName).toEqual('companyPostalCodes1');
  });
});
