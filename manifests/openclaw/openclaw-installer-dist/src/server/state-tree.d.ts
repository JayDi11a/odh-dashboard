export interface TreeEntry {
    key: string;
    path: string;
    content: string;
}
export declare function loadTextTree(root: string): Promise<TreeEntry[]>;
