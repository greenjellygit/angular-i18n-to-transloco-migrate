import {TemplateElement} from '../../angular/template-parser';
import {CssEncapsulationRemover} from './css-encapsulation-remover';

describe('CssEncapsulationRemover', () => {
  const cssEncapsulationRemover = new CssEncapsulationRemover();

  it('should remove encapsulation of class used in translations', () => {

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

    const templateElements: TemplateElement[] = [
      {
        classes: ['aaa', 'ddd']
      } as TemplateElement
    ];

    expect(cssEncapsulationRemover.remove(scssSource, templateElements))
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

    const templateElements: TemplateElement[] = [
      {
        classes: ['aaa']
      } as TemplateElement
    ];

    expect(cssEncapsulationRemover.remove(scssSource, templateElements))
      .toEqual(scssResult);
  });
});
