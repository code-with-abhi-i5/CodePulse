/**
 * @file continuous-keystroke-dynamics-behavioral.module.ts
 * @description NestJS module configuring [SEC-BIOMETRICS-115]: Continuous Keystroke Dynamics Behavioral Biometrics Authentication Engine.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ContinuousKeystrokeDynamicsBehavioralService } from './continuous-keystroke-dynamics-behavioral.service';
import { ContinuousKeystrokeDynamicsBehavioralController } from './continuous-keystroke-dynamics-behavioral.controller';

@Module({
  controllers: [ContinuousKeystrokeDynamicsBehavioralController],
  providers: [ContinuousKeystrokeDynamicsBehavioralService],
  exports: [ContinuousKeystrokeDynamicsBehavioralService],
})
export class ContinuousKeystrokeDynamicsBehavioralModule {}
