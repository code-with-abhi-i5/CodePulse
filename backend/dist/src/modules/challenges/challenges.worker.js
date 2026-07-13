"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChallengesWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengesWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const challenges_service_1 = require("./challenges.service");
let ChallengesWorker = ChallengesWorker_1 = class ChallengesWorker extends bullmq_1.WorkerHost {
    challengesService;
    logger = new common_1.Logger(ChallengesWorker_1.name);
    constructor(challengesService) {
        super();
        this.challengesService = challengesService;
    }
    async process(job) {
        this.logger.log(`Processing challenge job: ${job.name}`);
        if (job.name === 'generate-daily-challenges') {
            await this.challengesService.generateDailyChallenges();
            this.logger.log('Daily challenges generated successfully via worker.');
        }
    }
};
exports.ChallengesWorker = ChallengesWorker;
exports.ChallengesWorker = ChallengesWorker = ChallengesWorker_1 = __decorate([
    (0, bullmq_1.Processor)('challenges'),
    __metadata("design:paramtypes", [challenges_service_1.ChallengesService])
], ChallengesWorker);
//# sourceMappingURL=challenges.worker.js.map