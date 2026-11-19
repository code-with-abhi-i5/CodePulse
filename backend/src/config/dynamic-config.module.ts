import { Global, Module } from '@nestjs/common';
import { DynamicConfigService } from './dynamic-config.service';
import { EtcdWatcherService } from './etcd-watcher.service';

@Global()
@Module({
  providers: [DynamicConfigService, EtcdWatcherService],
  exports: [DynamicConfigService, EtcdWatcherService],
})
export class DynamicConfigModule {}
