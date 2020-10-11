const {parse, stringify} = require('scss-parser');
const createQueryWrapper = require('query-ast');
import jsBeautify = require('js-beautify');

export class CssUtil {

  public static encapsulateClasses(styleFileContent: string, classesToEncapsulate): string {
    let astCss: Node;
    try {
      astCss = parse(this.addMissingSemicolons(styleFileContent));
    } catch (e) {
      const x = jsBeautify.css(styleFileContent);
      console.log(e);
    }
    const $ = createQueryWrapper(astCss);

    classesToEncapsulate.forEach(className => {
      const selector = $('class').filter(e => e.node.value.some(k => k.value === className));
      if (selector.nodes.length > 0) {
        const selectorElements = selector.nodes[0].parent.node.value;
        selectorElements.unshift(this.createSelector('space', ' '));
        selectorElements.unshift(this.createSelector('pseudo_class', ':ng-deep'));
        selectorElements.unshift(this.createSelector('space', ' '));
        selectorElements.unshift(this.createSelector('pseudo_class', 'host'));
      }
    });

    return stringify(astCss);
  }

  private static createSelector = (type: string, value: string) => ({type, value: [{type: 'identifier', value}]});

  private static addMissingSemicolons(cssContent: string): string {
    return cssContent.replace(/(^[^}]\s+[^/]\S+:.+)([^/{\r\n;,])$/gm, '$1$2;');
  }

}
