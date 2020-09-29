import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';

export function migrator(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    console.log(123);
    return tree;
  };
}
