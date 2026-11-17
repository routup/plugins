import { App } from 'routup';
import { DController, DGet, mountControllers } from '@routup/decorators';

@DController('/health')
class HealthController {
    @DGet('')
    check() {
        return { ok: true };
    }
}

@DController('/version')
class VersionController {
    constructor(private readonly version: string) {}

    @DGet('')
    show() {
        return { version: this.version };
    }
}

export const app = new App();

// a class is created with new HealthController(); pass an instance for arguments
mountControllers(app, [HealthController, new VersionController('1.4.0')]);
