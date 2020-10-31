import {ArrayUtils} from '../../utils/array.utils';
import {StringUtils} from '../../utils/string.utils';

const gonzales = require('gonzales-pe');

export interface Node {
  type: string;
  content: Node[] | string;
  forEach?: (node: (node: Node) => void) => void;
}

export class CssEncapsulationRemover {

  public remove(styleFileContent: string, classes: string[]): string {
    if (StringUtils.isBlank(styleFileContent)) {
      return styleFileContent;
    }

    const astCss: Node = gonzales.parse(this.addMissingSemicolons(styleFileContent), {syntax: 'scss'});

    const parentSelectors: Node[] = [];
    for (const className of new Set(classes)) {
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

  private hasRemovedEncapsulation(nodes: Node[]): boolean {
    const selectorNames = nodes.map(n => n.content)
      .filter(n => Array.isArray(n))
      .map(n => n as Array<Node>)
      .flat(e => e)
      .map((n: Node) => n.content);
    return selectorNames.includes('host') && selectorNames.includes('ng-deep');
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
