/**
 * @file virtual-file-system.module.ts
 * @description NestJS module configuring [SANDBOX-VFS-056]: In-Memory Virtual File System (VFS) with File-Descriptor Quotas & Path Traversal Guard.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { VirtualFileSystemService } from './virtual-file-system.service';
import { VirtualFileSystemController } from './virtual-file-system.controller';

@Module({
  controllers: [VirtualFileSystemController],
  providers: [VirtualFileSystemService],
  exports: [VirtualFileSystemService],
})
export class VirtualFileSystemModule {}
