import {VariableNameGenerator} from './variable-name-generator';

describe('VariableGenerator', () => {
  const variableNameGenerator = new VariableNameGenerator();

  it('should generate variable name from nested field reference expression', () => {
    const source = '{{user.name}}';
    const target = 'userName';
    expect(variableNameGenerator.generate(source)).toEqual(target);
  });

  it('should generate variable name from nested field reference expression with pipe', () => {
    const source = '{{user.name | uppercase}}';
    const target = 'userNameUppercase';
    expect(variableNameGenerator.generate(source)).toEqual(target);
  });

  it('should generate variable name from long expression', () => {
    const source = '{{configuration.organization.address}}';
    const target = 'confOrgAddress';
    expect(variableNameGenerator.generate(source)).toEqual(target);
  });

  it('should generate variable name from expression with function call', () => {
    const source = '{{formGroup.get(\'email\').value}}';
    const target = 'formGroupGetEmailValue';
    expect(variableNameGenerator.generate(source)).toEqual(target);
  });

  it('should generate variable name from very long expression', () => {
    const source = '{{user.firstName + \' \' + user.surname + \' \' + user.address + veryLongVariableName}}';
    const target = 'userFirstNameUserSurname';
    expect(variableNameGenerator.generate(source)).toEqual(target);
  });

  it('should generate variable name from arithmetic expression', () => {
    const source = '{{100 / 10 * 2}}';
    const target = 'var100102';
    expect(variableNameGenerator.generate(source)).toEqual(target);
  });

});
