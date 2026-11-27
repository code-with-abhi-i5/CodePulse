export interface AstNode {
  type: number; // 1-255
  id: number;
  name: string;
  children?: AstNode[];
}

export class BinaryAstSerializer {
  public serialize(node: AstNode): Buffer {
    const nameBuf = Buffer.from(node.name, 'utf8');
    const header = Buffer.alloc(7 + nameBuf.length);
    header.writeUInt8(node.type, 0);
    header.writeUInt32BE(node.id, 1);
    header.writeUInt16BE(nameBuf.length, 5);
    nameBuf.copy(header, 7);

    const children = node.children || [];
    const childrenCountBuf = Buffer.alloc(2);
    childrenCountBuf.writeUInt16BE(children.length, 0);

    const childBuffers = children.map(c => this.serialize(c));
    return Buffer.concat([header, childrenCountBuf, ...childBuffers]);
  }

  public deserialize(buf: Buffer): { node: AstNode; bytesRead: number } {
    let offset = 0;
    const type = buf.readUInt8(offset);
    offset += 1;

    const id = buf.readUInt32BE(offset);
    offset += 4;

    const nameLen = buf.readUInt16BE(offset);
    offset += 2;

    const name = buf.subarray(offset, offset + nameLen).toString('utf8');
    offset += nameLen;

    const childrenCount = buf.readUInt16BE(offset);
    offset += 2;

    const children: AstNode[] = [];
    for (let i = 0; i < childrenCount; i++) {
      const childRes = this.deserialize(buf.subarray(offset));
      children.push(childRes.node);
      offset += childRes.bytesRead;
    }

    return {
      node: { type, id, name, children },
      bytesRead: offset
    };
  }
}
