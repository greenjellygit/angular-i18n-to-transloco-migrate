import {CssEncapsulationRemover} from './css-encapsulation-remover';

describe('CssEncapsulationRemover', () => {
  const cssEncapsulationRemover = new CssEncapsulationRemover();

  it('should remove encapsulation of classes used in translations', () => {

    const scssSource = `
    .aaa {
      background-color: red;
    }

    .bbb {
      color: black;
    }

    .ccc {
      .ddd {
        color: green;
      }
    }
  `;

    const scssResult = `
    :host ::ng-deep .aaa {
      background-color: red;
    }

    .bbb {
      color: black;
    }

    :host ::ng-deep .ccc {
      .ddd {
        color: green;
      }
    }
  `;

    const classesUsedInMessage = ['aaa', 'ddd'];

    expect(cssEncapsulationRemover.remove(scssSource, classesUsedInMessage))
      .toEqual(scssResult);
  });

  it('should not duplicate host and ng-deep selectors', () => {
    const scssSource = `
    :host ::ng-deep .aaa {
      background-color: red;
    }

    .bbb {
      color: black;
    }
  `;

    const scssResult = `
    :host ::ng-deep .aaa {
      background-color: red;
    }

    .bbb {
      color: black;
    }
  `;

    const classesUsedInMessage = ['aaa'];

    expect(cssEncapsulationRemover.remove(scssSource, classesUsedInMessage))
      .toEqual(scssResult);
  });
});
