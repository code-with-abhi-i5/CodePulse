import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<{
        theme: string;
        notificationsEnabled: boolean;
        emailAlerts: boolean;
        privacy: string;
    }>;
    updateSettings(settings: any): Promise<{
        updated: boolean;
        settings: any;
    }>;
}
