/**
 * SkyLark — DSA 4: TREE
 * Manual Tree implementation to represent destination geographic hierarchy.
 *
 * Example:
 *   WORLD
 *   ├── ASIA
 *   │   ├── INDIA
 *   │   │   ├── Mumbai
 *   │   │   ├── Delhi
 *   │   │   └── Bengaluru
 *   │   └── UAE
 *   │       └── Dubai
 *   └── EUROPE
 *       ├── UK
 *       │   └── London
 *       └── FRANCE
 *           └── Paris
 *
 * Methods:
 *  - insert(parentName: string, name: string, code?: string): boolean
 *  - find(name: string): TreeNode | null
 *  - traverse(): object
 */

export interface TreeNodeData {
  name: string;
  code?: string;
  children: TreeNodeData[];
}

export class TreeNode {
  name: string;
  code?: string;
  children: TreeNode[] = [];

  constructor(name: string, code?: string) {
    this.name = name;
    this.code = code;
  }
}

export class Tree {
  root: TreeNode;

  constructor(rootName = 'WORLD') {
    this.root = new TreeNode(rootName);
  }

  /**
   * Insert: Adds a new child node under a designated parent node.
   * Time Complexity: O(n)
   */
  insert(parentName: string, name: string, code?: string): boolean {
    const parentNode = this.find(parentName);
    if (!parentNode) return false;
    const childNode = new TreeNode(name, code);
    parentNode.children.push(childNode);
    return true;
  }

  /**
   * Find: Locates a node by its name (case-insensitive).
   * Time Complexity: O(n)
   */
  find(name: string, current: TreeNode = this.root): TreeNode | null {
    if (current.name.toLowerCase() === name.toLowerCase()) {
      return current;
    }
    for (const child of current.children) {
      const match = this.find(name, child);
      if (match) return match;
    }
    return null;
  }

  /**
   * Traverse: Returns a serializable nested hierarchy representation.
   */
  traverse(current: TreeNode = this.root): TreeNodeData {
    return {
      name: current.name,
      code: current.code,
      children: current.children.map(child => this.traverse(child)),
    };
  }
}
