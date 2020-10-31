import {TemplateElement} from '../../angular/template-parser';

const gonzales = require('gonzales-pe');

export interface Node {
  type: string;
  content: Node[] | string;
  forEach?: (node: (node: Node) => void) => void;
}

export class CssEncapsulationRemover {

  public remove(styleFileContent: string, i18nMap: TemplateElement[]): string {
    const cssClasses = Object.values(i18nMap)
      .map(value => value.classes)
      .reduce((x, y) => x.concat(y), []);

    if (cssClasses.length > 0) {
      return this.removeEncapsulation(styleFileContent, [...new Set(cssClasses)]);
    }
  }

  private removeEncapsulation(styleFileContent: string, classesToEncapsulation: string[]): string {
    const astCss: Node = gonzales.parse(this.addMissingSemicolons(styleFileContent), {syntax: 'scss'});

    const parentSelectors: Node[] = [];
    for (const className of classesToEncapsulation) {
      astCss.forEach((node: Node) => {
        if (this.hasChildByClassName(node, className)) {
          const selectorNode = this.getChildOfType(node, 'selector');
          if (!!selectorNode) {
            parentSelectors.push(selectorNode);
          }
        }
      });
    }

    parentSelectors
      .filter(selector => !!selector.content && Array.isArray(selector.content))
      .map(selector => selector.content as Node[])
      .filter(nodes => !this.hasRemovedEncapsulation(nodes))
      .forEach(nodes => nodes.unshift({type: null, content: [{type: 'ident', content: ':host ::ng-deep '}]}));

    return astCss.toString();
  }

  private hasRemovedEncapsulation(nodes: Node[]) {
    const selectors = nodes.map(n => n.content)
      .filter(n => Array.isArray(n));
    const selectorNames = this.flatten(selectors)
      .map(n => n.content);
    return selectorNames.includes('host') && selectorNames.includes('ng-deep');
  }

  private flatten(arrayOfArrays) {
    return arrayOfArrays.reduce((flat, subElem) => flat.concat(Array.isArray(subElem) ? this.flatten(subElem) : subElem), []);
  }

  private addMissingSemicolons(cssContent: string): string {
    return cssContent.replace(/(^[^}]\s+[^/]\S+:.+)([^/{\r\n;,])$/gm, '$1$2;');
  }

  private getChildOfType(node: Node, type: string): Node {
    let childNode = null;
    node.forEach((n: Node) => {
      const childType = n.type;
      if (!!childType && childType === type) {
        childNode = n;
      }
    });
    return childNode;
  }

  private hasChildByClassName(node: any, className: string): boolean {
    let hasClass = false;
    node.traverseByType('class', (n: Node) => {
      const classContent = n.content;
      if (Array.isArray(classContent) && classContent[0] != null) {
        const content = classContent[0].content;
        if (!!content && content.constructor === String && content === className) {
          hasClass = true;
        }
      }
    });
    return hasClass;
  }

}
