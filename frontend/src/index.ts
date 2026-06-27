import { faSliders } from '@fortawesome/free-solid-svg-icons';
import type { FC } from 'react';
import { Extension, ExtensionContext } from 'shared';
import { EggMirror, fetchAllowedEggs } from './eggGate.ts';
import AdminServerPropertiesPage from './pages/AdminServerPropertiesPage.tsx';
import ServerPropertiesPage from './pages/ServerPropertiesPage.tsx';

class ComSubwayStudiosServerPropertiesExtension extends Extension {
  public cardConfigurationPage: FC | null = AdminServerPropertiesPage;
  public cardComponent: FC | null = null;

  public initialize(ctx: ExtensionContext): void {
    void fetchAllowedEggs();
    ctx.extensionRegistry.pages.server.prependComponent(EggMirror);

    ctx.extensionRegistry.routes.addServerRoute({
      name: 'Server Properties',
      icon: faSliders,
      path: '/server-properties',
      exact: true,
      element: ServerPropertiesPage,
      permission: 'server-properties.view',
    });
  }
}

export default new ComSubwayStudiosServerPropertiesExtension();
